import os
from datetime import date, time, datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

from database.connection import get_connection

def migrate_and_seed_extended():
    print("Connecting to database for extended enterprise schema migration...")
    with get_connection() as conn:
        with conn.cursor() as cur:
            # 1. Create patient_vitals table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS patient_vitals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                bp_systolic INTEGER,
                bp_diastolic INTEGER,
                heart_rate INTEGER,
                blood_sugar NUMERIC(6, 1),
                temperature NUMERIC(4, 1),
                spo2 INTEGER,
                weight_kg NUMERIC(5, 1),
                notes TEXT,
                recorded_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # 2. Create lab_reports table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS lab_reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
                appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
                test_name VARCHAR(150) NOT NULL,
                category VARCHAR(80) NOT NULL,
                result_summary VARCHAR(255),
                status VARCHAR(50) DEFAULT 'completed',
                is_abnormal BOOLEAN DEFAULT FALSE,
                report_data JSONB,
                clinical_notes TEXT,
                conducted_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # 3. Create hospital_beds table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS hospital_beds (
                id SERIAL PRIMARY KEY,
                bed_number VARCHAR(30) UNIQUE NOT NULL,
                ward_type VARCHAR(60) NOT NULL,
                floor VARCHAR(30) NOT NULL,
                has_oxygen BOOLEAN DEFAULT TRUE,
                is_occupied BOOLEAN DEFAULT FALSE,
                patient_name VARCHAR(100),
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
                admitted_at TIMESTAMPTZ
            );
            """)

            # 4. Create pharmacy_medicines table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS pharmacy_medicines (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                generic_name VARCHAR(150),
                category VARCHAR(80),
                dosage_form VARCHAR(50),
                strength VARCHAR(50),
                price NUMERIC(8, 2) NOT NULL,
                stock_quantity INTEGER DEFAULT 50,
                batch_number VARCHAR(50),
                expiry_date DATE,
                prescription_required BOOLEAN DEFAULT TRUE
            );
            """)

            # 5. Create doctor_reviews table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS doctor_reviews (
                id SERIAL PRIMARY KEY,
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                patient_name VARCHAR(80),
                comment TEXT,
                wait_time_rating INTEGER,
                bedside_manner_rating INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # 6. Create patient_vaccinations table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS patient_vaccinations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                vaccine_name VARCHAR(120) NOT NULL,
                dose_number VARCHAR(30) NOT NULL,
                target_disease VARCHAR(150),
                status VARCHAR(40) DEFAULT 'completed',
                administered_date DATE,
                next_due_date DATE,
                batch_number VARCHAR(50),
                administered_by VARCHAR(100),
                certificate_code VARCHAR(80)
            );
            """)

            # 7. Create opd_tokens table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS opd_tokens (
                id SERIAL PRIMARY KEY,
                appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
                patient_name VARCHAR(100) DEFAULT 'Walk-in Patient',
                token_number INTEGER NOT NULL,
                token_date DATE NOT NULL,
                status VARCHAR(40) DEFAULT 'waiting',
                estimated_call_time TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            conn.commit()
            print("Extended enterprise tables created successfully.")

            # SEED DEMO DATA
            # Get demo patient id
            cur.execute("SELECT id FROM users WHERE username = 'patient' LIMIT 1")
            patient_row = cur.fetchone()
            patient_id = patient_row[0] if patient_row else 1

            # Seed Vitals
            cur.execute("SELECT count(*) FROM patient_vitals WHERE user_id = %s", (patient_id,))
            if cur.fetchone()[0] == 0:
                vitals = [
                    (patient_id, 122, 80, 72, 98.0, 98.4, 99, 68.5, "Routine morning check. BP optimal.", datetime.now(timezone.utc) - timedelta(days=20)),
                    (patient_id, 128, 84, 76, 105.0, 98.6, 98, 68.2, "Mild post-lunch fatigue. Normal SpO2.", datetime.now(timezone.utc) - timedelta(days=10)),
                    (patient_id, 120, 78, 70, 94.0, 98.5, 99, 67.8, "Follow-up post prescription. Great BP control.", datetime.now(timezone.utc) - timedelta(days=2)),
                ]
                for v in vitals:
                    cur.execute("""
                    INSERT INTO patient_vitals (user_id, bp_systolic, bp_diastolic, heart_rate, blood_sugar, temperature, spo2, weight_kg, notes, recorded_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, v)
                print("Seeded patient vitals.")

            # Seed Lab Reports
            cur.execute("SELECT count(*) FROM lab_reports WHERE user_id = %s", (patient_id,))
            if cur.fetchone()[0] == 0:
                import json
                cbc_data = json.dumps([
                    {"parameter": "Hemoglobin (Hb)", "measured_value": "14.2", "unit": "g/dL", "reference_range": "13.0 - 17.0", "is_flagged": False},
                    {"parameter": "Total Leukocyte Count (WBC)", "measured_value": "7,400", "unit": "/cumm", "reference_range": "4,000 - 11,000", "is_flagged": False},
                    {"parameter": "Platelet Count", "measured_value": "240,000", "unit": "/cumm", "reference_range": "150,000 - 450,000", "is_flagged": False},
                    {"parameter": "RBC Count", "measured_value": "4.8", "unit": "mil/uL", "reference_range": "4.5 - 5.9", "is_flagged": False},
                    {"parameter": "Neutrophils", "measured_value": "62", "unit": "%", "reference_range": "40 - 75", "is_flagged": False},
                    {"parameter": "Lymphocytes", "measured_value": "30", "unit": "%", "reference_range": "20 - 45", "is_flagged": False}
                ])
                lipid_data = json.dumps([
                    {"parameter": "Total Cholesterol", "measured_value": "218", "unit": "mg/dL", "reference_range": "< 200", "is_flagged": True},
                    {"parameter": "Triglycerides", "measured_value": "165", "unit": "mg/dL", "reference_range": "< 150", "is_flagged": True},
                    {"parameter": "HDL (Good Cholesterol)", "measured_value": "48", "unit": "mg/dL", "reference_range": "> 40", "is_flagged": False},
                    {"parameter": "LDL (Bad Cholesterol)", "measured_value": "137", "unit": "mg/dL", "reference_range": "< 100", "is_flagged": True},
                    {"parameter": "VLDL Cholesterol", "measured_value": "33", "unit": "mg/dL", "reference_range": "< 30", "is_flagged": True}
                ])
                hba1c_data = json.dumps([
                    {"parameter": "Glycated Hemoglobin (HbA1c)", "measured_value": "5.6", "unit": "%", "reference_range": "< 5.7 (Normal)", "is_flagged": False},
                    {"parameter": "Estimated Avg Glucose (eAG)", "measured_value": "114", "unit": "mg/dL", "reference_range": "90 - 120", "is_flagged": False}
                ])

                reports = [
                    (patient_id, 1, "Comprehensive Lipid Profile", "Biochemistry", "Borderline Hyperlipidemia. Statin therapy advised.", True, lipid_data, "Fasting 12 hours confirmed. Advised low saturated fat diet and exercise.", datetime.now(timezone.utc) - timedelta(days=6)),
                    (patient_id, 3, "Complete Blood Count (CBC) with ESR", "Hematology", "Normal hemogram. No evidence of infection or anemia.", False, cbc_data, "All cell counts within reference clinical parameters.", datetime.now(timezone.utc) - timedelta(days=5)),
                    (patient_id, 3, "HbA1c Glycated Hemoglobin Test", "Diabetology", "Normal non-diabetic range (5.6%).", False, hba1c_data, "Excellent glycemic control.", datetime.now(timezone.utc) - timedelta(days=3))
                ]
                for r in reports:
                    cur.execute("""
                    INSERT INTO lab_reports (user_id, doctor_id, test_name, category, result_summary, is_abnormal, report_data, clinical_notes, conducted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, r)
                print("Seeded diagnostic lab reports.")

            # Seed Hospital Beds
            cur.execute("SELECT count(*) FROM hospital_beds")
            if cur.fetchone()[0] == 0:
                beds = [
                    ("ICU-101", "ICU", "1st Floor - Wing A", True, True, "Ramesh K.", 1, datetime.now(timezone.utc) - timedelta(days=1)),
                    ("ICU-102", "ICU", "1st Floor - Wing A", True, False, None, None, None),
                    ("ICU-103", "ICU", "1st Floor - Wing A", True, True, "Sushila M.", 4, datetime.now(timezone.utc) - timedelta(days=2)),
                    ("ICU-104", "ICU", "1st Floor - Wing A", True, False, None, None, None),
                    ("SP-201", "Semi-Private", "2nd Floor - Wing B", True, True, "Deepak P.", 3, datetime.now(timezone.utc) - timedelta(days=3)),
                    ("SP-202", "Semi-Private", "2nd Floor - Wing B", True, False, None, None, None),
                    ("SP-203", "Semi-Private", "2nd Floor - Wing B", False, False, None, None, None),
                    ("SP-204", "Semi-Private", "2nd Floor - Wing B", True, True, "Kavita S.", 6, datetime.now(timezone.utc) - timedelta(days=1)),
                    ("GW-301", "General Ward", "3rd Floor - Wing C", True, True, "Manoj V.", 3, datetime.now(timezone.utc) - timedelta(days=4)),
                    ("GW-302", "General Ward", "3rd Floor - Wing C", True, True, "Sunita T.", 6, datetime.now(timezone.utc) - timedelta(days=2)),
                    ("GW-303", "General Ward", "3rd Floor - Wing C", False, False, None, None, None),
                    ("GW-304", "General Ward", "3rd Floor - Wing C", False, False, None, None, None),
                    ("GW-305", "General Ward", "3rd Floor - Wing C", True, False, None, None, None),
                    ("DC-401", "Daycare", "Ground Floor - East", True, True, "Aarav N.", 5, datetime.now(timezone.utc) - timedelta(hours=4)),
                    ("DC-402", "Daycare", "Ground Floor - East", True, False, None, None, None)
                ]
                for b in beds:
                    cur.execute("""
                    INSERT INTO hospital_beds (bed_number, ward_type, floor, has_oxygen, is_occupied, patient_name, doctor_id, admitted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, b)
                print("Seeded hospital beds.")

            # Seed Pharmacy Medicines
            cur.execute("SELECT count(*) FROM pharmacy_medicines")
            if cur.fetchone()[0] == 0:
                medicines = [
                    ("Telmisartan 40mg", "Telmisartan", "Cardiology / Antihypertensive", "Tablet", "40mg", 145.00, 120, "BAT-TL-902", date(2027, 8, 31), True),
                    ("Rosuvastatin 10mg", "Rosuvastatin Calcium", "Cardiology / Statin", "Tablet", "10mg", 195.00, 85, "BAT-RS-411", date(2027, 11, 30), True),
                    ("Clindamycin Gel 1%", "Clindamycin Phosphate", "Dermatology / Topical Antibiotic", "Gel", "20g tube", 160.00, 45, "BAT-CL-104", date(2027, 4, 30), True),
                    ("Doxycycline 100mg", "Doxycycline Hyclate", "Antibiotic", "Capsule", "100mg", 92.00, 150, "BAT-DX-772", date(2027, 9, 30), True),
                    ("Paracetamol 650mg (Dolo)", "Paracetamol", "Analgesic / Antipyretic", "Tablet", "650mg", 32.00, 400, "BAT-PCM-80", date(2028, 1, 31), False),
                    ("Metformin 500mg SR", "Metformin Hydrochloride", "Diabetology / Oral Hypoglycemic", "Tablet", "500mg", 48.00, 210, "BAT-MF-620", date(2027, 10, 31), True),
                    ("Amoxicillin + Clavulanate 625mg", "Co-Amoxiclav", "Broad Spectrum Antibiotic", "Tablet", "625mg", 215.00, 70, "BAT-AMC-33", date(2027, 6, 30), True),
                    ("Pantoprazole 40mg", "Pantoprazole Sodium", "Gastroenterology / PPI", "Tablet", "40mg", 95.00, 180, "BAT-PT-501", date(2027, 12, 31), False),
                    ("Cetirizine 10mg", "Cetirizine Dihydrochloride", "Antihistamine / Allergy", "Tablet", "10mg", 25.00, 300, "BAT-CT-209", date(2028, 2, 28), False),
                    ("CoQ10 100mg Cardio Shield", "Coenzyme Q10", "Nutraceutical", "Capsule", "100mg", 450.00, 35, "BAT-CQ-118", date(2027, 7, 31), False),
                    ("ORS Electrolyte Solution (WHO Formula)", "Oral Rehydration Salts", "Rehydration", "Sachet", "21.8g", 22.00, 250, "BAT-ORS-99", date(2028, 5, 31), False),
                    ("Calcium + Vitamin D3 500mg", "Calcium Carbonate + D3", "Orthopedics / Bone Health", "Tablet", "500mg/250IU", 110.00, 140, "BAT-CAD-82", date(2027, 10, 31), False)
                ]
                for m in medicines:
                    cur.execute("""
                    INSERT INTO pharmacy_medicines (name, generic_name, category, dosage_form, strength, price, stock_quantity, batch_number, expiry_date, prescription_required)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, m)
                print("Seeded pharmacy medicines.")

            # Seed Doctor Reviews
            cur.execute("SELECT count(*) FROM doctor_reviews")
            if cur.fetchone()[0] == 0:
                reviews = [
                    (1, patient_id, 5, "Sunita Kapoor", "Dr. Rajesh Sharma is phenomenal. He diagnosed my hypertension and explained every aspect of the lifestyle changes with genuine patience.", 5, 5),
                    (1, patient_id, 5, "Vipin Mathur", "Top-notch cardiologist. Clean clinic, very professional cardiac checkup. Prescription and digital slip were ready instantly.", 4, 5),
                    (2, patient_id, 5, "Neha Agarwal", "Dr. Priya completely cleared my stubborn adult acne within 3 weeks. No unnecessary expensive creams, straightforward science-backed advice.", 5, 5),
                    (3, patient_id, 5, "Arun Chawla", "Dr. Amit is our trusted family physician for years. Very thorough with blood test evaluations and gentle demeanor.", 5, 5),
                    (4, patient_id, 4, "Ritika Sen", "Dr. Anita Roy provided great relief for my chronic migraines. Very methodical neurological assessment.", 4, 4),
                    (5, patient_id, 5, "Pooja Malhotra", "Dr. Vikram is wonderful with children. My toddler felt so comfortable and cried zero times during vaccination!", 5, 5),
                    (6, patient_id, 5, "Harish Nair", "Dr. Meera helped my mother with severe knee osteoarthritis. Great exercise plan and pain relief.", 4, 5)
                ]
                for rev in reviews:
                    cur.execute("""
                    INSERT INTO doctor_reviews (doctor_id, user_id, rating, patient_name, comment, wait_time_rating, bedside_manner_rating)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, rev)
                print("Seeded doctor reviews.")

            # Seed Vaccinations
            cur.execute("SELECT count(*) FROM patient_vaccinations WHERE user_id = %s", (patient_id,))
            if cur.fetchone()[0] == 0:
                vaccinations = [
                    (patient_id, "COVID-19 mRNA Booster", "Booster Dose", "Coronavirus Disease", "completed", date(2024, 4, 15), None, "COV-IN-88392", "Dr. Amit Gupta", "SANJ-VAX-2024-001"),
                    (patient_id, "Influenza Quadrivalent Annual", "Annual Shot", "Seasonal Influenza", "completed", date(2025, 9, 20), date(2026, 9, 20), "FLU-QD-4011", "Dr. Vikram Sethi", "SANJ-VAX-2025-089"),
                    (patient_id, "Tetanus, Diphtheria, Pertussis (Tdap)", "Decennial Booster", "Tetanus & Whooping Cough", "completed", date(2022, 6, 10), date(2032, 6, 10), "TDP-BO-902", "Dr. Amit Gupta", "SANJ-VAX-2022-441"),
                    (patient_id, "Hepatitis B Recombinant", "Booster / Titer Check", "Hepatitis B Virus", "scheduled", None, date.today() + timedelta(days=25), "HEP-B-290", "Dr. Rajesh Sharma", "SANJ-VAX-PENDING")
                ]
                for vax in vaccinations:
                    cur.execute("""
                    INSERT INTO patient_vaccinations (user_id, vaccine_name, dose_number, target_disease, status, administered_date, next_due_date, batch_number, administered_by, certificate_code)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, vax)
                print("Seeded patient vaccinations.")

            # Recreate opd_tokens if needed to support walk-ins
            cur.execute("""
            DROP TABLE IF EXISTS opd_tokens;
            CREATE TABLE opd_tokens (
                id SERIAL PRIMARY KEY,
                appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
                patient_name VARCHAR(100) DEFAULT 'Walk-in Patient',
                token_number INTEGER NOT NULL,
                token_date DATE NOT NULL,
                status VARCHAR(40) DEFAULT 'waiting',
                estimated_call_time TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)

            # Seed OPD Tokens for today
            today = date.today()
            opd_tokens = [
                (None, 1, "Rohan Verma", 101, today, "completed", datetime.now(timezone.utc) - timedelta(minutes=45)),
                (None, 1, "Meena Joshi", 102, today, "completed", datetime.now(timezone.utc) - timedelta(minutes=20)),
                (None, 1, "Amitabh Roy", 103, today, "in_consultation", datetime.now(timezone.utc)),
                (None, 1, "Pooja Sharma", 104, today, "waiting", datetime.now(timezone.utc) + timedelta(minutes=25)),
                (None, 2, "Ananya Patel", 201, today, "in_consultation", datetime.now(timezone.utc)),
                (None, 2, "Karan Singh", 202, today, "waiting", datetime.now(timezone.utc) + timedelta(minutes=30)),
                (None, 3, "Siddharth Sen", 301, today, "waiting", datetime.now(timezone.utc) + timedelta(minutes=15)),
            ]
            for tok in opd_tokens:
                cur.execute("""
                INSERT INTO opd_tokens (appointment_id, doctor_id, patient_name, token_number, token_date, status, estimated_call_time)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, tok)
            print("Seeded OPD live queue tokens.")

            conn.commit()
            print("Successfully migrated and seeded all extended enterprise hospital features!")

if __name__ == "__main__":
    migrate_and_seed_extended()
