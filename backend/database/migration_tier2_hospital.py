"""
Tier-2 Hospital OS Migration & Reversible Schema
Includes:
- IPD Admissions, Deposits, Billing Items, Discharge Summaries
- Pharmacy Batch Tracking, Stock & Dispensing
- Lab Test Catalogue & Lab Orders
- DPDP Act (Consent Logs, Immutable Audit Trail, Data Requests, Breach Log)
- ABDM Sandbox (M1 ABHA Profiles, M2 Care Contexts, M3 HIU Consent)
- Cash Drawer Daily Sessions (Reception & Billing Reconciliation)

Reversible: python backend/database/migration_tier2_hospital.py down
Forward:    python backend/database/migration_tier2_hospital.py up
"""

import sys
import json
from datetime import datetime, timezone, timedelta, date
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database.connection import get_connection

def up():
    print("[MIGRATION UP] Applying Tier-2 Hospital schema...")
    with get_connection() as conn:
        with conn.cursor() as cur:
            # 1. IPD Inpatient Module
            cur.execute("""
            CREATE TABLE IF NOT EXISTS ipd_admissions (
                id SERIAL PRIMARY KEY,
                uhid VARCHAR(30) NOT NULL,
                patient_name VARCHAR(120) NOT NULL,
                age INTEGER,
                gender VARCHAR(20),
                contact_phone VARCHAR(20),
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
                doctor_name VARCHAR(120),
                bed_id INTEGER REFERENCES hospital_beds(id) ON DELETE SET NULL,
                bed_number VARCHAR(30),
                ward_type VARCHAR(60),
                admission_type VARCHAR(40) DEFAULT 'planned', -- planned, emergency, day_care
                diagnosis TEXT,
                attending_notes TEXT,
                status VARCHAR(30) DEFAULT 'admitted', -- admitted, discharged, transferred
                admission_date TIMESTAMPTZ DEFAULT NOW(),
                discharge_date TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS ipd_deposits (
                id SERIAL PRIMARY KEY,
                admission_id INTEGER REFERENCES ipd_admissions(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL,
                payment_method VARCHAR(40) NOT NULL, -- cash, upi, card, phonepe
                receipt_number VARCHAR(60) UNIQUE NOT NULL,
                cashier_id VARCHAR(50) DEFAULT 'desk-cashier-1',
                cashier_name VARCHAR(100) DEFAULT 'Reception Desk',
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS ipd_billing_items (
                id SERIAL PRIMARY KEY,
                admission_id INTEGER REFERENCES ipd_admissions(id) ON DELETE CASCADE,
                category VARCHAR(60) NOT NULL, -- bed_charge, nursing, consultation, procedure, pharmacy, lab, ot_charge, miscellaneous
                item_name VARCHAR(200) NOT NULL,
                quantity NUMERIC(6, 2) DEFAULT 1.0,
                unit_price NUMERIC(10, 2) NOT NULL,
                gst_rate NUMERIC(4, 2) DEFAULT 0.0, -- GST % (0.0 for clinical healthcare services)
                total_amount NUMERIC(10, 2) NOT NULL,
                added_by VARCHAR(100) DEFAULT 'System',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS ipd_discharge_summaries (
                id SERIAL PRIMARY KEY,
                admission_id INTEGER UNIQUE REFERENCES ipd_admissions(id) ON DELETE CASCADE,
                discharge_date TIMESTAMPTZ DEFAULT NOW(),
                discharge_type VARCHAR(50) DEFAULT 'cured_relieved', -- cured_relieved, lama (left against medical advice), transferred, expired
                primary_diagnosis TEXT NOT NULL,
                secondary_diagnosis TEXT,
                clinical_summary TEXT,
                treatment_given TEXT,
                procedures_done TEXT,
                discharge_medications JSONB DEFAULT '[]'::jsonb,
                follow_up_date DATE,
                follow_up_instructions TEXT,
                emergency_instructions TEXT DEFAULT 'In case of chest pain, severe breathlessness or high fever, report to Emergency Room immediately.',
                doctor_signature VARCHAR(120),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # 2. Pharmacy Batch Tracking & Dispensing
            # Check if columns exist in pharmacy_medicines, add if missing
            cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharmacy_medicines' AND column_name='hsn_code') THEN
                    ALTER TABLE pharmacy_medicines ADD COLUMN hsn_code VARCHAR(30) DEFAULT '3004';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharmacy_medicines' AND column_name='reorder_level') THEN
                    ALTER TABLE pharmacy_medicines ADD COLUMN reorder_level INTEGER DEFAULT 20;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharmacy_medicines' AND column_name='mrp') THEN
                    ALTER TABLE pharmacy_medicines ADD COLUMN mrp NUMERIC(8, 2) DEFAULT 100.0;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharmacy_medicines' AND column_name='purchase_cost') THEN
                    ALTER TABLE pharmacy_medicines ADD COLUMN purchase_cost NUMERIC(8, 2) DEFAULT 70.0;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharmacy_medicines' AND column_name='rack_location') THEN
                    ALTER TABLE pharmacy_medicines ADD COLUMN rack_location VARCHAR(30) DEFAULT 'Rack-A1';
                END IF;
            END $$;
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS pharmacy_batches (
                id SERIAL PRIMARY KEY,
                medicine_id INTEGER REFERENCES pharmacy_medicines(id) ON DELETE CASCADE,
                batch_number VARCHAR(60) NOT NULL,
                expiry_date DATE NOT NULL,
                mrp NUMERIC(8, 2) NOT NULL,
                purchase_cost NUMERIC(8, 2) NOT NULL,
                quantity_received INTEGER NOT NULL,
                quantity_remaining INTEGER NOT NULL,
                supplier_name VARCHAR(120) DEFAULT 'Jaipur Pharma Distributors',
                received_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(medicine_id, batch_number)
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS pharmacy_dispensations (
                id SERIAL PRIMARY KEY,
                receipt_number VARCHAR(60) UNIQUE NOT NULL,
                uhid VARCHAR(30),
                patient_name VARCHAR(120) NOT NULL,
                doctor_name VARCHAR(120),
                subtotal NUMERIC(10, 2) NOT NULL,
                gst_amount NUMERIC(10, 2) DEFAULT 0.0,
                total_amount NUMERIC(10, 2) NOT NULL,
                payment_method VARCHAR(40) DEFAULT 'cash',
                dispensed_by VARCHAR(100) DEFAULT 'Chief Pharmacist',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS pharmacy_dispensation_items (
                id SERIAL PRIMARY KEY,
                dispensation_id INTEGER REFERENCES pharmacy_dispensations(id) ON DELETE CASCADE,
                batch_id INTEGER REFERENCES pharmacy_batches(id) ON DELETE SET NULL,
                medicine_name VARCHAR(150) NOT NULL,
                batch_number VARCHAR(60),
                quantity INTEGER NOT NULL,
                unit_price NUMERIC(8, 2) NOT NULL,
                gst_rate NUMERIC(4, 2) DEFAULT 12.0, -- Pharmacy goods carry GST (5% or 12%)
                total_amount NUMERIC(8, 2) NOT NULL
            );
            """)

            # 3. Lab Catalogue & Order Sample Tracking
            cur.execute("""
            CREATE TABLE IF NOT EXISTS lab_test_catalogue (
                id SERIAL PRIMARY KEY,
                test_code VARCHAR(30) UNIQUE NOT NULL,
                test_name VARCHAR(150) NOT NULL,
                category VARCHAR(80) NOT NULL, -- Biochemistry, Hematology, Microbiology, Radiology, Pathology
                standard_rate NUMERIC(8, 2) NOT NULL,
                turnaround_hours INTEGER DEFAULT 4,
                sample_type VARCHAR(60) DEFAULT 'Venous Blood', -- Venous Blood, Urine, Sputum, Swab, Imaging
                normal_range TEXT,
                unit VARCHAR(30),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS lab_orders (
                id SERIAL PRIMARY KEY,
                uhid VARCHAR(30) NOT NULL,
                patient_name VARCHAR(120) NOT NULL,
                doctor_name VARCHAR(120),
                test_id INTEGER REFERENCES lab_test_catalogue(id) ON DELETE SET NULL,
                test_code VARCHAR(30),
                test_name VARCHAR(150) NOT NULL,
                sample_barcode VARCHAR(60) UNIQUE NOT NULL,
                sample_status VARCHAR(40) DEFAULT 'ordered', -- ordered, collected, in_lab, completed
                result_value VARCHAR(100),
                reference_range VARCHAR(100),
                is_abnormal BOOLEAN DEFAULT FALSE,
                clinical_notes TEXT,
                ordered_at TIMESTAMPTZ DEFAULT NOW(),
                collected_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ
            );
            """)

            # 4. DPDP Act Compliance Tables (Rule 5)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS dpdp_consent_logs (
                id SERIAL PRIMARY KEY,
                uhid VARCHAR(30) NOT NULL,
                patient_name VARCHAR(120) NOT NULL,
                consent_type VARCHAR(60) NOT NULL, -- treatment_data, teleconsultation, abha_linkage, anonymized_analytics
                purpose TEXT NOT NULL,
                status VARCHAR(30) DEFAULT 'granted', -- granted, revoked, expired
                granted_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ,
                ip_address VARCHAR(50),
                captured_by VARCHAR(100) DEFAULT 'Receptionist / Doctor Desk',
                consent_artifact_hash VARCHAR(128)
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS dpdp_audit_trail (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                actor_id VARCHAR(50) NOT NULL,
                actor_name VARCHAR(100) NOT NULL,
                actor_role VARCHAR(50) NOT NULL, -- doctor, admin, nurse, pharmacist, patient
                action VARCHAR(50) NOT NULL, -- view, create, update, delete, export
                resource_type VARCHAR(60) NOT NULL, -- patient, prescription, billing, lab_report, ipd_summary
                resource_id VARCHAR(60) NOT NULL,
                ip_address VARCHAR(50),
                reason TEXT,
                details JSONB DEFAULT '{}'::jsonb
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS dpdp_data_requests (
                id SERIAL PRIMARY KEY,
                uhid VARCHAR(30) NOT NULL,
                patient_name VARCHAR(120) NOT NULL,
                request_type VARCHAR(50) NOT NULL, -- export_my_data, erasure_request, correction_request
                status VARCHAR(40) DEFAULT 'received', -- received, processing, completed, rejected
                requested_at TIMESTAMPTZ DEFAULT NOW(),
                fulfilled_at TIMESTAMPTZ,
                fulfillment_notes TEXT
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS dpdp_breach_logs (
                id SERIAL PRIMARY KEY,
                incident_date TIMESTAMPTZ NOT NULL,
                detected_date TIMESTAMPTZ DEFAULT NOW(),
                severity VARCHAR(30) DEFAULT 'low', -- low, medium, high, critical
                affected_records_count INTEGER DEFAULT 0,
                description TEXT NOT NULL,
                remedial_action TEXT NOT NULL,
                reported_to_board BOOLEAN DEFAULT FALSE,
                reported_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # 5. ABDM Sandbox Tables (Rule 6)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS abdm_abha_profiles (
                id SERIAL PRIMARY KEY,
                uhid VARCHAR(30) UNIQUE NOT NULL,
                abha_number VARCHAR(30) UNIQUE NOT NULL, -- 14-digit ABHA (e.g. 91-2345-6789-0123)
                abha_address VARCHAR(100) UNIQUE NOT NULL, -- e.g. ram.sharma@abdm
                name VARCHAR(120) NOT NULL,
                gender VARCHAR(20),
                dob DATE,
                mobile VARCHAR(20),
                status VARCHAR(30) DEFAULT 'linked', -- linked, pending_otp, unlinked
                kyc_verified BOOLEAN DEFAULT TRUE,
                linked_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS abdm_care_contexts (
                id SERIAL PRIMARY KEY,
                uhid VARCHAR(30) NOT NULL,
                abha_address VARCHAR(100) NOT NULL,
                care_context_ref VARCHAR(80) NOT NULL, -- e.g. OPD-VISIT-2026-0042, IPD-ADMIT-108
                care_context_type VARCHAR(60) NOT NULL, -- OPD_RECORD, DISCHARGE_SUMMARY, DIAGNOSTIC_REPORT
                description VARCHAR(200) NOT NULL,
                fhir_bundle_json JSONB,
                linked_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS abdm_consent_requests (
                id SERIAL PRIMARY KEY,
                consent_request_id VARCHAR(80) UNIQUE NOT NULL,
                hiu_id VARCHAR(80) NOT NULL,
                hip_id VARCHAR(80) NOT NULL,
                patient_abha VARCHAR(100) NOT NULL,
                consent_status VARCHAR(40) DEFAULT 'REQUESTED', -- REQUESTED, GRANTED, DENIED, REVOKED
                purpose VARCHAR(100) DEFAULT 'Care Management',
                date_from DATE,
                date_to DATE,
                granted_at TIMESTAMPTZ,
                expires_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # 6. Cash Drawer Sessions
            cur.execute("""
            CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
                id SERIAL PRIMARY KEY,
                session_date DATE NOT NULL,
                cashier_id VARCHAR(50) NOT NULL,
                cashier_name VARCHAR(100) NOT NULL,
                opening_cash NUMERIC(10, 2) DEFAULT 2000.00,
                cash_collected NUMERIC(10, 2) DEFAULT 0.00,
                upi_collected NUMERIC(10, 2) DEFAULT 0.00,
                card_collected NUMERIC(10, 2) DEFAULT 0.00,
                phonepe_collected NUMERIC(10, 2) DEFAULT 0.00,
                expected_cash NUMERIC(10, 2) DEFAULT 2000.00,
                actual_cash_counted NUMERIC(10, 2),
                discrepancy NUMERIC(10, 2) DEFAULT 0.00,
                status VARCHAR(30) DEFAULT 'open', -- open, closed
                opening_time TIMESTAMPTZ DEFAULT NOW(),
                closing_time TIMESTAMPTZ,
                closing_notes TEXT
            );
            """)

            conn.commit()
            print("[MIGRATION UP] All 15 new tables/extensions created successfully.")

            # SEED REALISTIC SYNTHETIC TIER-2 HOSPITAL DATA
            seed_synthetic_data(cur, conn)

def seed_synthetic_data(cur, conn):
    print("[MIGRATION SEED] Seeding realistic synthetic data for 10-50 bed hospital...")

    # 1. Lab Catalogue
    cur.execute("SELECT count(*) FROM lab_test_catalogue;")
    if cur.fetchone()[0] == 0:
        lab_tests = [
            ("CBC", "Complete Blood Count (CBC) with ESR", "Hematology", 350.00, 2, "Whole Blood EDTA", "Hb: 13-17 g/dL, WBC: 4000-11000 /cumm, Platelets: 1.5-4.5 Lakhs", "/cumm"),
            ("LIPID", "Lipid Profile (Cholesterol, TG, HDL, LDL)", "Biochemistry", 650.00, 4, "Serum Fasting", "Total Chol: < 200 mg/dL, TG: < 150 mg/dL, HDL: > 40 mg/dL", "mg/dL"),
            ("LFT", "Liver Function Test (Bilirubin, SGOT, SGPT, Alk Phos)", "Biochemistry", 750.00, 4, "Serum", "Total Bilirubin: 0.2-1.2 mg/dL, SGOT: 5-40 U/L, SGPT: 7-56 U/L", "U/L"),
            ("KFT", "Kidney Function Test (Urea, Creatinine, Electrolytes)", "Biochemistry", 600.00, 3, "Serum", "Serum Creatinine: 0.6-1.2 mg/dL, Blood Urea: 15-45 mg/dL", "mg/dL"),
            ("HBA1C", "HbA1c Glycated Hemoglobin", "Biochemistry", 500.00, 2, "Whole Blood EDTA", "< 5.7% Normal, 5.7-6.4% Prediabetes, >= 6.5% Diabetes", "%"),
            ("THYROID", "Thyroid Profile (Total T3, T4, TSH Ultra)", "Biochemistry", 550.00, 6, "Serum", "TSH: 0.4 - 4.2 uIU/mL", "uIU/mL"),
            ("DENGUE", "Dengue NS1 Antigen & IgM/IgG Duo", "Serology", 800.00, 1, "Serum", "Negative", "Index"),
            ("CXR", "Chest X-Ray PA View Digital", "Radiology", 400.00, 1, "Digital Radiography", "Both lung fields clear. Normal cardiac shadow.", "Film/DICOM"),
            ("USG-ABD", "Ultrasound Whole Abdomen & Pelvis", "Radiology", 1200.00, 2, "USG", "Liver, GB, Spleen, Pancreas, Both Kidneys normal morphology.", "Report"),
            ("URINE-RE", "Urine Routine & Microscopic Examination", "Pathology", 180.00, 1, "Fresh Urine Mid-stream", "Pus cells: 1-2 /HPF, RBCs: Nil, Albumin: Nil, Sugar: Nil", "/HPF"),
        ]
        for t in lab_tests:
            cur.execute("""
            INSERT INTO lab_test_catalogue (test_code, test_name, category, standard_rate, turnaround_hours, sample_type, normal_range, unit)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, t)
        print("  ✓ Seeded 10 standard Tier-2 hospital lab tests.")

    # 2. Pharmacy Batches (linking to existing pharmacy_medicines)
    cur.execute("SELECT count(*) FROM pharmacy_batches;")
    if cur.fetchone()[0] == 0:
        cur.execute("SELECT id, name, price FROM pharmacy_medicines LIMIT 10;")
        meds = cur.fetchall()
        for idx, (m_id, m_name, m_price) in enumerate(meds):
            batch_num = f"B24{idx+1:02d}K"
            exp_date = (date.today() + timedelta(days=90 + (idx * 45))).isoformat()
            purchase = round(float(m_price) * 0.65, 2)
            cur.execute("""
            INSERT INTO pharmacy_batches (medicine_id, batch_number, expiry_date, mrp, purchase_cost, quantity_received, quantity_remaining, supplier_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (medicine_id, batch_number) DO NOTHING;
            """, (m_id, batch_num, exp_date, m_price, purchase, 200, 140, "Rajasthan Medi-Distributors Ltd"))
        print("  ✓ Seeded realistic pharmacy batches with expiry dates and supplier records.")

    # 3. IPD Beds & Sample Inpatient Admission
    cur.execute("SELECT count(*) FROM ipd_admissions;")
    if cur.fetchone()[0] == 0:
        # Check an available bed
        cur.execute("SELECT id, bed_number, ward_type FROM hospital_beds ORDER BY id LIMIT 1;")
        bed_row = cur.fetchone()
        bed_id = bed_row[0] if bed_row else None
        bed_num = bed_row[1] if bed_row else "ICU-01"
        ward = bed_row[2] if bed_row else "Intensive Care Unit"

        # Check a doctor
        cur.execute("SELECT id, name FROM doctors ORDER BY id LIMIT 1;")
        doc_row = cur.fetchone()
        doc_id = doc_row[0] if doc_row else 1
        doc_name = doc_row[1] if doc_row else "Dr. Rajesh Sharma"

        # Insert admitted patient: Ramesh Chandra Agarwal, 54M, Jaipur
        cur.execute("""
        INSERT INTO ipd_admissions (
            uhid, patient_name, age, gender, contact_phone, doctor_id, doctor_name,
            bed_id, bed_number, ward_type, admission_type, diagnosis, attending_notes, status, admission_date
        ) VALUES (
            'UHID-2026-0814', 'Ramesh Chandra Agarwal', 54, 'Male', '+91 98290 12345', %s, %s,
            %s, %s, %s, 'emergency', 'Acute Exacerbation of COPD with Type 2 Respiratory Failure',
            'Patient presented with severe dyspnea, wheezing, SpO2 86 percent on room air. Started on IV Bronchodilators, BiPAP support, and hydrocortisone.',
            'admitted', NOW() - INTERVAL '3 days'
        ) RETURNING id;
        """, (doc_id, doc_name, bed_id, bed_num, ward))
        admit_id = cur.fetchone()[0]

        # Update bed occupied
        if bed_id:
            cur.execute("UPDATE hospital_beds SET is_occupied = TRUE, patient_name = 'Ramesh Chandra Agarwal', doctor_id = %s WHERE id = %s;", (doc_id, bed_id))

        # Add IPD Deposit
        cur.execute("""
        INSERT INTO ipd_deposits (admission_id, amount, payment_method, receipt_number, cashier_name, notes)
        VALUES (%s, 15000.00, 'upi', 'DEP-2026-00109', 'Reception Desk - Counter 1', 'Initial admission deposit received via PhonePe UPI');
        """, (admit_id,))

        # Add IPD Billing Items (Healthcare services = 0% GST, Pharmacy = 12% GST)
        cur.execute("""
        INSERT INTO ipd_billing_items (admission_id, category, item_name, quantity, unit_price, gst_rate, total_amount, added_by)
        VALUES
        (%s, 'bed_charge', 'ICU Bed Charges (Day 1 - Day 3)', 3.0, 3500.00, 0.0, 10500.00, 'Admission System'),
        (%s, 'nursing', 'ICU High-Dependency Nursing Care', 3.0, 1000.00, 0.0, 3000.00, 'Nursing Staff'),
        (%s, 'consultation', 'Daily Intensivist & Pulmonologist Visits', 3.0, 1200.00, 0.0, 3600.00, 'Dr. Rajesh Sharma'),
        (%s, 'procedure', 'Nebulization & BiPAP Support (72 hrs)', 1.0, 4500.00, 0.0, 4500.00, 'Pulmonology Dept'),
        (%s, 'lab', 'ABG (Arterial Blood Gas) Panel x 3', 3.0, 800.00, 0.0, 2400.00, 'Hospital Pathology'),
        (%s, 'pharmacy', 'IV Deriphyllin, Budecort, IV Ceftriaxone', 1.0, 3200.00, 12.0, 3584.00, 'Central Pharmacy');
        """, (admit_id, admit_id, admit_id, admit_id, admit_id, admit_id))
        print("  ✓ Seeded active IPD patient admission with deposits and itemized billing ledger.")

    # 4. DPDP Synthetic Consent & Audit Trail
    cur.execute("SELECT count(*) FROM dpdp_consent_logs;")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO dpdp_consent_logs (uhid, patient_name, consent_type, purpose, status, granted_at, captured_by, consent_artifact_hash)
        VALUES
        ('UHID-2026-0814', 'Ramesh Chandra Agarwal', 'treatment_data', 'Collection of vitals, clinical history and lab results for inpatient COPD care', 'granted', NOW() - INTERVAL '3 days', 'Admissions Desk', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
        ('UHID-2026-0814', 'Ramesh Chandra Agarwal', 'abha_linkage', 'Linking IPD discharge summary to Ayushman Bharat Digital Mission (ABDM)', 'granted', NOW() - INTERVAL '3 days', 'Admissions Desk', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
        """)

        cur.execute("""
        INSERT INTO dpdp_audit_trail (actor_id, actor_name, actor_role, action, resource_type, resource_id, reason, details)
        VALUES
        ('doc-1', 'Dr. Rajesh Sharma', 'doctor', 'view', 'patient', 'UHID-2026-0814', 'Inpatient morning clinical ward round', '{"module": "ipd_rounds"}'::jsonb),
        ('rec-1', 'Sunita Receptionist', 'admin', 'create', 'billing', 'DEP-2026-00109', 'Collected admission advance deposit', '{"amount": 15000}'::jsonb);
        """)
        print("  ✓ Seeded DPDP Act statutory consent and immutable audit trail records.")

    # 5. ABDM Sandbox Data (Rule 6)
    cur.execute("SELECT count(*) FROM abdm_abha_profiles;")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO abdm_abha_profiles (uhid, abha_number, abha_address, name, gender, dob, mobile, status, kyc_verified)
        VALUES
        ('UHID-2026-0814', '91-8472-1094-8231', 'ramesh.agarwal@abdm', 'Ramesh Chandra Agarwal', 'Male', '1972-04-15', '+91 98290 12345', 'linked', TRUE);
        """)

        cur.execute("""
        INSERT INTO abdm_care_contexts (uhid, abha_address, care_context_ref, care_context_type, description)
        VALUES
        ('UHID-2026-0814', 'ramesh.agarwal@abdm', 'IPD-ADMIT-2026-0814', 'DISCHARGE_SUMMARY', 'Inpatient Episode - COPD Management under Dr. Rajesh Sharma');
        """)
        print("  ✓ Seeded ABDM Sandbox M1 (ABHA Profile) and M2 (Care Context linking).")

    # 6. Cash Drawer Session (Open for today)
    cur.execute("SELECT count(*) FROM cash_drawer_sessions WHERE session_date = CURRENT_DATE;")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO cash_drawer_sessions (session_date, cashier_id, cashier_name, opening_cash, cash_collected, upi_collected, card_collected, expected_cash, status)
        VALUES (CURRENT_DATE, 'desk-cashier-1', 'Main Reception Counter', 2000.00, 1850.00, 15000.00, 0.00, 3850.00, 'open');
        """)
        print("  ✓ Seeded today's Cash Drawer session for daily billing reconciliation.")

    conn.commit()
    print("[MIGRATION COMPLETE] All schema and synthetic seeds committed to PostgreSQL.")

def down():
    print("[MIGRATION DOWN] Reversing Tier-2 Hospital schema...")
    with get_connection() as conn:
        with conn.cursor() as cur:
            tables_to_drop = [
                "cash_drawer_sessions",
                "abdm_consent_requests",
                "abdm_care_contexts",
                "abdm_abha_profiles",
                "dpdp_breach_logs",
                "dpdp_data_requests",
                "dpdp_audit_trail",
                "dpdp_consent_logs",
                "lab_orders",
                "lab_test_catalogue",
                "pharmacy_dispensation_items",
                "pharmacy_dispensations",
                "pharmacy_batches",
                "ipd_discharge_summaries",
                "ipd_billing_items",
                "ipd_deposits",
                "ipd_admissions"
            ]
            for tbl in tables_to_drop:
                cur.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE;")
                print(f"  ✓ Dropped {tbl}")
            conn.commit()
            print("[MIGRATION DOWN COMPLETE] Clean rollback executed.")

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "up"
    if action == "down":
        down()
    else:
        up()
