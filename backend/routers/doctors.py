from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from database.connection import Database

router = APIRouter(prefix="/doctors", tags=["doctors"])

db = Database()

## SCHEMA -------------------
class Doctors(BaseModel):
    name: str


def build_time_slots(start_hour: int = 9, end_hour: int = 17, slot_minutes: int = 30):
    start = datetime.combine(date.today(), time(start_hour, 0))
    end = datetime.combine(date.today(), time(end_hour, 0))
    slots = []
    current = start

    while current + timedelta(minutes=slot_minutes) <= end:
        slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=slot_minutes)

    return slots


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
    schedule_start = datetime.combine(slot_date, time(9, 0))
    schedule_end = datetime.combine(slot_date, time(17, 0))

    occupied_slots = db.query(
        """
        SELECT appointment_time
        FROM appointments
        WHERE doctor_id = %s AND appointment_date = %s
        """,
        (doctor_id, slot_date),
        decision="fetchall",
    )

    booked_times = {row["appointment_time"].strftime("%H:%M") for row in occupied_slots}
    slots = []
    current = schedule_start

    while current + timedelta(minutes=30) <= schedule_end:
        slot_time = current.strftime("%H:%M")
        if slot_time not in booked_times and current > datetime.now():
            slots.append(slot_time)
        current += timedelta(minutes=30)

    return {
        "doctor_id": doctor_id,
        "date": slot_date.isoformat(),
        "slots": slots,
    }