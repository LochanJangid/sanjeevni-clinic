import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, Field

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/billing", tags=["billing"])

db = Database()


DOCTOR_PHONE_MAP = {
    1: {"mobile": "9876543211", "upi": "9876543211@ybl", "name": "Dr. Rajesh Sharma"},
    2: {"mobile": "9876543212", "upi": "9876543212@ybl", "name": "Dr. Priya Verma"},
    3: {"mobile": "9876543210", "upi": "9876543210@ybl", "name": "Dr. Amit Gupta"},
    4: {"mobile": "9876543214", "upi": "9876543214@ybl", "name": "Dr. Anita Roy"},
    5: {"mobile": "9876543215", "upi": "9876543215@ybl", "name": "Dr. Vikram Sethi"},
    6: {"mobile": "9876543216", "upi": "9876543216@ybl", "name": "Dr. Meera Iyer"},
}


class ProcessPaymentRequest(BaseModel):
    appointment_id: int
    amount: int = Field(gt=0)
    payment_method: str = Field(default="phonepe")  # upi, card, cash, online, phonepe
    phone_number: Optional[str] = None
    transaction_id: Optional[str] = None


## GET USER'S INVOICES AND BILLS ----------
@router.get("/user/{user_id}")
def get_user_bills(
    user_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") == "patient" and claims.get("id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return db.query(
        """
        SELECT
            p.id,
            p.appointment_id,
            p.user_id,
            p.amount,
            p.payment_method,
            p.status,
            p.transaction_id,
            p.phone_number,
            p.created_at,
            p.paid_at,
            a.appointment_date,
            a.appointment_time,
            a.status AS appointment_status,
            d.name AS doctor_name,
            c.category_name
        FROM payments p
        JOIN appointments a ON p.appointment_id = a.id
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE p.user_id = %s
        ORDER BY p.created_at DESC
        """,
        (user_id,),
        decision="fetchall",
    )


## GET INVOICE FOR APPOINTMENT ----------
@router.get("/appointment/{appointment_id}")
def get_appointment_bill(
    appointment_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)

    # Check if payment record exists
    payment = db.query(
        """
        SELECT
            p.id,
            p.appointment_id,
            p.user_id,
            p.amount,
            p.payment_method,
            p.status,
            p.transaction_id,
            p.phone_number,
            p.created_at,
            p.paid_at,
            a.appointment_date,
            a.appointment_time,
            a.status AS appointment_status,
            d.name AS doctor_name,
            d.fees AS doctor_fees,
            c.category_name,
            u.username AS patient_name,
            u.email AS patient_email,
            u.mobile AS patient_mobile
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE a.id = %s
        """,
        (appointment_id,),
        decision="fetchone",
    )

    if not payment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if claims.get("role") == "patient" and claims.get("id") != payment["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    return payment


## PROCESS / RECORD PAYMENT ----------
@router.post("/pay")
def process_payment(
    payload: ProcessPaymentRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    method = payload.payment_method.lower().strip()
    if method not in ("upi", "card", "cash", "online", "phonepe"):
        raise HTTPException(status_code=400, detail="Invalid payment method.")

    # Get appointment
    appt = db.query(
        "SELECT id, user_id, doctor_id FROM appointments WHERE id = %s",
        (payload.appointment_id,),
        decision="fetchone",
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if claims.get("role") == "patient" and claims.get("id") != appt["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    if payload.transaction_id and payload.transaction_id.strip():
        txn_id = payload.transaction_id.strip()
    elif method == "phonepe":
        txn_id = f"PHONEPE-TXN-{uuid.uuid4().hex[:10].upper()}"
    else:
        txn_id = f"PAY-{uuid.uuid4().hex[:10].upper()}"

    doc_meta = DOCTOR_PHONE_MAP.get(appt["doctor_id"], {})
    phone_to_record = payload.phone_number or doc_meta.get("mobile")

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, status FROM payments WHERE appointment_id = %s", (payload.appointment_id,))
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    """
                    UPDATE payments
                    SET amount = %s, payment_method = %s, status = 'paid',
                        transaction_id = %s,
                        phone_number = %s, paid_at = NOW()
                    WHERE appointment_id = %s
                    RETURNING id, transaction_id, status, paid_at
                    """,
                    (payload.amount, method, txn_id, phone_to_record, payload.appointment_id),
                )
                updated = cur.fetchone()
                pid = updated[0]
                txn_code = updated[1]
                paid_time = updated[3]
            else:
                cur.execute(
                    """
                    INSERT INTO payments (appointment_id, user_id, amount, payment_method, status, transaction_id, phone_number, created_at, paid_at)
                    VALUES (%s, %s, %s, %s, 'paid', %s, %s, NOW(), NOW())
                    RETURNING id, transaction_id, status, paid_at
                    """,
                    (payload.appointment_id, appt["user_id"], payload.amount, method, txn_id, phone_to_record),
                )
                row = cur.fetchone()
                pid = row[0]
                txn_code = row[1]
                paid_time = row[3]

            # Also update appointment status to confirmed
            cur.execute(
                "UPDATE appointments SET status = 'confirmed' WHERE id = %s AND (status = 'scheduled' OR status IS NULL OR status = 'pending')",
                (payload.appointment_id,),
            )
            conn.commit()

    return {
        "success": True,
        "payment_id": pid,
        "transaction_id": txn_code,
        "status": "paid",
        "paid_at": paid_time.isoformat() if hasattr(paid_time, "isoformat") else str(paid_time),
        "receipt_number": f"SJ-REC-{payload.appointment_id:05d}",
        "msg": "Payment processed successfully via PhonePe UPI.",
    }


## PHONEPE QR AND DETAILS ENDPOINT ----------
@router.get("/phonepe-details/{appointment_id}")
def get_phonepe_details(
    appointment_id: int,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    authenticated_token_claims(authorization)
    appt = db.query(
        """
        SELECT a.id, a.user_id, a.doctor_id, a.appointment_date, a.appointment_time, a.status,
               d.name as doctor_name, d.fees, c.category_name, dp.clinic_address,
               u.username as patient_name, u.mobile as patient_mobile,
               p.status as payment_status, p.transaction_id, p.paid_at, p.payment_method
        FROM appointments a
        JOIN doctors d ON d.id = a.doctor_id
        LEFT JOIN categories c ON c.id = d.category_id
        LEFT JOIN doctor_profiles dp ON dp.doctor_id = d.id
        JOIN users u ON u.id = a.user_id
        LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE a.id = %s
        """,
        (appointment_id,),
        decision="fetchone",
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    doc_meta = DOCTOR_PHONE_MAP.get(appt["doctor_id"], {
        "mobile": "9876543210",
        "upi": "sanjeevni.clinic@ybl",
        "name": appt["doctor_name"]
    })

    doctor_mobile = doc_meta["mobile"]
    doctor_upi = doc_meta["upi"]
    amount = appt["fees"]
    doc_title = appt["doctor_name"] if appt["doctor_name"].startswith("Dr.") else f"Dr. {appt['doctor_name']}"
    note = f"Consultation {doc_title} Ref SJ-{appointment_id}"

    import urllib.parse
    encoded_pn = urllib.parse.quote(appt["doctor_name"])
    encoded_tn = urllib.parse.quote(note)

    upi_intent_uri = f"upi://pay?pa={doctor_upi}&pn={encoded_pn}&am={amount}&cu=INR&tn={encoded_tn}"
    phonepe_intent_uri = f"phonepe://pay?pa={doctor_upi}&pn={encoded_pn}&am={amount}&cu=INR&tn={encoded_tn}"

    receipt_number = f"SJ-REC-{appointment_id:05d}"

    return {
        "appointment_id": appointment_id,
        "doctor_id": appt["doctor_id"],
        "doctor_name": appt["doctor_name"],
        "specialty": appt.get("category_name") or "Specialist",
        "doctor_mobile": doctor_mobile,
        "doctor_upi": doctor_upi,
        "amount": amount,
        "patient_name": appt["patient_name"],
        "appointment_date": str(appt["appointment_date"]),
        "appointment_time": str(appt["appointment_time"]),
        "clinic_address": appt.get("clinic_address") or "Sanjeevni Medical Pavilion, Metro Sector 18, New Delhi",
        "upi_intent_uri": upi_intent_uri,
        "phonepe_intent_uri": phonepe_intent_uri,
        "payment_status": appt.get("payment_status") or "pending",
        "payment_method": appt.get("payment_method") or "phonepe",
        "transaction_id": appt.get("transaction_id"),
        "paid_at": appt.get("paid_at"),
        "receipt_number": receipt_number
    }


## CLINIC BILLING ANALYTICS (ADMIN) ----------
@router.get("/analytics")
def get_billing_analytics(
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required.")

    stats = db.query(
        """
        SELECT
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_revenue,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_invoices_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_invoices_count
        FROM payments
        """,
        decision="fetchone",
    )

    recent_payments = db.query(
        """
        SELECT
            p.id,
            p.amount,
            p.payment_method,
            p.status,
            p.transaction_id,
            p.paid_at,
            u.username AS patient_name,
            d.name AS doctor_name,
            c.category_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN appointments a ON p.appointment_id = a.id
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE p.status = 'paid'
        ORDER BY p.paid_at DESC
        LIMIT 10
        """,
        decision="fetchall",
    )

    dept_revenue = db.query(
        """
        SELECT
            COALESCE(c.category_name, 'General') AS department,
            SUM(p.amount) AS total_amount,
            COUNT(p.id) AS transaction_count
        FROM payments p
        JOIN appointments a ON p.appointment_id = a.id
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE p.status = 'paid'
        GROUP BY c.category_name
        ORDER BY total_amount DESC
        """,
        decision="fetchall",
    )

    return {
        "summary": stats,
        "recent_payments": recent_payments,
        "department_breakdown": dept_revenue,
    }
