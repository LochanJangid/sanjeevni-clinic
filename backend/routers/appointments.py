import os
from datetime import date, datetime, time

from fastapi import APIRouter, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel

from database.connection import Database


router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

db = Database()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


# ---------------- SCHEMA ----------------

class AppointmentCreate(BaseModel):
    user_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time


def decode_user_token(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization token",
        )

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        ) from exc

    return payload


# ---------------- BOOK APPOINTMENT ----------------

@router.post("/book")
def book_appointment(
    appointment: AppointmentCreate,
    authorization: str | None = Header(default=None, alias="Authorization")
):
    token_payload = decode_user_token(authorization)
    token_user_id = str(token_payload.get("sub"))

    if token_user_id != str(appointment.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only book appointments for your own account",
        )

    user = db.query(
        "SELECT id FROM users WHERE id = %s",
        (appointment.user_id,),
        decision="fetchone",
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    doctor = db.query(
        "SELECT id FROM doctors WHERE id = %s",
        (appointment.doctor_id,),
        decision="fetchone",
    )
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    today = date.today()
    if appointment.appointment_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date cannot be in the past",
        )

    appointment_datetime = datetime.combine(
        appointment.appointment_date,
        appointment.appointment_time,
    )
    if appointment_datetime <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment time must be in the future",
        )

    existing = db.query(
        """
        SELECT id
        FROM appointments
        WHERE doctor_id = %s
          AND appointment_date = %s
          AND appointment_time = %s
        """,
        (
            appointment.doctor_id,
            appointment.appointment_date,
            appointment.appointment_time,
        ),
        decision="fetchone",
    )

    if existing is not None:
        return {
            "success": False,
            "msg": "This appointment slot is already booked",
        }

    new_appointment = db.query(
        """
        INSERT INTO appointments
            (
                user_id,
                doctor_id,
                appointment_date,
                appointment_time
            )
        VALUES
            (%s, %s, %s, %s)
        RETURNING *
        """,
        (
            appointment.user_id,
            appointment.doctor_id,
            appointment.appointment_date,
            appointment.appointment_time,
        ),
        decision="fetchone",
    )

    return {
        "success": True,
        "msg": "Appointment booked successfully",
        "appointment": new_appointment,
    }


# ---------------- USER APPOINTMENTS ----------------

@router.get("/user/{user_id}")
def get_user_appointments(
    user_id: int,
    authorization: str | None = Header(default=None, alias="Authorization")
):
    token_payload = decode_user_token(authorization)
    token_user_id = str(token_payload.get("sub"))

    if token_user_id != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own appointments",
        )

    appointments = db.query(
        """
        SELECT
            a.id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            d.id AS doctor_id,
            d.name AS doctor_name,
            d.fees
        FROM appointments a
        JOIN doctors d
            ON a.doctor_id = d.id
        WHERE a.user_id = %s
        ORDER BY
            a.appointment_date,
            a.appointment_time
        """,
        (user_id,),
        decision="fetchall",
    )

    return appointments