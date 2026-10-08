import uuid
from datetime import datetime, timezone, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field

from database.connection import Database

router = APIRouter(prefix="/pharmacy-lab", tags=["Pharmacy Stock & Lab Catalogue"])
db = Database()

# --- PYDANTIC SCHEMAS ---

class CreateBatchRequest(BaseModel):
    medicine_id: int
    batch_number: str = Field(min_length=2, max_length=60)
    expiry_date: str = Field(pattern="^\\d{4}-\\d{2}-\\d{2}$")  # YYYY-MM-DD
    mrp: float = Field(gt=0.0)
    purchase_cost: float = Field(gt=0.0)
    quantity_received: int = Field(gt=0)
    supplier_name: Optional[str] = Field(default="Standard Pharma Distributors", max_length=120)


class DispenseItem(BaseModel):
    medicine_id: int
    batch_id: Optional[int] = None
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0.0)
    gst_rate: float = Field(default=12.0, ge=0.0, le=28.0)


class DispenseRequest(BaseModel):
    uhid: Optional[str] = Field(default="WALK-IN", max_length=30)
    patient_name: str = Field(min_length=2, max_length=120)
    doctor_name: Optional[str] = Field(default="Hospital Doctor", max_length=120)
    payment_method: str = Field(default="cash")  # cash, upi, card, phonepe
    dispensed_by: Optional[str] = Field(default="Chief Pharmacist", max_length=100)
    items: List[DispenseItem] = Field(min_items=1)


class CreateLabTestRequest(BaseModel):
    test_code: str = Field(min_length=2, max_length=30)
    test_name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=80)
    standard_rate: float = Field(gt=0.0)
    turnaround_hours: int = Field(default=4, ge=1)
    sample_type: str = Field(default="Venous Blood", max_length=60)
    normal_range: Optional[str] = Field(default="", max_length=300)
    unit: Optional[str] = Field(default="", max_length=30)


class OrderLabTestRequest(BaseModel):
    uhid: str = Field(min_length=3, max_length=30)
    patient_name: str = Field(min_length=2, max_length=120)
    doctor_name: Optional[str] = Field(default="OPD Consultant", max_length=120)
    test_id: int
    clinical_notes: Optional[str] = Field(default="", max_length=300)


class RecordLabResultRequest(BaseModel):
    result_value: str = Field(min_length=1, max_length=100)
    reference_range: Optional[str] = Field(default="", max_length=100)
    is_abnormal: bool = False
    clinical_notes: Optional[str] = Field(default="", max_length=500)


# ==========================================
# PHARMACY ENDPOINTS
# ==========================================

@router.get("/pharmacy/batches")
def list_pharmacy_batches():
    """
    List pharmacy stock batches with expiry alerts:
    - expired: days_until_expiry < 0
    - expiring_soon: days_until_expiry <= 60
    - valid: normal stock
    """
    query = """
        SELECT b.id, b.medicine_id, m.name AS medicine_name, m.generic_name, m.category,
               b.batch_number, b.expiry_date, b.mrp, b.purchase_cost,
               b.quantity_received, b.quantity_remaining, b.supplier_name, b.received_at
        FROM pharmacy_batches b
        JOIN pharmacy_medicines m ON b.medicine_id = m.id
        ORDER BY b.expiry_date ASC;
    """
    rows = db.query(query, decision="fetchall") or []
    today = date.today()

    batches = []
    expiring_soon_count = 0
    expired_count = 0

    for r in rows:
        exp_date = r["expiry_date"]
        if isinstance(exp_date, str):
            exp_date = datetime.strptime(exp_date, "%Y-%m-%d").date()

        days_left = (exp_date - today).days
        if days_left < 0:
            status_alert = "expired"
            expired_count += 1
        elif days_left <= 60:
            status_alert = "expiring_soon"
            expiring_soon_count += 1
        else:
            status_alert = "valid"

        r["days_until_expiry"] = days_left
        r["expiry_status"] = status_alert
        r["mrp"] = float(r["mrp"])
        r["purchase_cost"] = float(r["purchase_cost"])
        batches.append(r)

    return {
        "status": "success",
        "summary": {
            "total_batches": len(batches),
            "expiring_soon_count": expiring_soon_count,
            "expired_count": expired_count,
        },
        "batches": batches,
    }


@router.post("/pharmacy/batches", status_code=status.HTTP_201_CREATED)
def create_pharmacy_batch(payload: CreateBatchRequest):
    """
    Receive new batch of medicines from distributor.
    """
    med = db.query("SELECT id, name FROM pharmacy_medicines WHERE id = %s;", (payload.medicine_id,))
    if not med:
        raise HTTPException(status_code=404, detail="Medicine ID not found.")

    insert_query = """
        INSERT INTO pharmacy_batches (
            medicine_id, batch_number, expiry_date, mrp, purchase_cost,
            quantity_received, quantity_remaining, supplier_name
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id, batch_number, expiry_date, quantity_remaining;
    """
    batch = db.query(
        insert_query,
        (
            payload.medicine_id, payload.batch_number, payload.expiry_date,
            payload.mrp, payload.purchase_cost, payload.quantity_received,
            payload.quantity_received, payload.supplier_name
        ),
        decision="fetchone"
    )

    # Increment master medicine stock
    db.query(
        "UPDATE pharmacy_medicines SET stock_quantity = stock_quantity + %s WHERE id = %s;",
        (payload.quantity_received, payload.medicine_id)
    )

    return {
        "status": "success",
        "message": f"Batch {payload.batch_number} added for {med['name']}.",
        "batch": batch,
    }


@router.post("/pharmacy/dispense", status_code=status.HTTP_201_CREATED)
def dispense_medicines(payload: DispenseRequest):
    """
    Dispense prescription items to patient:
    - Deducts quantity from selected batch (or FIFO oldest valid batch)
    - Deducts master medicine stock
    - Calculates GST (pharmacy goods carry GST)
    - Returns official Cash / Merchant Receipt
    """
    receipt_num = f"RX-DISP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    subtotal = 0.0
    gst_total = 0.0
    items_to_insert = []

    for item in payload.items:
        med = db.query("SELECT id, name, stock_quantity FROM pharmacy_medicines WHERE id = %s;", (item.medicine_id,))
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine ID {item.medicine_id} not found.")

        # Find batch
        batch_id = item.batch_id
        batch_num = "GENERAL"
        if batch_id:
            batch = db.query("SELECT id, batch_number, quantity_remaining FROM pharmacy_batches WHERE id = %s;", (batch_id,))
            if batch:
                batch_num = batch["batch_number"]
                # Deduct batch quantity
                new_batch_qty = max(0, batch["quantity_remaining"] - item.quantity)
                db.query("UPDATE pharmacy_batches SET quantity_remaining = %s WHERE id = %s;", (new_batch_qty, batch_id))
        else:
            # Auto pick active batch
            active_batch = db.query("""
                SELECT id, batch_number, quantity_remaining 
                FROM pharmacy_batches 
                WHERE medicine_id = %s AND quantity_remaining >= %s AND expiry_date >= CURRENT_DATE
                ORDER BY expiry_date ASC LIMIT 1;
            """, (item.medicine_id, item.quantity))
            if active_batch:
                batch_id = active_batch["id"]
                batch_num = active_batch["batch_number"]
                db.query("UPDATE pharmacy_batches SET quantity_remaining = quantity_remaining - %s WHERE id = %s;", (item.quantity, batch_id))

        # Deduct main medicine stock
        db.query("UPDATE pharmacy_medicines SET stock_quantity = GREATEST(0, stock_quantity - %s) WHERE id = %s;", (item.quantity, item.medicine_id))

        item_subtotal = item.quantity * item.unit_price
        item_gst = round(item_subtotal * (item.gst_rate / 100.0), 2)
        item_total = round(item_subtotal + item_gst, 2)

        subtotal += item_subtotal
        gst_total += item_gst

        items_to_insert.append({
            "batch_id": batch_id,
            "medicine_id": item.medicine_id,
            "medicine_name": med["name"],
            "batch_number": batch_num,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "gst_rate": item.gst_rate,
            "total_amount": item_total,
        })

    final_total = round(subtotal + gst_total, 2)

    # Insert dispensation header
    disp_row = db.query("""
        INSERT INTO pharmacy_dispensations (
            receipt_number, uhid, patient_name, doctor_name, subtotal,
            gst_amount, total_amount, payment_method, dispensed_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id;
    """, (
        receipt_num, payload.uhid, payload.patient_name, payload.doctor_name,
        subtotal, gst_total, final_total, payload.payment_method, payload.dispensed_by
    ), decision="fetchone")

    disp_id = disp_row["id"]

    # Insert line items
    for itm in items_to_insert:
        db.query("""
            INSERT INTO pharmacy_dispensation_items (
                dispensation_id, batch_id, medicine_name, batch_number, quantity, unit_price, gst_rate, total_amount
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            disp_id, itm["batch_id"], itm["medicine_name"], itm["batch_number"],
            itm["quantity"], itm["unit_price"], itm["gst_rate"], itm["total_amount"]
        ))

    return {
        "status": "success",
        "receipt_number": receipt_num,
        "patient_name": payload.patient_name,
        "subtotal": round(subtotal, 2),
        "gst_amount": round(gst_total, 2),
        "total_amount": final_total,
        "payment_method": payload.payment_method,
        "items_count": len(items_to_insert),
        "items": items_to_insert,
    }


# ==========================================
# LAB CATALOGUE & ORDER ENDPOINTS
# ==========================================

@router.get("/lab/catalogue")
def get_lab_catalogue():
    """
    Get all diagnostic tests available in the hospital lab catalogue.
    """
    tests = db.query("""
        SELECT id, test_code, test_name, category, standard_rate, turnaround_hours,
               sample_type, normal_range, unit, is_active
        FROM lab_test_catalogue
        WHERE is_active = TRUE
        ORDER BY category, test_name;
    """, decision="fetchall") or []

    for t in tests:
        t["standard_rate"] = float(t["standard_rate"])

    return {"status": "success", "count": len(tests), "catalogue": tests}


@router.post("/lab/catalogue", status_code=status.HTTP_201_CREATED)
def add_lab_test_to_catalogue(payload: CreateLabTestRequest):
    """
    Add a new diagnostic investigation to the hospital catalogue.
    """
    new_test = db.query("""
        INSERT INTO lab_test_catalogue (
            test_code, test_name, category, standard_rate, turnaround_hours,
            sample_type, normal_range, unit
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, test_code, test_name, standard_rate;
    """, (
        payload.test_code.upper(), payload.test_name, payload.category,
        payload.standard_rate, payload.turnaround_hours, payload.sample_type,
        payload.normal_range, payload.unit
    ), decision="fetchone")

    return {"status": "success", "message": f"Added {payload.test_name} to Lab Catalogue", "test": new_test}


@router.get("/lab/orders")
def list_lab_orders(
    status_filter: Optional[str] = Query(default=None, pattern="^(ordered|collected|in_lab|completed)$"),
    limit: int = 50,
):
    """
    List diagnostic sample orders across phlebotomy and lab pipeline.
    """
    where_clause = ""
    params = ()
    if status_filter:
        where_clause = "WHERE sample_status = %s"
        params = (status_filter,)

    orders = db.query(f"""
        SELECT id, uhid, patient_name, doctor_name, test_id, test_code, test_name,
               sample_barcode, sample_status, result_value, reference_range,
               is_abnormal, clinical_notes, ordered_at, collected_at, completed_at
        FROM lab_orders
        {where_clause}
        ORDER BY ordered_at DESC
        LIMIT {limit};
    """, params, decision="fetchall") or []

    return {"status": "success", "count": len(orders), "orders": orders}


@router.post("/lab/orders", status_code=status.HTTP_201_CREATED)
def order_lab_test(payload: OrderLabTestRequest):
    """
    Doctor or reception orders an investigation for a patient.
    Generates a unique sample barcode e.g. SMPL-2026-XXXXXX.
    """
    test = db.query("SELECT id, test_code, test_name, normal_range FROM lab_test_catalogue WHERE id = %s;", (payload.test_id,))
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found in catalogue.")

    barcode = f"SMPL-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"

    order = db.query("""
        INSERT INTO lab_orders (
            uhid, patient_name, doctor_name, test_id, test_code, test_name,
            sample_barcode, sample_status, reference_range, clinical_notes
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, 'ordered', %s, %s
        ) RETURNING id, sample_barcode, sample_status, ordered_at;
    """, (
        payload.uhid, payload.patient_name, payload.doctor_name, test["id"],
        test["test_code"], test["test_name"], barcode, test["normal_range"], payload.clinical_notes
    ), decision="fetchone")

    return {
        "status": "success",
        "message": f"Sample requisition registered for {payload.patient_name}",
        "barcode": barcode,
        "order": order,
    }


@router.patch("/lab/orders/{order_id}/collect-sample")
def mark_sample_collected(order_id: int):
    """
    Phlebotomist scans barcode at collection desk and marks sample collected.
    """
    order = db.query("SELECT id, patient_name, sample_status FROM lab_orders WHERE id = %s;", (order_id,))
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found.")

    db.query("""
        UPDATE lab_orders 
        SET sample_status = 'collected', collected_at = NOW() 
        WHERE id = %s;
    """, (order_id,))

    return {"status": "success", "message": f"Sample for {order['patient_name']} marked as collected."}


@router.post("/lab/orders/{order_id}/record-result")
def record_lab_result(order_id: int, payload: RecordLabResultRequest):
    """
    Hospital Pathologist records measured test result and clinical interpretation.
    """
    order = db.query("SELECT id, patient_name, test_name FROM lab_orders WHERE id = %s;", (order_id,))
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found.")

    db.query("""
        UPDATE lab_orders 
        SET sample_status = 'completed',
            result_value = %s,
            reference_range = COALESCE(NULLIF(%s, ''), reference_range),
            is_abnormal = %s,
            clinical_notes = %s,
            completed_at = NOW()
        WHERE id = %s;
    """, (payload.result_value, payload.reference_range, payload.is_abnormal, payload.clinical_notes, order_id))

    return {
        "status": "success",
        "message": f"Report generated and verified for {order['test_name']} ({order['patient_name']}).",
        "result_value": payload.result_value,
        "is_abnormal": payload.is_abnormal,
    }
