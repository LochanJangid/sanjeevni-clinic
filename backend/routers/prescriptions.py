from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, Field

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

db = Database()


class MedicineItem(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=200)
    dosage: Optional[str] = "1 Tablet"
    frequency: Optional[str] = "Once daily"
    duration: Optional[str] = "7 Days"
    instructions: Optional[str] = "Take with water after food"


class CreatePrescriptionRequest(BaseModel):
    appointment_id: int
    diagnosis: str = Field(min_length=2)
    instructions: Optional[str] = None
    medicines: List[MedicineItem] = []


## GET PRESCRIPTION FOR AN APPOINTMENT ----------
@router.get("/appointment/{appointment_id}")
def get_appointment_prescription(
    appointment_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)

    # Fetch prescription with doctor & patient information
    rx = db.query(
        """
        SELECT
            p.id,
            p.appointment_id,
            p.doctor_id,
            p.user_id,
            p.diagnosis,
            p.instructions,
            p.created_at,
            d.name AS doctor_name,
            c.category_name,
            dp.qualification,
            dp.clinic_address,
            u.username AS patient_name,
            u.mobile AS patient_mobile,
            u.email AS patient_email,
            a.appointment_date,
            a.appointment_time
        FROM prescriptions p
        JOIN doctors d ON p.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        JOIN users u ON p.user_id = u.id
        JOIN appointments a ON p.appointment_id = a.id
        WHERE p.appointment_id = %s
        """,
        (appointment_id,),
        decision="fetchone",
    )

    if not rx:
        return {"prescription": None}

    # Verify authorization: patient himself, or the prescribing doctor, or admin
    if claims.get("role") == "patient" and claims.get("id") != rx["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    if claims.get("role") == "doctor" and claims.get("doctor_id") != rx["doctor_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Fetch medicines
    medicines = db.query(
        """
        SELECT id, medicine_name, dosage, frequency, duration, instructions
        FROM prescription_medicines
        WHERE prescription_id = %s
        ORDER BY id ASC
        """,
        (rx["id"],),
        decision="fetchall",
    )

    rx["medicines"] = medicines or []
    return {"prescription": rx}


## GET PATIENT'S ALL PRESCRIPTIONS ----------
@router.get("/patient/{user_id}")
def get_patient_prescriptions(
    user_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") == "patient" and claims.get("id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    prescriptions = db.query(
        """
        SELECT
            p.id,
            p.appointment_id,
            p.doctor_id,
            p.user_id,
            p.diagnosis,
            p.instructions,
            p.created_at,
            d.name AS doctor_name,
            c.category_name,
            a.appointment_date,
            a.appointment_time
        FROM prescriptions p
        JOIN doctors d ON p.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        JOIN appointments a ON p.appointment_id = a.id
        WHERE p.user_id = %s
        ORDER BY p.created_at DESC
        """,
        (user_id,),
        decision="fetchall",
    )

    result = []
    for rx in prescriptions:
        meds = db.query(
            """
            SELECT id, medicine_name, dosage, frequency, duration, instructions
            FROM prescription_medicines
            WHERE prescription_id = %s
            ORDER BY id ASC
            """,
            (rx["id"],),
            decision="fetchall",
        )
        rx_item = dict(rx)
        rx_item["medicines"] = meds or []
        result.append(rx_item)

    return result


## CREATE / ISSUE PRESCRIPTION (DOCTOR & ADMIN) ----------
@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_prescription(
    payload: CreatePrescriptionRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("doctor", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors or clinicians can issue prescriptions.")

    # Find appointment
    appt = db.query(
        """
        SELECT id, user_id, doctor_id, status FROM appointments WHERE id = %s
        """,
        (payload.appointment_id,),
        decision="fetchone",
    )

    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if claims.get("role") == "doctor" and claims.get("doctor_id") != appt["doctor_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only prescribe for your own appointments.")

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            # Check if prescription already exists for this appointment
            cur.execute("SELECT id FROM prescriptions WHERE appointment_id = %s", (payload.appointment_id,))
            existing = cur.fetchone()

            if existing:
                rx_id = existing[0]
                cur.execute(
                    """
                    UPDATE prescriptions
                    SET diagnosis = %s, instructions = %s, created_at = NOW()
                    WHERE id = %s
                    """,
                    (payload.diagnosis, payload.instructions, rx_id),
                )
                cur.execute("DELETE FROM prescription_medicines WHERE prescription_id = %s", (rx_id,))
            else:
                cur.execute(
                    """
                    INSERT INTO prescriptions (appointment_id, doctor_id, user_id, diagnosis, instructions, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    RETURNING id
                    """,
                    (payload.appointment_id, appt["doctor_id"], appt["user_id"], payload.diagnosis, payload.instructions),
                )
                rx_id = cur.fetchone()[0]

            # Insert medicines
            for med in payload.medicines:
                cur.execute(
                    """
                    INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (rx_id, med.medicine_name, med.dosage, med.frequency, med.duration, med.instructions),
                )

            # Mark appointment as completed
            cur.execute("UPDATE appointments SET status = 'completed' WHERE id = %s", (payload.appointment_id,))
            conn.commit()

    return {"success": True, "prescription_id": rx_id, "msg": "Prescription issued successfully."}
