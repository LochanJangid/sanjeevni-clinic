import os
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel

from database.connection import Database

router = APIRouter(prefix="/appointments", tags=["appointments"])

db = Database()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
CLINIC_OPENS = time(9, 0)
CLINIC_CLOSES = time(17, 0)
APPOINTMENT_MINUTES = 30


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: time


class AppointmentReschedule(BaseModel):
    appointment_date: date
    appointment_time: time


def authenticated_user_id(authorization: str | None) -> int:
    if not authorization or not authorization.startswith("Bearer ") or not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid login session is required",
        )

    try:
        payload = jwt.decode(
            authorization.split(" ", 1)[1],
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        return int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or expired. Please log in again.",
        ) from exc


def validate_slot(slot_date: date, slot_time: time) -> None:
    if slot_time.tzinfo is not None:
        raise HTTPException(
            status_code=400,
            detail="Appointment times must use the clinic's local time.",
        )

    now = datetime.now()
    starts_at = datetime.combine(slot_date, slot_time)
    closes_at = datetime.combine(slot_date, CLINIC_CLOSES)

    if starts_at <= now:
        raise HTTPException(status_code=400, detail="Choose an appointment time in the future.")

    if slot_time < CLINIC_OPENS or starts_at + timedelta(minutes=APPOINTMENT_MINUTES) > closes_at:
        raise HTTPException(
            status_code=400,
            detail="Appointments are available in 30-minute slots between 09:00 and 17:00.",
        )

    if slot_time.minute not in (0, 30) or slot_time.second or slot_time.microsecond:
        raise HTTPException(
            status_code=400,
            detail="Choose one of the available 30-minute appointment times.",
        )


def lock_doctor_day(cursor, doctor_id: int, slot_date: date) -> None:
    cursor.execute(
        "SELECT pg_advisory_xact_lock(%s, %s)",
        (doctor_id, slot_date.toordinal()),
    )


def find_conflict(cursor, doctor_id: int, slot_date: date, slot_time: time, exclude_id: int | None = None):
    query = """
        SELECT id
        FROM appointments
        WHERE doctor_id = %s
          AND appointment_date = %s
          AND appointment_time < %s + INTERVAL '30 minutes'
          AND appointment_time + INTERVAL '30 minutes' > %s
          AND status IS DISTINCT FROM 'cancelled'
    """
    params = [doctor_id, slot_date, slot_time, slot_time]
    if exclude_id is not None:
        query += " AND id <> %s"
        params.append(exclude_id)
    query += " LIMIT 1"
    cursor.execute(query, tuple(params))
    return cursor.fetchone()


@router.post("/book", status_code=status.HTTP_201_CREATED)
def book_appointment(
    appointment: AppointmentCreate,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = authenticated_user_id(authorization)
    validate_slot(appointment.appointment_date, appointment.appointment_time)

    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            lock_doctor_day(cursor, appointment.doctor_id, appointment.appointment_date)

            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Patient account not found.")

            cursor.execute("SELECT id, fees FROM doctors WHERE id = %s", (appointment.doctor_id,))
            doc_row = cursor.fetchone()
            if doc_row is None:
                raise HTTPException(status_code=404, detail="Doctor not found.")
            doc_fees = doc_row[1] if len(doc_row) > 1 else 500

            if find_conflict(
                cursor,
                appointment.doctor_id,
                appointment.appointment_date,
                appointment.appointment_time,
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="That appointment time was just booked. Choose another available time.",
                )

            cursor.execute(
                """
                INSERT INTO appointments
                    (user_id, doctor_id, appointment_date, appointment_time)
                VALUES (%s, %s, %s, %s)
                RETURNING id, user_id, doctor_id, appointment_date, appointment_time, status
                """,
                (
                    user_id,
                    appointment.doctor_id,
                    appointment.appointment_date,
                    appointment.appointment_time,
                ),
            )
            created = cursor.fetchone()
            columns = [column.name for column in cursor.description]
            appt_dict = dict(zip(columns, created))

            # Automatically create pending invoice
            cursor.execute(
                """
                INSERT INTO payments (appointment_id, user_id, amount, payment_method, status, created_at)
                VALUES (%s, %s, %s, 'upi', 'pending', NOW())
                ON CONFLICT (appointment_id) DO NOTHING
                """,
                (appt_dict["id"], user_id, doc_fees),
            )

    return {"success": True, "appointment": appt_dict}


@router.get("/user/{user_id}")
def get_user_appointments(
    user_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_user_id(authorization)
    if claims != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own appointments.",
        )

    return db.query(
        """
        SELECT
            a.id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            d.id AS doctor_id,
            d.name AS doctor_name,
            d.fees,
            c.category_name,
            COALESCE(p.status, 'pending') AS payment_status,
            p.amount AS payment_amount,
            p.transaction_id,
            EXISTS (SELECT 1 FROM prescriptions rx WHERE rx.appointment_id = a.id) AS has_prescription
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE a.user_id = %s
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """,
        (user_id,),
        decision="fetchall",
    )


@router.get("/{appointment_id}")
def get_appointment_detail(
    appointment_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims_id = authenticated_user_id(authorization)
    appt = db.query(
        """
        SELECT
            a.id,
            a.user_id,
            a.doctor_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.created_at,
            d.name AS doctor_name,
            d.fees,
            c.category_name,
            dp.clinic_address,
            dp.qualification,
            u.username AS patient_name,
            u.email AS patient_email,
            u.mobile AS patient_mobile,
            COALESCE(p.status, 'pending') AS payment_status,
            p.amount AS payment_amount,
            p.payment_method,
            p.transaction_id,
            p.paid_at,
            EXISTS (SELECT 1 FROM prescriptions rx WHERE rx.appointment_id = a.id) AS has_prescription
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE a.id = %s
        """,
        (appointment_id,),
        decision="fetchone",
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return appt


@router.post("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = authenticated_user_id(authorization)

    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT status, appointment_date, appointment_time
                FROM appointments
                WHERE id = %s AND user_id = %s
                FOR UPDATE
                """,
                (appointment_id, user_id),
            )
            appointment = cursor.fetchone()
            if appointment is None:
                raise HTTPException(status_code=404, detail="Appointment not found.")
            if appointment[0] == "cancelled":
                raise HTTPException(status_code=409, detail="This appointment is already cancelled.")
            if appointment[0] == "completed":
                raise HTTPException(status_code=409, detail="Completed appointments cannot be cancelled.")
            if appointment[1] <= date.today() and datetime.combine(appointment[1], appointment[2]) <= datetime.now():
                raise HTTPException(status_code=409, detail="Past visits cannot be cancelled.")

            cursor.execute(
                "UPDATE appointments SET status = 'cancelled' WHERE id = %s",
                (appointment_id,),
            )

    return {"success": True, "msg": "Appointment cancelled."}


@router.put("/{appointment_id}/reschedule")
def reschedule_appointment(
    appointment_id: int,
    request: AppointmentReschedule,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    user_id = authenticated_user_id(authorization)
    validate_slot(request.appointment_date, request.appointment_time)

    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT doctor_id, appointment_date, status
                FROM appointments
                WHERE id = %s AND user_id = %s
                FOR UPDATE
                """,
                (appointment_id, user_id),
            )
            current = cursor.fetchone()
            if current is None:
                raise HTTPException(status_code=404, detail="Appointment not found.")
            doctor_id, _, current_status = current
            if current_status in ("cancelled", "completed"):
                raise HTTPException(
                    status_code=409,
                    detail="This appointment can no longer be rescheduled.",
                )

            lock_doctor_day(cursor, doctor_id, request.appointment_date)
            if find_conflict(
                cursor,
                doctor_id,
                request.appointment_date,
                request.appointment_time,
                exclude_id=appointment_id,
            ):
                raise HTTPException(
                    status_code=409,
                    detail="That time is no longer available. Select a different slot.",
                )

            cursor.execute(
                """
                UPDATE appointments
                SET appointment_date = %s, appointment_time = %s
                WHERE id = %s
                RETURNING id, appointment_date, appointment_time, status
                """,
                (request.appointment_date, request.appointment_time, appointment_id),
            )
            updated = cursor.fetchone()
            columns = [column.name for column in cursor.description]

    return {"success": True, "appointment": dict(zip(columns, updated))}
