from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query, status
from pydantic import BaseModel, Field

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/admin", tags=["admin"])

db = Database()


class UpdateAppointmentStatusRequest(BaseModel):
    status: str  # booked, checked_in, in_consultation, completed, cancelled


## CLINIC KPI OVERVIEW ----------
@router.get("/stats")
def get_clinic_stats(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinic staff privileges required.")

    stats = db.query(
        """
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'patient') AS total_patients,
            (SELECT COUNT(*) FROM doctors) AS total_doctors,
            (SELECT COUNT(*) FROM appointments) AS total_appointments,
            (SELECT COUNT(*) FROM appointments WHERE status = 'completed') AS completed_appointments,
            (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE) AS today_appointments,
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') AS total_revenue
        """,
        decision="fetchone",
    )
    return stats


## MASTER APPOINTMENTS LIST FOR CLINIC OPERATIONS ----------
@router.get("/appointments")
def get_all_appointments(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    date_filter: Optional[date] = Query(default=None, alias="date"),
    doctor_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinic staff privileges required.")

    # If doctor is logged in and not admin, restrict to their appointments
    effective_doctor_id = doctor_id
    if claims.get("role") == "doctor":
        effective_doctor_id = claims.get("doctor_id")

    conditions = []
    params = []

    if status_filter:
        conditions.append("a.status = %s")
        params.append(status_filter)

    if date_filter:
        conditions.append("a.appointment_date = %s")
        params.append(date_filter)

    if effective_doctor_id is not None:
        conditions.append("a.doctor_id = %s")
        params.append(effective_doctor_id)

    if search and search.strip():
        search_param = f"%{search.strip()}%"
        conditions.append("(u.username ILIKE %s OR d.name ILIKE %s)")
        params.extend([search_param, search_param])

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
        SELECT
            a.id,
            a.user_id,
            a.doctor_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.created_at,
            u.username AS patient_name,
            u.mobile AS patient_mobile,
            u.email AS patient_email,
            d.name AS doctor_name,
            d.fees,
            c.category_name,
            COALESCE(p.status, 'pending') AS payment_status,
            p.amount AS payment_amount
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN payments p ON p.appointment_id = a.id
        {where_clause}
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    """

    return db.query(sql, tuple(params) if params else None, decision="fetchall")


## UPDATE APPOINTMENT STATUS (CHECK-IN / COMPLETE) ----------
@router.put("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    payload: UpdateAppointmentStatusRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinic staff privileges required.")

    status_val = payload.status.lower().strip()
    if status_val not in ("booked", "checked_in", "in_consultation", "completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid appointment status.")

    updated = db.query(
        """
        UPDATE appointments
        SET status = %s
        WHERE id = %s
        RETURNING id, status, appointment_date, appointment_time
        """,
        (status_val, appointment_id),
        decision="fetchone",
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    return {"success": True, "appointment": updated}


# ==========================================
# CASH DRAWER & DAILY RECONCILIATION
# ==========================================

class CloseCashDrawerRequest(BaseModel):
    actual_cash_counted: float
    closing_notes: Optional[str] = "End of day cash counter verification"


@router.get("/cash-drawer/today")
def get_today_cash_drawer(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required.")

    # Calculate actual collections today across appointments, deposits, pharmacy
    payments_today = db.query("""
        SELECT 
            COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN amount ELSE 0 END), 0) AS cash_coll,
            COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'upi' THEN amount ELSE 0 END), 0) AS upi_coll,
            COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'card' THEN amount ELSE 0 END), 0) AS card_coll,
            COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'phonepe' THEN amount ELSE 0 END), 0) AS phonepe_coll
        FROM payments
        WHERE payment_date = CURRENT_DATE AND status = 'paid';
    """) or {"cash_coll": 0, "upi_coll": 0, "card_coll": 0, "phonepe_coll": 0}

    session = db.query("SELECT * FROM cash_drawer_sessions WHERE session_date = CURRENT_DATE LIMIT 1;")
    if not session:
        # Create session for today
        opening = 2000.00
        cash_coll = float(payments_today.get("cash_coll", 0))
        upi_coll = float(payments_today.get("upi_coll", 0))
        card_coll = float(payments_today.get("card_coll", 0))
        phonepe_coll = float(payments_today.get("phonepe_coll", 0))
        expected = opening + cash_coll

        session = db.query("""
            INSERT INTO cash_drawer_sessions (
                session_date, cashier_id, cashier_name, opening_cash,
                cash_collected, upi_collected, card_collected, phonepe_collected,
                expected_cash, status
            ) VALUES (
                CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s, %s, 'open'
            ) RETURNING *;
        """, (
            str(claims.get("user_id", "admin-1")), claims.get("username", "Desk Cashier"),
            opening, cash_coll, upi_coll, card_coll, phonepe_coll, expected
        ), decision="fetchone")

    return {"status": "success", "session": session}


@router.post("/cash-drawer/close")
def close_cash_drawer(
    payload: CloseCashDrawerRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required.")

    session = db.query("SELECT * FROM cash_drawer_sessions WHERE session_date = CURRENT_DATE LIMIT 1;")
    if not session:
        raise HTTPException(status_code=404, detail="No active cash drawer session found for today.")

    expected = float(session.get("expected_cash", 0.0))
    discrepancy = round(payload.actual_cash_counted - expected, 2)

    updated = db.query("""
        UPDATE cash_drawer_sessions
        SET status = 'closed',
            actual_cash_counted = %s,
            discrepancy = %s,
            closing_time = NOW(),
            closing_notes = %s
        WHERE id = %s
        RETURNING *;
    """, (payload.actual_cash_counted, discrepancy, payload.closing_notes, session["id"]), decision="fetchone")

    return {
        "status": "success",
        "message": f"Cash drawer closed. Discrepancy: ₹{discrepancy:.2f} ({'Balanced' if discrepancy == 0 else 'Shortage/Excess'})",
        "session": updated
    }


# ==========================================
# EXCEL / CSV BULK IMPORT
# ==========================================

class BulkMedicineImportItem(BaseModel):
    name: str
    generic_name: Optional[str] = ""
    category: Optional[str] = "General"
    dosage_form: Optional[str] = "Tablet"
    strength: Optional[str] = ""
    price: float
    stock_quantity: int = 50
    hsn_code: Optional[str] = "3004"
    rack_location: Optional[str] = "Rack-A1"


class BulkMedicineImportRequest(BaseModel):
    medicines: list[BulkMedicineImportItem]


@router.post("/import/medicines")
def import_medicines_csv(
    payload: BulkMedicineImportRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("admin", "doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff privileges required.")

    imported_count = 0
    for med in payload.medicines:
        db.query("""
            INSERT INTO pharmacy_medicines (
                name, generic_name, category, dosage_form, strength,
                price, stock_quantity, hsn_code, rack_location
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING;
        """, (
            med.name, med.generic_name, med.category, med.dosage_form,
            med.strength, med.price, med.stock_quantity, med.hsn_code, med.rack_location
        ))
        imported_count += 1

    return {
        "status": "success",
        "message": f"Successfully imported {imported_count} medicines into pharmacy stock.",
        "imported_count": imported_count
    }


# ==========================================
# DOCTOR APPOINTMENT & ACCESS KEY MANAGEMENT
# ==========================================
import random
import string
import bcrypt


class AppointDoctorRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category_id: int
    fees: int = Field(gt=0)
    qualification: Optional[str] = "Specialist Consultant"
    experience_years: Optional[int] = 5
    about: Optional[str] = "Consultant Physician at Sanjeevni Clinic"
    clinic_address: Optional[str] = "Cabin 1, Sanjeevni Clinic"
    custom_doctor_key: Optional[str] = None


class UpdateDoctorRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category_id: int
    fees: int = Field(gt=0)
    qualification: Optional[str] = "Specialist Consultant"
    experience_years: Optional[int] = 5
    about: Optional[str] = "Consultant Physician at Sanjeevni Clinic"
    clinic_address: Optional[str] = "Cabin 1, Sanjeevni Clinic"
    custom_doctor_key: Optional[str] = None


@router.post("/appoint-doctor")
def appoint_doctor(
    payload: AppointDoctorRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Hospital Admin can appoint doctors.")

    # Generate or format doctor key
    if payload.custom_doctor_key and payload.custom_doctor_key.strip():
        doctor_key = payload.custom_doctor_key.strip().upper()
    else:
        clean_name = payload.name.upper().replace("DR.", "").replace("DR ", "").replace(" ", "")[:6]
        rand_suffix = "".join(random.choices(string.digits, k=4))
        doctor_key = f"DOC-{clean_name}-{rand_suffix}"

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            # 1. Insert into doctors
            cur.execute("""
                INSERT INTO doctors (name, category_id, fees, doctor_key)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """, (payload.name.strip(), payload.category_id, payload.fees, doctor_key))
            doctor_id = cur.fetchone()[0]

            # 2. Insert into doctor_profiles
            cur.execute("""
                INSERT INTO doctor_profiles (doctor_id, qualification, experience_years, about, clinic_address)
                VALUES (%s, %s, %s, %s, %s);
            """, (doctor_id, payload.qualification, payload.experience_years, payload.about, payload.clinic_address))

            # 3. Create user account for doctor
            clean_username = "dr." + payload.name.lower().replace("dr. ", "").replace("dr.", "").replace(" ", "").strip()
            cur.execute("SELECT id FROM users WHERE username = %s", (clean_username,))
            if cur.fetchone():
                clean_username = f"{clean_username}{random.randint(10, 99)}"
            
            pwd_hash = bcrypt.hashpw(doctor_key.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            cur.execute("""
                INSERT INTO users (username, email, password_hash, role, doctor_id, doctor_key)
                VALUES (%s, %s, %s, 'doctor', %s, %s)
                RETURNING id;
            """, (clean_username, f"{clean_username}@sanjeevni.com", pwd_hash, doctor_id, doctor_key))
            user_id = cur.fetchone()[0]

            # 4. Insert default availability slots (Mon-Sat 09:00 - 13:00, 17:00 - 20:00)
            for day in range(1, 7):
                cur.execute("""
                    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
                    VALUES (%s, %s, '09:00', '13:00'), (%s, %s, '17:00', '20:00');
                """, (doctor_id, day, doctor_id, day))

            conn.commit()

    return {
        "status": "success",
        "message": f"{payload.name} appointed successfully.",
        "doctor": {
            "id": doctor_id,
            "name": payload.name,
            "category_id": payload.category_id,
            "fees": payload.fees,
            "doctor_key": doctor_key,
            "username": clean_username,
        }
    }


@router.get("/doctors-with-keys")
def get_doctors_with_keys(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")

    return db.query("""
        SELECT d.id, d.name, d.fees, d.doctor_key, d.category_id,
               COALESCE(c.category_name, 'General') as category_name,
               COALESCE(dp.qualification, 'Specialist') as qualification,
               COALESCE(dp.experience_years, 5) as experience_years,
               COALESCE(dp.about, 'Experienced medical practitioner at Sanjeevni Clinic.') as about,
               COALESCE(dp.clinic_address, 'Cabin 1, Sanjeevni Central Clinic') as clinic_address,
               COALESCE(u.username, '') as username,
               (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id) as total_appointments
        FROM doctors d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        LEFT JOIN users u ON u.doctor_id = d.id
        ORDER BY d.id DESC;
    """, decision="fetchall")


@router.put("/doctors/{doctor_id}")
def update_doctor(
    doctor_id: int,
    payload: UpdateDoctorRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")

    existing = db.query("SELECT * FROM doctors WHERE id = %s", (doctor_id,), decision="fetchone")
    if not existing:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            # 1. Update doctors table
            if payload.custom_doctor_key and payload.custom_doctor_key.strip():
                new_key = payload.custom_doctor_key.strip().upper()
                cur.execute("""
                    UPDATE doctors
                    SET name = %s, category_id = %s, fees = %s, doctor_key = %s
                    WHERE id = %s
                """, (payload.name.strip(), payload.category_id, payload.fees, new_key, doctor_id))

                pwd_hash = bcrypt.hashpw(new_key.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                cur.execute("""
                    UPDATE users
                    SET doctor_key = %s, password_hash = %s
                    WHERE doctor_id = %s
                """, (new_key, pwd_hash, doctor_id))
            else:
                cur.execute("""
                    UPDATE doctors
                    SET name = %s, category_id = %s, fees = %s
                    WHERE id = %s
                """, (payload.name.strip(), payload.category_id, payload.fees, doctor_id))

            # 2. Update or insert doctor_profiles
            cur.execute("SELECT id FROM doctor_profiles WHERE doctor_id = %s", (doctor_id,))
            prof = cur.fetchone()
            if prof:
                cur.execute("""
                    UPDATE doctor_profiles
                    SET qualification = %s, experience_years = %s, about = %s, clinic_address = %s
                    WHERE doctor_id = %s
                """, (payload.qualification, payload.experience_years, payload.about, payload.clinic_address, doctor_id))
            else:
                cur.execute("""
                    INSERT INTO doctor_profiles (doctor_id, qualification, experience_years, about, clinic_address)
                    VALUES (%s, %s, %s, %s, %s)
                """, (doctor_id, payload.qualification, payload.experience_years, payload.about, payload.clinic_address))

            conn.commit()

    return {
        "status": "success",
        "message": f"Doctor {payload.name} updated successfully.",
        "doctor_id": doctor_id
    }


@router.delete("/doctors/{doctor_id}")
def delete_doctor(
    doctor_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")

    existing = db.query("SELECT * FROM doctors WHERE id = %s", (doctor_id,), decision="fetchone")
    if not existing:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    doc_name = existing["name"]

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            # Safely disassociate references
            cur.execute("UPDATE users SET doctor_id = NULL, doctor_key = NULL WHERE doctor_id = %s", (doctor_id,))
            cur.execute("DELETE FROM doctor_availability WHERE doctor_id = %s", (doctor_id,))
            cur.execute("DELETE FROM doctor_profiles WHERE doctor_id = %s", (doctor_id,))
            cur.execute("UPDATE appointments SET doctor_id = 1 WHERE doctor_id = %s", (doctor_id,))
            cur.execute("UPDATE hospital_beds SET doctor_id = NULL WHERE doctor_id = %s", (doctor_id,))
            cur.execute("UPDATE opd_tokens SET doctor_id = 1 WHERE doctor_id = %s", (doctor_id,))
            cur.execute("UPDATE prescriptions SET doctor_id = 1 WHERE doctor_id = %s", (doctor_id,))
            cur.execute("UPDATE lab_reports SET doctor_id = 1 WHERE doctor_id = %s", (doctor_id,))
            cur.execute("DELETE FROM doctor_reviews WHERE doctor_id = %s", (doctor_id,))
            cur.execute("DELETE FROM doctors WHERE id = %s", (doctor_id,))
            conn.commit()

    return {
        "status": "success",
        "message": f"Doctor {doc_name} removed from clinic roster.",
        "deleted_doctor_id": doctor_id
    }


