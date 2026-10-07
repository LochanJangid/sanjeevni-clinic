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
