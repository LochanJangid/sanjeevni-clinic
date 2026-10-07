from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from database.connection import Database

router = APIRouter(prefix="/doctors", tags=["doctors"])

db = Database()

## SCHEMA -------------------
class Doctors(BaseModel):
    name: str


## GET ALL DOCTORS ------------
@router.get("/get_doctors")
def get_doctors():
    doctors_list = db.query("SELECT * FROM doctors", query_params=tuple(), decision="fetchall")
    return doctors_list


## GET DOCTOR BY ID ------------
@router.get("/get_doctor/{doctor_id}")
def get_doctor(doctor_id: int):
    doctor = db.query(
        "SELECT * FROM doctors WHERE id = %s",
        (doctor_id,),
        decision="fetchone",
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    return doctor


## GET AVAILABLE SLOTS ---------
@router.get("/get_doctor_slots/{doctor_id}")
def get_doctor_slots(
    doctor_id: int,
    selected_date: date | None = Query(default=None, alias="date"),
):
    doctor = db.query(
        "SELECT id FROM doctors WHERE id = %s",
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

    schedule_start = datetime.combine(slot_date, time(9, 0))
    schedule_end = datetime.combine(slot_date, time(17, 0))

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
    current = schedule_start

    while current + timedelta(minutes=30) <= schedule_end:
        slot_time = current.strftime("%H:%M")
        candidate_start = current.time()
        candidate_end = (current + timedelta(minutes=30)).time()
        overlaps_existing = any(
            booked_time < candidate_end
            and (datetime.combine(slot_date, booked_time) + timedelta(minutes=30)).time() > candidate_start
            for booked_time in booked_times
        )
        if not overlaps_existing and current > datetime.now():
            slots.append(slot_time)
        current += timedelta(minutes=30)

    return {
        "doctor_id": doctor_id,
        "date": slot_date.isoformat(),
        "slots": slots,
    }