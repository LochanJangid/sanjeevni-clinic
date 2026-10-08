import json
import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Literal, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/clinical", tags=["Clinical"])
db = Database()


def create_role_notification(
    recipient_role: str,
    title: str,
    message: str,
    category: str = "general",
    recipient_id: Optional[int] = None,
    link: Optional[str] = None
):
    try:
        db.query(
            """
            INSERT INTO role_notifications (recipient_role, recipient_id, title, message, category, link, is_read, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, FALSE, NOW())
            """,
            (recipient_role, recipient_id, title, message, category, link)
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")


# --- PYDANTIC SCHEMAS ---

class TeleconsultCallRequest(BaseModel):
    appointment_id: int
    doctor_id: int
    patient_id: Optional[int] = None
    caller_role: str  # 'patient' or 'doctor'
    caller_name: str

class TeleconsultCallResponseRequest(BaseModel):
    call_id: int
    action: str  # 'accept' or 'decline'

class OpdCheckInRequest(BaseModel):
    doctor_id: int
    patient_name: str
    appointment_id: Optional[int] = None

class DoctorPharmacyOrderRequest(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    items: list[dict]  # [{"medicine_id": 1, "quantity": 2}]
    delivery_address: Optional[str] = "Hospital Clinic Pharmacy Desk"
    instructions: Optional[str] = ""

class MedicineCreateRequest(BaseModel):
    name: str
    generic_name: str
    category: str
    dosage_form: str
    strength: str
    price: float
    stock_quantity: int
    batch_number: str
    expiry_date: str
    prescription_required: bool = True

class MedicineUpdateRequest(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    prescription_required: Optional[bool] = None

class VitalsCreate(BaseModel):
    user_id: int | None = None
    bp_systolic: int = Field(ge=50, le=260)
    bp_diastolic: int = Field(ge=30, le=160)
    heart_rate: int = Field(ge=30, le=220)
    blood_sugar: float = Field(ge=20.0, le=700.0)
    temperature: float = Field(ge=90.0, le=108.0)
    spo2: int = Field(ge=50, le=100)
    weight_kg: float = Field(ge=1.0, le=300.0)
    notes: str | None = Field(default="", max_length=500)


class LabReportCreate(BaseModel):
    user_id: int
    doctor_id: int | None = None
    appointment_id: int | None = None
    test_name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=80)
    result_summary: str = Field(min_length=2, max_length=255)
    is_abnormal: bool = False
    clinical_notes: str | None = ""
    report_data: list[dict] = Field(default_factory=list)


class ReviewCreate(BaseModel):
    doctor_id: int
    rating: int = Field(ge=1, le=5)
    patient_name: str = Field(min_length=1, max_length=80)
    comment: str = Field(min_length=3, max_length=800)
    wait_time_rating: int = Field(ge=1, le=5, default=5)
    bedside_manner_rating: int = Field(ge=1, le=5, default=5)


class SymptomTriageRequest(BaseModel):
    symptoms: list[str] = Field(min_length=1)
    description: str = Field(default="", max_length=1000)
    duration_days: int = Field(ge=0, le=365, default=1)
    age_years: int = Field(ge=0, le=120, default=30)
    has_fever: bool = False
    has_chest_pain: bool = False
    has_shortness_of_breath: bool = False


class BedAdmitRequest(BaseModel):
    patient_name: str = Field(min_length=2, max_length=100)
    doctor_id: int | None = None
    patient_id: int | None = None
    requisition_notes: str | None = None


class PharmacyOrderRequest(BaseModel):
    items: list[dict]  # [{"medicine_id": 1, "quantity": 2}]
    delivery_address: str = Field(min_length=5, max_length=300)
    phone: str = Field(min_length=8, max_length=20)
    payment_method: Literal["cod", "upi", "card"] = "upi"


# --- 1. VITALS ENDPOINTS ---

@router.get("/vitals/me")
def get_my_vitals(authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    user_id = claims["id"]
    rows = db.query(
        """
        SELECT id, user_id, bp_systolic, bp_diastolic, heart_rate, blood_sugar, 
               temperature, spo2, weight_kg, notes, recorded_at
        FROM patient_vitals
        WHERE user_id = %s
        ORDER BY recorded_at DESC
        """,
        (user_id,),
        decision="fetchall"
    )
    return {"vitals": rows}


@router.post("/vitals")
def record_vitals(payload: VitalsCreate, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    # If admin or doctor, can record for a given user_id; if patient, record for self
    user_id = payload.user_id if (claims["role"] in ("admin", "doctor") and payload.user_id) else claims["id"]

    new_vital = db.query(
        """
        INSERT INTO patient_vitals (
            user_id, bp_systolic, bp_diastolic, heart_rate, blood_sugar,
            temperature, spo2, weight_kg, notes, recorded_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id, user_id, bp_systolic, bp_diastolic, heart_rate, blood_sugar,
                  temperature, spo2, weight_kg, notes, recorded_at
        """,
        (
            user_id, payload.bp_systolic, payload.bp_diastolic, payload.heart_rate,
            payload.blood_sugar, payload.temperature, payload.spo2, payload.weight_kg,
            payload.notes
        )
    )
    return {"msg": "Patient vitals logged successfully", "vitals": new_vital}


@router.get("/vitals/patient/{patient_id}")
def get_patient_vitals_by_id(patient_id: int, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims["role"] not in ("admin", "doctor") and claims["id"] != patient_id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this patient's vitals.")

    rows = db.query(
        """
        SELECT id, user_id, bp_systolic, bp_diastolic, heart_rate, blood_sugar, 
               temperature, spo2, weight_kg, notes, recorded_at
        FROM patient_vitals
        WHERE user_id = %s
        ORDER BY recorded_at DESC
        """,
        (patient_id,),
        decision="fetchall"
    )
    return {"vitals": rows}


# --- 2. LAB REPORTS & DIAGNOSTICS ---

@router.get("/lab-reports/me")
def get_my_lab_reports(authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    user_id = claims["id"]
    role = claims.get("role", "patient")

    if role in ("admin", "doctor"):
        reports = db.query(
            """
            SELECT lr.id, lr.test_name, lr.category, lr.result_summary, lr.status,
                   lr.is_abnormal, lr.report_data, lr.clinical_notes, lr.conducted_at,
                   d.name as doctor_name, u.username as patient_name
            FROM lab_reports lr
            LEFT JOIN doctors d ON d.id = lr.doctor_id
            LEFT JOIN users u ON u.id = lr.user_id
            ORDER BY lr.conducted_at DESC
            """,
            decision="fetchall"
        )
    else:
        reports = db.query(
            """
            SELECT lr.id, lr.test_name, lr.category, lr.result_summary, lr.status,
                   lr.is_abnormal, lr.report_data, lr.clinical_notes, lr.conducted_at,
                   d.name as doctor_name, u.username as patient_name
            FROM lab_reports lr
            LEFT JOIN doctors d ON d.id = lr.doctor_id
            LEFT JOIN users u ON u.id = lr.user_id
            WHERE lr.user_id = %s
            ORDER BY lr.conducted_at DESC
            """,
            (user_id,),
            decision="fetchall"
        )
    return {"reports": reports}


@router.get("/patients-list")
def get_registered_patients(authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Staff access required.")

    patients = db.query(
        """
        SELECT id, username, email, mobile
        FROM users
        WHERE role = 'patient' OR role IS NULL
        ORDER BY username ASC
        LIMIT 100
        """,
        decision="fetchall"
    ) or []
    return {"patients": patients}


@router.get("/lab-reports/{report_id}")
def get_lab_report_detail(report_id: int, authorization: str | None = Header(None)):
    authenticated_token_claims(authorization)
    report = db.query(
        """
        SELECT lr.*, u.username as patient_name, u.email as patient_email, d.name as doctor_name
        FROM lab_reports lr
        JOIN users u ON u.id = lr.user_id
        LEFT JOIN doctors d ON d.id = lr.doctor_id
        WHERE lr.id = %s
        """,
        (report_id,),
        decision="fetchone"
    )
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found.")
    return {"report": report}


@router.post("/lab-reports")
def create_lab_report(payload: LabReportCreate, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims["role"] not in ("admin", "doctor"):
        raise HTTPException(status_code=403, detail="Only clinicians or admins can generate lab test orders.")

    doctor_id = claims.get("doctor_id") or payload.doctor_id
    new_report = db.query(
        """
        INSERT INTO lab_reports (
            user_id, doctor_id, appointment_id, test_name, category,
            result_summary, is_abnormal, report_data, clinical_notes, conducted_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, NOW())
        RETURNING id, test_name, category, result_summary, is_abnormal, conducted_at
        """,
        (
            payload.user_id, doctor_id, payload.appointment_id, payload.test_name,
            payload.category, payload.result_summary, payload.is_abnormal,
            json.dumps(payload.report_data), payload.clinical_notes
        )
    )
    create_role_notification(
        "patient",
        "Lab Diagnostic Report Issued",
        f"Your clinical lab test result for {payload.test_name} has been processed and is ready.",
        category="lab",
        link="/lab-reports",
        recipient_id=payload.user_id
    )
    create_role_notification(
        "admin",
        "New Lab Report Issued",
        f"Lab report for {payload.test_name} generated for patient #{payload.user_id}.",
        category="lab",
        link="/admin"
    )

    return {"msg": "Lab report successfully logged", "report": new_report}


# --- 3. HOSPITAL BED OCCUPANCY (IPD) ---

@router.get("/beds")
def get_hospital_beds():
    beds = db.query(
        """
        SELECT hb.*, d.name as doctor_name
        FROM hospital_beds hb
        LEFT JOIN doctors d ON d.id = hb.doctor_id
        ORDER BY hb.ward_type, hb.bed_number
        """,
        decision="fetchall"
    )
    
    total = len(beds)
    occupied = sum(1 for b in beds if b["is_occupied"])
    available = total - occupied
    oxygen_available = sum(1 for b in beds if b["has_oxygen"] and not b["is_occupied"])

    by_ward = {}
    for b in beds:
        w = b["ward_type"]
        if w not in by_ward:
            by_ward[w] = {"total": 0, "occupied": 0, "available": 0}
        by_ward[w]["total"] += 1
        if b["is_occupied"]:
            by_ward[w]["occupied"] += 1
        else:
            by_ward[w]["available"] += 1

    return {
        "beds": beds,
        "summary": {
            "total_beds": total,
            "occupied_beds": occupied,
            "available_beds": available,
            "occupancy_rate": round((occupied / total * 100), 1) if total else 0,
            "oxygen_available_beds": oxygen_available,
            "by_ward": by_ward
        }
    }


@router.post("/beds/{bed_id}/admit")
def admit_patient_to_bed(bed_id: int, payload: BedAdmitRequest, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims["role"] not in ("admin", "doctor"):
        raise HTTPException(status_code=403, detail="Only staff can admit patients.")

    bed = db.query("SELECT * FROM hospital_beds WHERE id = %s", (bed_id,), decision="fetchone")
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found.")
    if bed["is_occupied"]:
        raise HTTPException(status_code=400, detail="This bed is already occupied.")

    doc_id = payload.doctor_id or claims.get("doctor_id") or 1
    updated = db.query(
        """
        UPDATE hospital_beds
        SET is_occupied = TRUE, patient_name = %s, doctor_id = %s, admitted_at = NOW()
        WHERE id = %s
        RETURNING *
        """,
        (payload.patient_name, doc_id, bed_id)
    )

    # Resolve patient user_id if available
    patient_user_id = payload.patient_id
    if not patient_user_id:
        p_row = db.query("SELECT id FROM users WHERE LOWER(username) = LOWER(%s)", (payload.patient_name,), decision="fetchone")
        if p_row:
            patient_user_id = p_row["id"]

    staff_title = f"Dr. {claims.get('username', 'Physician')}" if claims.get("role") == "doctor" else "Hospital Administration"

    # Role-isolated notifications
    create_role_notification(
        "patient",
        "Hospital Bed Allocated",
        f"Bed {updated['bed_number']} ({updated['ward_type']}) has been allocated for your inpatient care by {staff_title}.",
        category="bed",
        link="/beds",
        recipient_id=patient_user_id
    )
    create_role_notification(
        "doctor",
        "Bed Allocation Confirmed",
        f"Inpatient Bed {updated['bed_number']} allocated to patient {payload.patient_name}.",
        category="bed",
        link="/beds",
        recipient_id=doc_id
    )
    create_role_notification(
        "admin",
        "Bed Census Requisition",
        f"{staff_title} allocated Bed {updated['bed_number']} to {payload.patient_name}.",
        category="bed",
        link="/beds"
    )

    return {"msg": f"Patient {payload.patient_name} admitted to bed {updated['bed_number']}", "bed": updated}


@router.post("/beds/{bed_id}/discharge")
def discharge_patient_from_bed(bed_id: int, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims["role"] not in ("admin", "doctor"):
        raise HTTPException(status_code=403, detail="Only staff can discharge patients.")

    bed = db.query("SELECT * FROM hospital_beds WHERE id = %s", (bed_id,), decision="fetchone")
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found.")
    if not bed["is_occupied"]:
        raise HTTPException(status_code=400, detail="This bed is already vacant.")

    patient_name = bed["patient_name"]
    updated = db.query(
        """
        UPDATE hospital_beds
        SET is_occupied = FALSE, patient_name = NULL, doctor_id = NULL, admitted_at = NULL
        WHERE id = %s
        RETURNING *
        """,
        (bed_id,)
    )

    create_role_notification(
        "admin",
        "Inpatient Discharge Completed",
        f"Patient {patient_name} discharged from {updated['bed_number']}. Bed sanitized.",
        category="bed",
        link="/beds"
    )
    create_role_notification(
        "patient",
        "Inpatient Discharge Complete",
        f"You have been formally discharged from Bed {updated['bed_number']}. Thank you for choosing Sanjeevni Clinic.",
        category="bed",
        link="/beds"
    )

    return {"msg": f"Patient {patient_name} successfully discharged from {updated['bed_number']}", "bed": updated}


# --- 4. CLINIC PHARMACY INVENTORY & FULFILLMENT ---

@router.get("/pharmacy")
def get_pharmacy_inventory(category: str | None = None, search: str | None = None):
    query = """
    SELECT id, name, generic_name, category, dosage_form, strength,
           price, stock_quantity, batch_number, expiry_date, prescription_required
    FROM pharmacy_medicines
    WHERE 1=1
    """
    params = []
    if category and category != "all":
        query += " AND category ILIKE %s"
        params.append(f"%{category}%")
    if search:
        query += " AND (name ILIKE %s OR generic_name ILIKE %s)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    query += " ORDER BY name ASC"
    medicines = db.query(query, tuple(params), decision="fetchall")
    return {"medicines": medicines}


@router.post("/pharmacy/order")
def place_pharmacy_order(payload: PharmacyOrderRequest, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    user_id = claims["id"]

    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    # Calculate total and verify stock
    total_amount = 0.0
    order_items = []
    for item in payload.items:
        med_id = item.get("medicine_id")
        qty = int(item.get("quantity", 1))
        med = db.query("SELECT * FROM pharmacy_medicines WHERE id = %s", (med_id,), decision="fetchone")
        if not med:
            continue
        line_total = float(med["price"]) * qty
        total_amount += line_total
        order_items.append({
            "medicine_id": med_id,
            "name": med["name"],
            "strength": med["strength"],
            "quantity": qty,
            "unit_price": float(med["price"]),
            "line_total": line_total
        })

    order_id = f"PHARM-{int(datetime.now().timestamp())}"
    return {
        "msg": "Pharmacy order confirmed for clinic dispensing!",
        "order": {
            "order_id": order_id,
            "user_id": user_id,
            "items": order_items,
            "total_amount": round(total_amount, 2),
            "payment_method": payload.payment_method,
            "delivery_address": payload.delivery_address,
            "status": "Ready for Dispatch",
            "estimated_delivery": "Within 2 Hours (Express Clinic Delivery)"
        }
    }


@router.post("/pharmacy/doctor-order")
def doctor_order_pharmacy(payload: DoctorPharmacyOrderRequest, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Only doctors and admins can prescribe and order pharmacy for patients.")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    total_amount = 0.0
    dispensed_items = []

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            for it in payload.items:
                med_id = it.get("medicine_id")
                qty = int(it.get("quantity", 1))
                cur.execute("SELECT id, name, price, stock_quantity, strength FROM pharmacy_medicines WHERE id = %s", (med_id,))
                med = cur.fetchone()
                if not med:
                    continue
                med_price = float(med[2])
                line_total = med_price * qty
                total_amount += line_total
                # Deduct stock
                cur.execute("UPDATE pharmacy_medicines SET stock_quantity = GREATEST(0, stock_quantity - %s) WHERE id = %s", (qty, med_id))
                dispensed_items.append({
                    "medicine_id": med_id,
                    "name": med[1],
                    "strength": med[4],
                    "quantity": qty,
                    "unit_price": med_price,
                    "line_total": line_total
                })

            # Add to patient bill in payments table with pending status
            txn_id = f"PHARM-{uuid.uuid4().hex[:8].upper()}"
            cur.execute(
                """
                INSERT INTO payments (appointment_id, user_id, amount, payment_method, status, transaction_id, phone_number, created_at)
                VALUES (%s, %s, %s, 'pharmacy_dispensation', 'pending', %s, 'DoctorOrderDesk', NOW())
                RETURNING id
                """,
                (payload.appointment_id, payload.patient_id, int(round(total_amount)), txn_id)
            )
            pay_id = cur.fetchone()[0]
            conn.commit()

    bill_amount = int(round(total_amount))
    create_role_notification(
        "patient",
        "Prescription Medicines Billed",
        f"Dr. {claims.get('username', 'Physician')} ordered prescribed medicines (₹{bill_amount}) for your treatment. Added to your billing ledger.",
        category="pharmacy",
        link="/billing",
        recipient_id=payload.patient_id
    )
    create_role_notification(
        "admin",
        "Pharmacy Dispensation Order",
        f"Clinical prescription order of ₹{bill_amount} placed for patient #{payload.patient_id}.",
        category="pharmacy",
        link="/pharmacy"
    )

    return {
        "success": True,
        "payment_id": pay_id,
        "total_amount": round(total_amount, 2),
        "dispensed_items": dispensed_items,
        "msg": f"Pharmacy prescription fulfilled. ₹{bill_amount} added directly to patient billing ledger."
    }


@router.post("/pharmacy/medicines")
def admin_add_medicine(payload: MedicineCreateRequest, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required to manage stock.")

    new_med = db.query(
        """
        INSERT INTO pharmacy_medicines (
            name, generic_name, category, dosage_form, strength,
            price, stock_quantity, batch_number, expiry_date, prescription_required
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (
            payload.name, payload.generic_name, payload.category, payload.dosage_form,
            payload.strength, payload.price, payload.stock_quantity, payload.batch_number,
            payload.expiry_date, payload.prescription_required
        ),
        decision="fetchone"
    )
    return {"success": True, "medicine": new_med, "msg": f"{payload.name} added to pharmacy inventory."}


@router.put("/pharmacy/medicines/{medicine_id}")
def admin_update_medicine(medicine_id: int, payload: MedicineUpdateRequest, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required to manage stock.")

    existing = db.query("SELECT * FROM pharmacy_medicines WHERE id = %s", (medicine_id,), decision="fetchone")
    if not existing:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    updated_name = payload.name if payload.name is not None else existing["name"]
    updated_generic = payload.generic_name if payload.generic_name is not None else existing["generic_name"]
    updated_cat = payload.category if payload.category is not None else existing["category"]
    updated_form = payload.dosage_form if payload.dosage_form is not None else existing["dosage_form"]
    updated_strength = payload.strength if payload.strength is not None else existing["strength"]
    updated_price = payload.price if payload.price is not None else existing["price"]
    updated_stock = payload.stock_quantity if payload.stock_quantity is not None else existing["stock_quantity"]
    updated_batch = payload.batch_number if payload.batch_number is not None else existing["batch_number"]
    updated_exp = payload.expiry_date if payload.expiry_date is not None else str(existing["expiry_date"])
    updated_rx = payload.prescription_required if payload.prescription_required is not None else existing["prescription_required"]

    updated = db.query(
        """
        UPDATE pharmacy_medicines
        SET name = %s, generic_name = %s, category = %s, dosage_form = %s,
            strength = %s, price = %s, stock_quantity = %s, batch_number = %s,
            expiry_date = %s, prescription_required = %s
        WHERE id = %s
        RETURNING *
        """,
        (
            updated_name, updated_generic, updated_cat, updated_form,
            updated_strength, updated_price, updated_stock, updated_batch,
            updated_exp, updated_rx, medicine_id
        ),
        decision="fetchone"
    )
    return {"success": True, "medicine": updated, "msg": f"{updated_name} updated successfully."}


@router.delete("/pharmacy/medicines/{medicine_id}")
def admin_delete_medicine(medicine_id: int, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required.")

    db.query("DELETE FROM pharmacy_medicines WHERE id = %s", (medicine_id,))
    return {"success": True, "msg": "Medicine removed from pharmacy inventory."}


# --- 5. DOCTOR REVIEWS & PATIENT SATISFACTION ---

@router.get("/reviews/doctor/{doctor_id}")
def get_doctor_reviews(doctor_id: int):
    reviews = db.query(
        """
        SELECT id, doctor_id, user_id, rating, patient_name, comment,
               wait_time_rating, bedside_manner_rating, created_at
        FROM doctor_reviews
        WHERE doctor_id = %s
        ORDER BY created_at DESC
        """,
        (doctor_id,),
        decision="fetchall"
    )
    if not reviews:
        return {
            "reviews": [],
            "doctor_id": doctor_id,
            "total_reviews": 0,
            "average_rating": 5.0,
            "wait_time_avg": 5.0,
            "bedside_manner_avg": 5.0
        }

    total = len(reviews)
    avg_rating = round(sum(r["rating"] for r in reviews) / total, 1)
    avg_wait = round(sum(r.get("wait_time_rating", 5) or 5 for r in reviews) / total, 1)
    avg_bedside = round(sum(r.get("bedside_manner_rating", 5) or 5 for r in reviews) / total, 1)

    return {
        "reviews": reviews,
        "doctor_id": doctor_id,
        "total_reviews": total,
        "average_rating": avg_rating,
        "wait_time_avg": avg_wait,
        "bedside_manner_avg": avg_bedside
    }


@router.post("/reviews")
def submit_doctor_review(payload: ReviewCreate, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    user_id = claims["id"]

    new_rev = db.query(
        """
        INSERT INTO doctor_reviews (
            doctor_id, user_id, rating, patient_name, comment,
            wait_time_rating, bedside_manner_rating, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id, doctor_id, rating, patient_name, comment, created_at
        """,
        (
            payload.doctor_id, user_id, payload.rating, payload.patient_name,
            payload.comment, payload.wait_time_rating, payload.bedside_manner_rating
        )
    )
    return {"msg": "Thank you for your valuable feedback!", "review": new_rev}


# --- 6. VACCINATION & IMMUNIZATION PASSPORT ---

@router.get("/vaccinations/me")
def get_my_vaccinations(authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    user_id = claims["id"]
    rows = db.query(
        """
        SELECT id, vaccine_name, dose_number, target_disease, status,
               administered_date, next_due_date, batch_number, administered_by, certificate_code
        FROM patient_vaccinations
        WHERE user_id = %s
        ORDER BY administered_date DESC NULLS LAST, next_due_date ASC
        """,
        (user_id,),
        decision="fetchall"
    )
    return {"vaccinations": rows}


# --- 7. LIVE OPD QUEUE SCREEN & TOKEN DISPATCH ---

@router.get("/opd-queue/live")
def get_live_opd_queue():
    today = date.today()
    rows = db.query(
        """
        SELECT ot.id, ot.token_number, ot.status, ot.patient_name, ot.estimated_call_time,
               d.id as doctor_id, d.name as doctor_name, c.category_name,
               dp.clinic_address
        FROM opd_tokens ot
        JOIN doctors d ON d.id = ot.doctor_id
        LEFT JOIN categories c ON c.id = d.category_id
        LEFT JOIN doctor_profiles dp ON dp.doctor_id = d.id
        WHERE ot.token_date = %s
        ORDER BY ot.token_number ASC
        """,
        (today,),
        decision="fetchall"
    )

    # Group by doctor
    by_doctor = {}
    for r in rows:
        doc_name = r["doctor_name"]
        if doc_name not in by_doctor:
            by_doctor[doc_name] = {
                "doctor_id": r["doctor_id"],
                "doctor_name": doc_name,
                "specialty": r["category_name"],
                "room": r.get("clinic_address", "Consultation Cabin 1"),
                "current_token": None,
                "waiting_tokens": [],
                "completed_count": 0
            }
        if r["status"] == "in_consultation":
            by_doctor[doc_name]["current_token"] = r["token_number"]
        elif r["status"] == "waiting":
            by_doctor[doc_name]["waiting_tokens"].append(r["token_number"])
        elif r["status"] == "completed":
            by_doctor[doc_name]["completed_count"] += 1

    return {
        "date": today.isoformat(),
        "total_active": len([r for r in rows if r["status"] in ("in_consultation", "waiting")]),
        "doctors_on_duty": list(by_doctor.values()),
        "raw_tokens": rows
    }


@router.post("/opd-queue/call-next/{doctor_id}")
def call_next_opd_token(doctor_id: int, authorization: str | None = Header(None)):
    try:
        claims = authenticated_token_claims(authorization)
    except Exception:
        # Graceful fallback for clinic OPD queue signage TV and demo kiosk
        claims = {"role": "admin"}

    today = date.today()
    # Mark current in_consultation as completed
    db.query(
        """
        UPDATE opd_tokens
        SET status = 'completed'
        WHERE doctor_id = %s AND token_date = %s AND status = 'in_consultation'
        """,
        (doctor_id, today)
    )

    # Call next waiting token
    next_token = db.query(
        """
        UPDATE opd_tokens
        SET status = 'in_consultation'
        WHERE id = (
            SELECT id FROM opd_tokens
            WHERE doctor_id = %s AND token_date = %s AND status = 'waiting'
            ORDER BY token_number ASC
            LIMIT 1
        )
        RETURNING *
        """,
        (doctor_id, today)
    )

    if not next_token:
        return {"msg": "No more patients currently waiting in this doctor's queue.", "token": None}

    return {"msg": f"Now calling Token #{next_token['token_number']}", "token": next_token}


@router.post("/opd-queue/complete-current/{doctor_id}")
def complete_current_opd_session(doctor_id: int, authorization: str | None = Header(None)):
    today = date.today()
    current = db.query(
        """
        SELECT ot.*, d.name as doctor_name
        FROM opd_tokens ot
        JOIN doctors d ON d.id = ot.doctor_id
        WHERE ot.doctor_id = %s AND ot.token_date = %s AND ot.status = 'in_consultation'
        LIMIT 1
        """,
        (doctor_id, today),
        decision="fetchone"
    )

    if not current:
        return {
            "success": False,
            "msg": "No active patient in consultation for this doctor.",
            "completed": False
        }

    db.query(
        """
        UPDATE opd_tokens
        SET status = 'completed'
        WHERE id = %s
        """,
        (current["id"],)
    )

    if current.get("appointment_id"):
        db.query(
            """
            UPDATE appointments
            SET status = 'completed'
            WHERE id = %s
            """,
            (current["appointment_id"],)
        )

    patient_name = current.get("patient_name") or f"Token #{current['token_number']}"
    doc_name = current.get("doctor_name") or "Doctor"
    notification_msg = f"Consultation session completed for {patient_name} with {doc_name}. Patient notified."

    patient_user_id = None
    if current.get("appointment_id"):
        appt = db.query("SELECT user_id FROM appointments WHERE id = %s", (current["appointment_id"],), decision="fetchone")
        if appt:
            patient_user_id = appt["user_id"]

    # Role-isolated notifications
    create_role_notification(
        "patient",
        "Clinical Consultation Completed",
        f"Dear {patient_name}, your consultation session with {doc_name} is complete. Your prescription is ready on the portal.",
        category="opd",
        link="/prescriptions",
        recipient_id=patient_user_id
    )
    create_role_notification(
        "admin",
        "OPD Consultation Concluded",
        f"{doc_name} concluded consultation for {patient_name} (Token #{current['token_number']}).",
        category="opd",
        link="/opd-queue"
    )

    return {
        "success": True,
        "msg": notification_msg,
        "token_number": current["token_number"],
        "patient_name": patient_name,
        "doctor_name": doc_name,
        "notification_sent": True,
        "notification_text": f"Dear {patient_name}, your clinical consultation with {doc_name} is complete. Your prescription is ready on the portal."
    }


@router.post("/opd-queue/check-in")
def check_in_opd_patient(payload: OpdCheckInRequest, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Staff privileges required to check in patients.")

    today = date.today()
    max_token_row = db.query(
        "SELECT COALESCE(MAX(token_number), 0) AS max_t FROM opd_tokens WHERE doctor_id = %s AND token_date = %s",
        (payload.doctor_id, today),
        decision="fetchone"
    )
    next_token = (max_token_row["max_t"] if max_token_row else 0) + 1

    new_token = db.query(
        """
        INSERT INTO opd_tokens (appointment_id, doctor_id, patient_name, token_number, token_date, status, estimated_call_time)
        VALUES (%s, %s, %s, %s, %s, 'waiting', 'In Waiting Area')
        RETURNING *
        """,
        (payload.appointment_id, payload.doctor_id, payload.patient_name, next_token, today),
        decision="fetchone"
    )
    return {"success": True, "token": new_token, "msg": f"Patient {payload.patient_name} checked in as Token #{next_token}."}


@router.post("/opd-queue/remove-token/{token_id}")
def remove_opd_token(token_id: int, authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    if claims.get("role") not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Staff privileges required to remove queue tokens.")

    db.query("UPDATE opd_tokens SET status = 'cancelled' WHERE id = %s", (token_id,))
    return {"success": True, "msg": f"Token #{token_id} removed from waiting queue."}


# --- 7B. TELECONSULTATION INTERACTIVE CALLING SYSTEM ---

@router.post("/teleconsult/initiate-call")
def initiate_teleconsult_call(payload: TeleconsultCallRequest, authorization: str | None = Header(None)):
    authenticated_token_claims(authorization)
    recipient_role = "doctor" if payload.caller_role == "patient" else "patient"

    # End any prior calling records for this appointment
    db.query("UPDATE teleconsult_calls SET status = 'ended' WHERE appointment_id = %s AND status = 'calling'", (payload.appointment_id,))

    patient_id = payload.patient_id
    if not patient_id:
        appt = db.query("SELECT user_id FROM appointments WHERE id = %s", (payload.appointment_id,), decision="fetchone")
        if appt:
            patient_id = appt["user_id"]

    new_call = db.query(
        """
        INSERT INTO teleconsult_calls (
            appointment_id, caller_role, caller_name, recipient_role,
            doctor_id, patient_id, status, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, 'calling', NOW(), NOW())
        RETURNING *
        """,
        (payload.appointment_id, payload.caller_role, payload.caller_name, recipient_role, payload.doctor_id, patient_id),
        decision="fetchone"
    )

    if recipient_role == "doctor":
        create_role_notification(
            "doctor",
            "Incoming Video Teleconsultation",
            f"Patient {payload.caller_name} is calling you for scheduled video consultation.",
            category="teleconsult",
            link="/teleconsult",
            recipient_id=payload.doctor_id
        )
    else:
        create_role_notification(
            "patient",
            "Incoming Doctor Video Call",
            f"Dr. {payload.caller_name} is calling you for your teleconsultation appointment.",
            category="teleconsult",
            link="/teleconsult",
            recipient_id=patient_id
        )

    return {"success": True, "call": new_call}


@router.get("/teleconsult/check-incoming-call")
def check_incoming_call(authorization: str | None = Header(None)):
    claims = authenticated_token_claims(authorization)
    role = claims.get("role", "patient")
    user_id = claims.get("id")
    doctor_id = claims.get("doctor_id")

    if role in ("doctor", "admin"):
        # Check calls for this doctor
        call = db.query(
            """
            SELECT tc.*, d.name as doctor_name
            FROM teleconsult_calls tc
            LEFT JOIN doctors d ON d.id = tc.doctor_id
            WHERE tc.recipient_role = 'doctor'
              AND (tc.doctor_id = %s OR tc.doctor_id IN (SELECT id FROM doctors WHERE user_id = %s) OR %s = 1)
              AND tc.status = 'calling'
              AND tc.created_at >= NOW() - INTERVAL '90 seconds'
            ORDER BY tc.created_at DESC
            LIMIT 1
            """,
            (doctor_id, user_id, 1 if role == "admin" else 0),
            decision="fetchone"
        )
    else:
        # Check calls for this patient
        call = db.query(
            """
            SELECT tc.*, d.name as doctor_name
            FROM teleconsult_calls tc
            LEFT JOIN doctors d ON d.id = tc.doctor_id
            WHERE tc.recipient_role = 'patient'
              AND (tc.patient_id = %s OR tc.appointment_id IN (SELECT id FROM appointments WHERE user_id = %s))
              AND tc.status = 'calling'
              AND tc.created_at >= NOW() - INTERVAL '90 seconds'
            ORDER BY tc.created_at DESC
            LIMIT 1
            """,
            (user_id, user_id),
            decision="fetchone"
        )

    if call:
        return {"has_incoming_call": True, "call": call}
    return {"has_incoming_call": False, "call": None}


@router.post("/teleconsult/respond-call")
def respond_teleconsult_call(payload: TeleconsultCallResponseRequest, authorization: str | None = Header(None)):
    authenticated_token_claims(authorization)
    new_status = "accepted" if payload.action.lower() == "accept" else "declined"
    updated = db.query(
        """
        UPDATE teleconsult_calls
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        RETURNING *
        """,
        (new_status, payload.call_id),
        decision="fetchone"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Call record not found.")
    return {"success": True, "call": updated, "action": payload.action}


@router.get("/teleconsult/call-status/{call_id}")
def get_teleconsult_call_status(call_id: int):
    call = db.query("SELECT * FROM teleconsult_calls WHERE id = %s", (call_id,), decision="fetchone")
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found.")
    return {"call_id": call_id, "status": call["status"], "appointment_id": call["appointment_id"]}


@router.post("/teleconsult/end-call/{call_id}")
def end_teleconsult_call(call_id: int):
    db.query("UPDATE teleconsult_calls SET status = 'ended', updated_at = NOW() WHERE id = %s", (call_id,))
    return {"success": True, "call_id": call_id, "status": "ended"}


# --- 8. AI CLINICAL SYMPTOM CHECKER & TRIAGE ENGINE ---

@router.post("/triage")
def evaluate_symptom_triage(payload: SymptomTriageRequest):
    symptoms_lower = [s.lower() for s in payload.symptoms]
    desc_lower = payload.description.lower()
    all_text = " ".join(symptoms_lower) + " " + desc_lower

    # Emergency Red Flags
    is_emergency = False
    emergency_reasons = []

    if payload.has_chest_pain or "chest pain" in all_text or "crushing pain" in all_text or "radiating to arm" in all_text:
        is_emergency = True
        emergency_reasons.append("Severe acute chest pain radiating or pressure sensation. Cardiac evaluation required immediately.")
    if payload.has_shortness_of_breath or "difficulty breathing" in all_text or "stridor" in all_text:
        is_emergency = True
        emergency_reasons.append("Severe shortness of breath or respiratory distress.")
    if "loss of consciousness" in all_text or "fainting" in all_text or "sudden numbness" in all_text or "slurred speech" in all_text:
        is_emergency = True
        emergency_reasons.append("Sudden neurological deficit or syncope (possible stroke or TIA).")

    # Specialty Matching Algorithm
    specialty_match = "General Medicine"
    recommended_doctor_id = 3
    suspected_conditions = []
    urgency_level = "Routine (Outpatient)"

    if is_emergency:
        urgency_level = "EMERGENCY - RED FLAG"
        specialty_match = "Cardiology"
        recommended_doctor_id = 1
        suspected_conditions = ["Acute Coronary Syndrome (Rule Out)", "Cardiorespiratory Emergency", "Severe Angina"]
    elif any(k in all_text for k in ["heart", "palpitation", "high blood pressure", "hypertension", "swollen feet", "edema"]):
        specialty_match = "Cardiology"
        recommended_doctor_id = 1
        urgency_level = "Priority Consultation (Within 24-48h)"
        suspected_conditions = ["Essential Hypertension", "Arrhythmia / Palpitations", "Cardiovascular Checkup Needed"]
    elif any(k in all_text for k in ["skin", "rash", "acne", "itching", "eczema", "hair fall", "dandruff", "psoriasis", "spots"]):
        specialty_match = "Dermatology"
        recommended_doctor_id = 2
        urgency_level = "Routine (Within 3-5 days)"
        suspected_conditions = ["Contact Dermatitis / Eczema", "Acne Vulgaris", "Allergic Urticaria"]
    elif any(k in all_text for k in ["headache", "migraine", "dizziness", "vertigo", "seizure", "tingling", "nerve", "tremor"]):
        specialty_match = "Neurology"
        recommended_doctor_id = 4
        urgency_level = "Priority Consultation (Within 24-48h)"
        suspected_conditions = ["Migraine / Tension Headache", "Peripheral Neuropathy", "Benign Paroxysmal Positional Vertigo"]
    elif payload.age_years < 14 or any(k in all_text for k in ["child", "baby", "infant", "pediatric", "growth", "teething"]):
        specialty_match = "Pediatrics"
        recommended_doctor_id = 5
        urgency_level = "Priority Consultation"
        suspected_conditions = ["Pediatric Viral Syndrome", "Developmental Assessment", "Childhood Infection"]
    elif any(k in all_text for k in ["joint", "knee", "back pain", "spine", "bone", "fracture", "arthritis", "shoulder"]):
        specialty_match = "Orthopedics"
        recommended_doctor_id = 6
        urgency_level = "Routine Consultation"
        suspected_conditions = ["Osteoarthritis", "Lumbago / Mechanical Back Pain", "Ligament Sprain"]
    else:
        specialty_match = "General Medicine"
        recommended_doctor_id = 3
        urgency_level = "Standard Outpatient Visit"
        suspected_conditions = ["Acute Viral Pharyngitis / Flu", "General Malaise & Fatigue", "Lifestyle / Metabolic Checkup"]

    doctor_info = db.query(
        """
        SELECT d.id, d.name, d.fees, c.category_name, dp.qualification, dp.experience_years
        FROM doctors d
        LEFT JOIN categories c ON c.id = d.category_id
        LEFT JOIN doctor_profiles dp ON dp.doctor_id = d.id
        WHERE d.id = %s
        """,
        (recommended_doctor_id,),
        decision="fetchone"
    )

    triage_guidance = (
        "CRITICAL: Proceed immediately to the nearest Emergency Department or call our 24x7 Ambulance Helpline: +91 9999-108-108."
        if is_emergency else
        f"Based on your symptoms, a consultation with a specialist in {specialty_match} is highly recommended. You can book an appointment with {doctor_info['name'] if doctor_info else 'our specialist'} below."
    )

    return {
        "urgency_level": urgency_level,
        "is_emergency": is_emergency,
        "emergency_reasons": emergency_reasons,
        "specialty_recommended": specialty_match,
        "suspected_conditions": suspected_conditions,
        "triage_guidance": triage_guidance,
        "recommended_doctor": doctor_info,
        "prefilled_notes": f"Chief Complaint: {', '.join(payload.symptoms)}. Duration: {payload.duration_days} days. Notes: {payload.description or 'None'}"
    }


# --- 9. EMERGENCY & AMBULANCE DISPATCH HOTLINE ---

@router.get("/emergency/status")
def get_emergency_status():
    return {
        "emergency_hotline": "+91 9999-108-108",
        "toll_free": "1800-SANJEEVNI",
        "trauma_center_status": "Operational 24x7 - Level 1 Trauma",
        "on_duty_triage_officer": "Dr. Rajesh Sharma (Senior Chief Resident on Duty)",
        "ambulances_available": 3,
        "average_dispatch_eta_mins": 8,
        "clinic_location": {
            "name": "Sanjeevni Super-Specialty Medical Pavilion",
            "address": "Plot 42, Healthcare Boulevard, Metro Sector 18, New Delhi, India",
            "gps_coordinates": "28.5355° N, 77.3910° E"
        }
    }


# --- 10. ROLE-ISOLATED CLINICAL NOTIFICATIONS HUB ---

@router.get("/notifications")
def get_user_notifications(authorization: str | None = Header(None)):
    try:
        claims = authenticated_token_claims(authorization)
    except Exception:
        return {"role": "guest", "unread_count": 0, "notifications": []}

    role = claims.get("role", "patient")
    user_id = claims.get("id")
    doctor_id = claims.get("doctor_id")

    if role == "admin":
        notifs = db.query(
            """
            SELECT * FROM role_notifications
            WHERE recipient_role = 'admin'
            ORDER BY created_at DESC
            LIMIT 40
            """,
            decision="fetchall"
        )
    elif role == "doctor":
        notifs = db.query(
            """
            SELECT * FROM role_notifications
            WHERE recipient_role = 'doctor'
              AND (recipient_id IS NULL OR recipient_id = %s OR recipient_id = %s)
            ORDER BY created_at DESC
            LIMIT 40
            """,
            (doctor_id, user_id),
            decision="fetchall"
        )
    else:  # patient
        notifs = db.query(
            """
            SELECT * FROM role_notifications
            WHERE recipient_role = 'patient'
              AND (recipient_id IS NULL OR recipient_id = %s)
            ORDER BY created_at DESC
            LIMIT 40
            """,
            (user_id,),
            decision="fetchall"
        )

    unread_count = sum(1 for n in (notifs or []) if not n.get("is_read"))
    return {
        "role": role,
        "unread_count": unread_count,
        "notifications": notifs or []
    }


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, authorization: str | None = Header(None)):
    authenticated_token_claims(authorization)
    db.query("UPDATE role_notifications SET is_read = TRUE WHERE id = %s", (notif_id,))
    return {"success": True}


@router.post("/notifications/mark-all-read")
def mark_all_notifications_read(authorization: str | None = Header(None)):
    try:
        claims = authenticated_token_claims(authorization)
    except Exception:
        return {"success": False}

    role = claims.get("role", "patient")
    user_id = claims.get("id")
    doctor_id = claims.get("doctor_id")

    if role == "admin":
        db.query("UPDATE role_notifications SET is_read = TRUE WHERE recipient_role = 'admin'")
    elif role == "doctor":
        db.query(
            "UPDATE role_notifications SET is_read = TRUE WHERE recipient_role = 'doctor' AND (recipient_id IS NULL OR recipient_id = %s OR recipient_id = %s)",
            (doctor_id, user_id)
        )
    else:
        db.query(
            "UPDATE role_notifications SET is_read = TRUE WHERE recipient_role = 'patient' AND (recipient_id IS NULL OR recipient_id = %s)",
            (user_id,)
        )
    return {"success": True}
