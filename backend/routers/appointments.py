from fastapi import APIRouter
from pydantic import BaseModel
from database.connection import Database
from datetime import date, time


router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

db = Database()


# ---------------- SCHEMA ----------------

class AppointmentCreate(BaseModel):
    user_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time


# ---------------- BOOK APPOINTMENT ----------------

@router.post("/book")
def book_appointment(appointment: AppointmentCreate):

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
            appointment.appointment_time
        )
    )

    if existing is not None:
        return {
            "success": False,
            "msg": "This appointment slot is already booked"
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
            appointment.appointment_time
        )
    )

    return {
        "success": True,
        "msg": "Appointment booked successfully",
        "appointment": new_appointment
    }


# ---------------- USER APPOINTMENTS ----------------

@router.get("/user/{user_id}")
def get_user_appointments(user_id: int):

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
        decision="fetchall"
    )

    return appointments