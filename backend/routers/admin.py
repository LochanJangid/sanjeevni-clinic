from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query, status
from pydantic import BaseModel

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

    sql = """
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
        WHERE (%s IS NULL OR a.status = %s)
          AND (%s IS NULL OR a.appointment_date = %s)
          AND (%s IS NULL OR a.doctor_id = %s)
          AND (%s IS NULL OR u.username ILIKE %s OR d.name ILIKE %s)
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    """
    search_param = f"%{search.strip()}%" if search and search.strip() else None

    return db.query(
        sql,
        (
            status_filter, status_filter,
            date_filter, date_filter,
            effective_doctor_id, effective_doctor_id,
            search_param, search_param, search_param,
        ),
        decision="fetchall",
    )


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

