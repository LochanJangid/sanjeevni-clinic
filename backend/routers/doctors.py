from datetime import date, datetime, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Header, status
from pydantic import BaseModel, Field

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/doctors", tags=["doctors"])

db = Database()


## SCHEMAS -------------------
class DoctorProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category_id: int
    fees: int = Field(gt=0)
    qualification: Optional[str] = None
    experience_years: Optional[int] = Field(default=0, ge=0)
    about: Optional[str] = None
    clinic_address: Optional[str] = None


class AvailabilitySlot(BaseModel):
    day_of_week: int = Field(ge=1, le=7)  # 1=Mon, ..., 7=Sun
    start_time: str  # "09:00"
    end_time: str  # "13:00"


class UpdateAvailabilityRequest(BaseModel):
    schedules: List[AvailabilitySlot]


## GET ALL CATEGORIES ----------
@router.get("/categories")
def get_categories():
    return db.query(
        """
        SELECT c.id, c.category_name, COUNT(d.id) AS doctor_count
        FROM categories c
        LEFT JOIN doctors d ON c.id = d.category_id
        GROUP BY c.id, c.category_name
        ORDER BY c.id ASC
        """,
        decision="fetchall",
    )


## GET ALL DOCTORS ------------
@router.get("/get_doctors")
def get_doctors(
    category_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    sql = """
        SELECT
            d.id,
            d.name,
            d.category_id,
            d.fees,
            COALESCE(c.category_name, 'General Care') AS category_name,
            COALESCE(dp.qualification, 'Specialist Consultant') AS qualification,
            COALESCE(dp.experience_years, 5) AS experience_years,
            COALESCE(dp.about, 'Experienced medical practitioner at Sanjeevni Clinic.') AS about,
            COALESCE(dp.clinic_address, 'Sanjeevni Central Clinic') AS clinic_address
        FROM doctors d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        WHERE 1=1
    """
    params = []
    if category_id is not None:
        sql += " AND d.category_id = %s"
        params.append(category_id)
    if search and search.strip():
        sql += " AND (d.name ILIKE %s OR c.category_name ILIKE %s OR dp.qualification ILIKE %s)"
        pattern = f"%{search.strip()}%"
        params.extend([pattern, pattern, pattern])

    sql += " ORDER BY d.id ASC"
    doctors_list = db.query(sql, tuple(params), decision="fetchall")
    return doctors_list


## GET DOCTOR BY ID ------------
@router.get("/get_doctor/{doctor_id}")
def get_doctor(doctor_id: int):
    doctor = db.query(
        """
        SELECT
            d.id,
            d.name,
            d.category_id,
            d.fees,
            COALESCE(c.category_name, 'General Care') AS category_name,
            COALESCE(dp.qualification, 'Specialist Consultant') AS qualification,
            COALESCE(dp.experience_years, 5) AS experience_years,
            COALESCE(dp.about, 'Experienced medical practitioner at Sanjeevni Clinic.') AS about,
            COALESCE(dp.clinic_address, 'Sanjeevni Central Clinic') AS clinic_address
        FROM doctors d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        WHERE d.id = %s
        """,
        (doctor_id,),
        decision="fetchone",
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    return doctor


## GET DOCTOR AVAILABILITY RULES ---------
@router.get("/{doctor_id}/availability")
def get_doctor_availability(doctor_id: int):
    rules = db.query(
        """
        SELECT id, doctor_id, day_of_week, start_time::text, end_time::text
        FROM doctor_availability
        WHERE doctor_id = %s
        ORDER BY day_of_week ASC, start_time ASC
        """,
        (doctor_id,),
        decision="fetchall",
    )
    return rules


## UPDATE DOCTOR AVAILABILITY SCHEDULE ---------
@router.put("/{doctor_id}/availability")
def update_doctor_availability(
    doctor_id: int,
    payload: UpdateAvailabilityRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    # Only the doctor themselves or an admin can update schedule
    if claims.get("role") != "admin" and (claims.get("role") != "doctor" or claims.get("doctor_id") != doctor_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit doctor availability.")

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM doctor_availability WHERE doctor_id = %s", (doctor_id,))
            for item in payload.schedules:
                st = datetime.strptime(item.start_time, "%H:%M").time()
                et = datetime.strptime(item.end_time, "%H:%M").time()
                cur.execute(
                    """
                    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (doctor_id, item.day_of_week, st, et),
                )
            conn.commit()

    return {"success": True, "msg": "Doctor schedule updated successfully."}


## GET AVAILABLE SLOTS (INTEGRATED WITH REAL AVAILABILITY) ---------
@router.get("/get_doctor_slots/{doctor_id}")
def get_doctor_slots(
    doctor_id: int,
    selected_date: date | None = Query(default=None, alias="date"),
):
    doctor = db.query(
        "SELECT id, name FROM doctors WHERE id = %s",
        (doctor_id,),
        decision="fetchone",
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    slot_date = selected_date or date.today()
    if slot_date < date.today():
        raise HTTPException(status_code=400, detail="Choose a current or future date.")

    # 1=Mon, ..., 7=Sun
    day_of_week = slot_date.weekday() + 1

    # Check specific availability for this day of week
    day_schedules = db.query(
        """
        SELECT start_time, end_time
        FROM doctor_availability
        WHERE doctor_id = %s AND day_of_week = %s
        ORDER BY start_time ASC
        """,
        (doctor_id, day_of_week),
        decision="fetchall",
    )

    # If doctor has availability configured, check if off today
    has_any_schedule = db.query(
        "SELECT 1 FROM doctor_availability WHERE doctor_id = %s LIMIT 1",
        (doctor_id,),
        decision="fetchone",
    )

    if has_any_schedule and not day_schedules:
        # Doctor has configured schedule but has no slots on this weekday
        return {
            "doctor_id": doctor_id,
            "date": slot_date.isoformat(),
            "slots": [],
            "message": "The doctor does not take appointments on this day of the week.",
        }

    # If no custom schedule exists in db, use default 09:00 - 17:00
    if not day_schedules:
        time_windows = [(time(9, 0), time(17, 0))]
    else:
        time_windows = [(row["start_time"], row["end_time"]) for row in day_schedules]

    occupied_slots = db.query(
        """
        SELECT appointment_time
        FROM appointments
        WHERE doctor_id = %s AND appointment_date = %s
          AND status IS DISTINCT FROM 'cancelled'
        """,
        (doctor_id, slot_date),
        decision="fetchall",
    )

    booked_times = [row["appointment_time"] for row in occupied_slots]
    slots = []
    now = datetime.now()

    for start_t, end_t in time_windows:
        schedule_start = datetime.combine(slot_date, start_t)
        schedule_end = datetime.combine(slot_date, end_t)
        current = schedule_start

        while current + timedelta(minutes=30) <= schedule_end:
            candidate_start = current.time()
            candidate_end = (current + timedelta(minutes=30)).time()
            overlaps_existing = any(
                booked_time < candidate_end
                and (datetime.combine(slot_date, booked_time) + timedelta(minutes=30)).time() > candidate_start
                for booked_time in booked_times
            )
            if not overlaps_existing and current > now:
                slots.append(current.strftime("%H:%M"))
            current += timedelta(minutes=30)

    return {
        "doctor_id": doctor_id,
        "date": slot_date.isoformat(),
        "slots": slots,
    }


## ADMIN: CREATE OR UPDATE DOCTOR ---------
@router.post("/manage")
def manage_doctor(
    payload: DoctorProfileUpdate,
    doctor_id: Optional[int] = Query(default=None),
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            if doctor_id:
                cur.execute(
                    """
                    UPDATE doctors SET name = %s, category_id = %s, fees = %s WHERE id = %s RETURNING id
                    """,
                    (payload.name, payload.category_id, payload.fees, doctor_id),
                )
                did = doctor_id
            else:
                cur.execute(
                    """
                    INSERT INTO doctors (name, category_id, fees) VALUES (%s, %s, %s) RETURNING id
                    """,
                    (payload.name, payload.category_id, payload.fees),
                )
                did = cur.fetchone()[0]

            # Upsert doctor profile
            cur.execute("SELECT id FROM doctor_profiles WHERE doctor_id = %s", (did,))
            existing_prof = cur.fetchone()
            if existing_prof:
                cur.execute(
                    """
                    UPDATE doctor_profiles
                    SET qualification = %s, experience_years = %s, about = %s, clinic_address = %s
                    WHERE doctor_id = %s
                    """,
                    (payload.qualification, payload.experience_years, payload.about, payload.clinic_address, did),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO doctor_profiles (doctor_id, qualification, experience_years, about, clinic_address, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    """,
                    (did, payload.qualification, payload.experience_years, payload.about, payload.clinic_address),
                )
            conn.commit()

    return {"success": True, "doctor_id": did}