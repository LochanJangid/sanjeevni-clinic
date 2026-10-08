import uuid
from datetime import datetime, timezone, date
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, status, Query
from pydantic import BaseModel, Field

from database.connection import Database
from routers.users import authenticated_token_claims

router = APIRouter(prefix="/ipd", tags=["IPD Inpatient & Discharge"])
db = Database()

# --- SCHEMAS ---

class AdmitPatientRequest(BaseModel):
    uhid: str = Field(min_length=3, max_length=30)
    patient_name: str = Field(min_length=2, max_length=120)
    age: Optional[int] = Field(default=None, ge=0, le=130)
    gender: Optional[str] = Field(default="Unknown", max_length=20)
    contact_phone: Optional[str] = Field(default="", max_length=25)
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = Field(default="Attending Physician", max_length=120)
    bed_id: Optional[int] = None
    admission_type: str = Field(default="planned")  # planned, emergency, day_care
    diagnosis: str = Field(min_length=2, max_length=500)
    attending_notes: Optional[str] = Field(default="", max_length=1000)
    initial_deposit: Optional[float] = Field(default=0.0, ge=0.0)
    deposit_payment_method: Optional[str] = Field(default="cash")  # cash, upi, card, phonepe


class AddDepositRequest(BaseModel):
    amount: float = Field(gt=0.0)
    payment_method: str = Field(default="cash")  # cash, upi, card, phonepe
    notes: Optional[str] = Field(default="", max_length=300)
    cashier_name: Optional[str] = Field(default="Reception Cashier", max_length=100)


class AddBillingItemRequest(BaseModel):
    category: str = Field(default="bed_charge")  # bed_charge, nursing, consultation, procedure, pharmacy, lab, ot_charge, miscellaneous
    item_name: str = Field(min_length=2, max_length=200)
    quantity: float = Field(default=1.0, gt=0.0)
    unit_price: float = Field(ge=0.0)
    gst_rate: float = Field(default=0.0, ge=0.0, le=28.0)  # GST exemption on clinical healthcare = 0.0%
    added_by: Optional[str] = Field(default="Ward Station", max_length=100)


class DischargePatientRequest(BaseModel):
    discharge_type: str = Field(default="cured_relieved")  # cured_relieved, lama, transferred, expired
    primary_diagnosis: str = Field(min_length=2, max_length=500)
    secondary_diagnosis: Optional[str] = Field(default="", max_length=500)
    clinical_summary: str = Field(min_length=5)
    treatment_given: str = Field(min_length=5)
    procedures_done: Optional[str] = Field(default="None", max_length=500)
    discharge_medications: List[dict] = Field(default_factory=list)
    follow_up_date: Optional[str] = None  # YYYY-MM-DD
    follow_up_instructions: Optional[str] = Field(default="Review in OPD after 7 days or SOS if symptoms worsen.", max_length=1000)
    emergency_instructions: Optional[str] = Field(default="Report to Emergency Room immediately in case of acute breathlessness, chest pain, or high fever.", max_length=1000)
    doctor_signature: Optional[str] = Field(default="Attending Consultant", max_length=120)


# --- ENDPOINTS ---

@router.get("/census")
def get_bed_census():
    """
    Returns live bed census for hospital ward management.
    Used by 10-50 bed hospital owners to track occupancy and revenue potential.
    """
    beds = db.query("""
        SELECT b.id, b.bed_number, b.ward_type, b.floor, b.has_oxygen, b.is_occupied,
               b.patient_name, b.doctor_id, d.name AS doctor_name, b.admitted_at,
               a.id AS admission_id, a.uhid, a.diagnosis
        FROM hospital_beds b
        LEFT JOIN doctors d ON b.doctor_id = d.id
        LEFT JOIN ipd_admissions a ON a.bed_id = b.id AND a.status = 'admitted'
        ORDER BY b.floor, b.ward_type, b.bed_number;
    """, decision="fetchall") or []

    total_beds = len(beds)
    occupied_beds = sum(1 for b in beds if b["is_occupied"])
    vacant_beds = total_beds - occupied_beds
    occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

    return {
        "status": "success",
        "summary": {
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "vacant_beds": vacant_beds,
            "occupancy_rate_percent": occupancy_rate,
        },
        "beds": beds,
    }


@router.get("/admissions")
def list_ipd_admissions(
    status_filter: str = Query(default="all", pattern="^(admitted|discharged|all)$"),
    limit: int = 50,
):
    """
    List inpatient admissions with financial running summary.
    """
    where_clause = ""
    params = ()
    if status_filter != "all":
        where_clause = "WHERE a.status = %s"
        params = (status_filter,)

    query = f"""
        SELECT 
            a.id, a.uhid, a.patient_name, a.age, a.gender, a.contact_phone,
            a.doctor_id, a.doctor_name, a.bed_id, a.bed_number, a.ward_type,
            a.admission_type, a.diagnosis, a.status, a.admission_date, a.discharge_date,
            COALESCE(SUM(bi.total_amount), 0.0) AS total_billed,
            COALESCE(dep.total_deposited, 0.0) AS total_deposited
        FROM ipd_admissions a
        LEFT JOIN ipd_billing_items bi ON bi.admission_id = a.id
        LEFT JOIN (
            SELECT admission_id, SUM(amount) AS total_deposited
            FROM ipd_deposits
            GROUP BY admission_id
        ) dep ON dep.admission_id = a.id
        {where_clause}
        GROUP BY a.id, dep.total_deposited
        ORDER BY a.admission_date DESC
        LIMIT {limit};
    """
    rows = db.query(query, params, decision="fetchall") or []
    for r in rows:
        billed = float(r["total_billed"])
        deposited = float(r["total_deposited"])
        r["total_billed"] = billed
        r["total_deposited"] = deposited
        r["balance_due"] = round(billed - deposited, 2)

    return {"status": "success", "count": len(rows), "admissions": rows}


@router.post("/admissions", status_code=status.HTTP_201_CREATED)
def admit_patient(payload: AdmitPatientRequest):
    """
    Admit a patient to IPD:
    - Verifies bed availability
    - Creates admission record
    - Marks bed occupied in hospital_beds
    - Accepts optional initial advance deposit
    """
    bed_number = None
    ward_type = None

    if payload.bed_id:
        bed = db.query("SELECT id, bed_number, ward_type, is_occupied FROM hospital_beds WHERE id = %s;", (payload.bed_id,))
        if not bed:
            raise HTTPException(status_code=404, detail="Selected bed does not exist.")
        if bed["is_occupied"]:
            raise HTTPException(status_code=400, detail=f"Bed {bed['bed_number']} is already occupied.")
        bed_number = bed["bed_number"]
        ward_type = bed["ward_type"]

    insert_query = """
        INSERT INTO ipd_admissions (
            uhid, patient_name, age, gender, contact_phone, doctor_id, doctor_name,
            bed_id, bed_number, ward_type, admission_type, diagnosis, attending_notes, status
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'admitted'
        ) RETURNING id, uhid, patient_name, admission_date, bed_number;
    """
    admit_record = db.query(
        insert_query,
        (
            payload.uhid, payload.patient_name, payload.age, payload.gender,
            payload.contact_phone, payload.doctor_id, payload.doctor_name,
            payload.bed_id, bed_number, ward_type, payload.admission_type,
            payload.diagnosis, payload.attending_notes
        ),
        decision="fetchone"
    )
    admission_id = admit_record["id"]

    # Mark bed occupied
    if payload.bed_id:
        db.query(
            "UPDATE hospital_beds SET is_occupied = TRUE, patient_name = %s, doctor_id = %s, admitted_at = NOW() WHERE id = %s;",
            (payload.patient_name, payload.doctor_id, payload.bed_id)
        )

    # Collect initial deposit if provided
    deposit_info = None
    if payload.initial_deposit > 0:
        receipt_num = f"DEP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        db.query("""
            INSERT INTO ipd_deposits (admission_id, amount, payment_method, receipt_number, notes)
            VALUES (%s, %s, %s, %s, 'Initial admission advance deposit');
        """, (admission_id, payload.initial_deposit, payload.deposit_payment_method, receipt_num))
        deposit_info = {"amount": payload.initial_deposit, "receipt_number": receipt_num}

    # Automatically add Day 1 bed charge item
    db.query("""
        INSERT INTO ipd_billing_items (admission_id, category, item_name, quantity, unit_price, gst_rate, total_amount, added_by)
        VALUES (%s, 'bed_charge', %s, 1.0, 1500.00, 0.0, 1500.00, 'Admission System');
    """, (admission_id, f"Admission & Bed Charge ({ward_type or 'General Ward'})"))

    return {
        "status": "success",
        "message": f"Patient {payload.patient_name} admitted successfully to {bed_number or 'Unassigned Bed'}",
        "admission": admit_record,
        "deposit": deposit_info,
    }


@router.get("/admissions/{admission_id}")
def get_ipd_admission_details(admission_id: int):
    """
    Complete financial and clinical view of an IPD admission:
    - Admission details
    - Running itemized billing ledger
    - Advance deposits collected
    - Balance due
    - Discharge summary (if discharged)
    """
    admission = db.query("""
        SELECT a.*, b.has_oxygen, b.floor
        FROM ipd_admissions a
        LEFT JOIN hospital_beds b ON a.bed_id = b.id
        WHERE a.id = %s;
    """, (admission_id,))
    if not admission:
        raise HTTPException(status_code=404, detail="IPD admission not found.")

    billing_items = db.query("""
        SELECT id, category, item_name, quantity, unit_price, gst_rate, total_amount, added_by, created_at
        FROM ipd_billing_items
        WHERE admission_id = %s
        ORDER BY created_at ASC;
    """, (admission_id,), decision="fetchall") or []

    deposits = db.query("""
        SELECT id, amount, payment_method, receipt_number, cashier_name, notes, created_at
        FROM ipd_deposits
        WHERE admission_id = %s
        ORDER BY created_at ASC;
    """, (admission_id,), decision="fetchall") or []

    discharge_summary = db.query("""
        SELECT * FROM ipd_discharge_summaries WHERE admission_id = %s;
    """, (admission_id,))

    # Calculations
    subtotal = sum(float(item["unit_price"]) * float(item["quantity"]) for item in billing_items)
    total_billed = sum(float(item["total_amount"]) for item in billing_items)
    total_tax = round(total_billed - subtotal, 2)
    total_deposited = sum(float(dep["amount"]) for dep in deposits)
    balance_due = round(total_billed - total_deposited, 2)

    return {
        "status": "success",
        "admission": admission,
        "billing_items": billing_items,
        "deposits": deposits,
        "discharge_summary": discharge_summary,
        "financials": {
            "subtotal": round(subtotal, 2),
            "total_tax": total_tax,
            "total_billed": round(total_billed, 2),
            "total_deposited": round(total_deposited, 2),
            "balance_due": balance_due,
            "gst_exemption_note": "Clinical establishment healthcare services are GST-exempt under Entry 74 Notification 12/2017-CT(R)",
        }
    }


@router.post("/admissions/{admission_id}/deposit")
def add_ipd_deposit(admission_id: int, payload: AddDepositRequest):
    """
    Collect interim advance deposit from inpatient family at reception desk.
    """
    admission = db.query("SELECT id, patient_name, status FROM ipd_admissions WHERE id = %s;", (admission_id,))
    if not admission:
        raise HTTPException(status_code=404, detail="IPD admission not found.")

    receipt_num = f"DEP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    db.query("""
        INSERT INTO ipd_deposits (admission_id, amount, payment_method, receipt_number, cashier_name, notes)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (admission_id, payload.amount, payload.payment_method, receipt_num, payload.cashier_name, payload.notes))

    return {
        "status": "success",
        "message": f"Advance deposit of ₹{payload.amount:.2f} collected successfully.",
        "receipt_number": receipt_num,
        "amount": payload.amount,
        "payment_method": payload.payment_method,
    }


@router.post("/admissions/{admission_id}/billing-item")
def add_ipd_billing_item(admission_id: int, payload: AddBillingItemRequest):
    """
    Add line item to running IPD ledger (e.g. daily consultation, surgery, nursing, medicines, lab).
    Clinical consultations & hospital bed charges carry 0% GST (statutory exemption).
    Pharmacy goods carry line-item configurable GST (e.g. 12%).
    """
    admission = db.query("SELECT id, status FROM ipd_admissions WHERE id = %s;", (admission_id,))
    if not admission:
        raise HTTPException(status_code=404, detail="IPD admission not found.")

    base_total = payload.quantity * payload.unit_price
    tax = round(base_total * (payload.gst_rate / 100.0), 2)
    final_total = round(base_total + tax, 2)

    db.query("""
        INSERT INTO ipd_billing_items (admission_id, category, item_name, quantity, unit_price, gst_rate, total_amount, added_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        admission_id, payload.category, payload.item_name, payload.quantity,
        payload.unit_price, payload.gst_rate, final_total, payload.added_by
    ))

    return {
        "status": "success",
        "message": f"Added '{payload.item_name}' to inpatient bill.",
        "item": {
            "item_name": payload.item_name,
            "category": payload.category,
            "quantity": payload.quantity,
            "unit_price": payload.unit_price,
            "gst_rate": payload.gst_rate,
            "total_amount": final_total,
        }
    }


@router.post("/admissions/{admission_id}/discharge")
def discharge_patient(admission_id: int, payload: DischargePatientRequest):
    """
    Discharge inpatient:
    - Generates statutory discharge summary
    - Frees hospital bed in hospital_beds table
    - Sets admission status to 'discharged' with discharge_date = NOW()
    """
    admission = db.query("SELECT * FROM ipd_admissions WHERE id = %s;", (admission_id,))
    if not admission:
        raise HTTPException(status_code=404, detail="IPD admission not found.")
    if admission["status"] == "discharged":
        raise HTTPException(status_code=400, detail="Patient is already discharged.")

    import json
    meds_json = json.dumps(payload.discharge_medications)

    # Insert or update discharge summary
    db.query("""
        INSERT INTO ipd_discharge_summaries (
            admission_id, discharge_date, discharge_type, primary_diagnosis, secondary_diagnosis,
            clinical_summary, treatment_given, procedures_done, discharge_medications,
            follow_up_date, follow_up_instructions, emergency_instructions, doctor_signature
        ) VALUES (
            %s, NOW(), %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s
        )
        ON CONFLICT (admission_id) DO UPDATE SET
            discharge_date = NOW(),
            discharge_type = EXCLUDED.discharge_type,
            primary_diagnosis = EXCLUDED.primary_diagnosis,
            secondary_diagnosis = EXCLUDED.secondary_diagnosis,
            clinical_summary = EXCLUDED.clinical_summary,
            treatment_given = EXCLUDED.treatment_given,
            procedures_done = EXCLUDED.procedures_done,
            discharge_medications = EXCLUDED.discharge_medications,
            follow_up_date = EXCLUDED.follow_up_date,
            follow_up_instructions = EXCLUDED.follow_up_instructions,
            emergency_instructions = EXCLUDED.emergency_instructions,
            doctor_signature = EXCLUDED.doctor_signature;
    """, (
        admission_id, payload.discharge_type, payload.primary_diagnosis, payload.secondary_diagnosis,
        payload.clinical_summary, payload.treatment_given, payload.procedures_done, meds_json,
        payload.follow_up_date, payload.follow_up_instructions, payload.emergency_instructions,
        payload.doctor_signature
    ))

    # Mark admission discharged
    db.query("UPDATE ipd_admissions SET status = 'discharged', discharge_date = NOW() WHERE id = %s;", (admission_id,))

    # Release hospital bed
    if admission["bed_id"]:
        db.query(
            "UPDATE hospital_beds SET is_occupied = FALSE, patient_name = NULL, doctor_id = NULL, admitted_at = NULL WHERE id = %s;",
            (admission["bed_id"],)
        )

    return {
        "status": "success",
        "message": f"Patient {admission['patient_name']} discharged successfully. Bed {admission['bed_number']} is now vacant.",
        "discharge_date": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/admissions/{admission_id}/discharge-summary")
def get_discharge_summary_printable(admission_id: int):
    """
    Get printable discharge summary document formatted with hospital header,
    clinical course, discharge prescriptions, and follow-up guidance.
    """
    admission = db.query("""
        SELECT a.*, d.name AS doctor_full_name, d.specialty
        FROM ipd_admissions a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.id = %s;
    """, (admission_id,))
    if not admission:
        raise HTTPException(status_code=404, detail="IPD admission not found.")

    summary = db.query("SELECT * FROM ipd_discharge_summaries WHERE admission_id = %s;", (admission_id,))
    if not summary:
        raise HTTPException(status_code=404, detail="No discharge summary generated for this admission yet.")

    return {
        "status": "success",
        "admission": admission,
        "summary": summary,
        "statutory_notice": "This document is a certified Clinical Establishment Discharge Summary under CEA 2010 rules.",
    }
