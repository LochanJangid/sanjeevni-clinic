import os
import bcrypt
from datetime import date, time, datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

from backend.database.connection import get_connection

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed():
    print("Connecting to database...")
    with get_connection() as conn:
        with conn.cursor() as cur:
            # 1. Categories
            categories = [
                (1, "Cardiology"),
                (2, "Dermatology"),
                (3, "General Medicine"),
                (4, "Neurology"),
                (5, "Pediatrics"),
                (6, "Orthopedics")
            ]
            for cat_id, cat_name in categories:
                cur.execute(
                    """
                    INSERT INTO categories (id, category_name) OVERRIDING SYSTEM VALUE
                    VALUES (%s, %s)
                    ON CONFLICT (id) DO UPDATE SET category_name = EXCLUDED.category_name
                    """,
                    (cat_id, cat_name)
                )
            print("Categories seeded.")

            # 2. Doctors
            doctors = [
                (1, "Dr. Rajesh Sharma", 1, 800),
                (2, "Dr. Priya Verma", 2, 650),
                (3, "Dr. Amit Gupta", 3, 500),
                (4, "Dr. Anita Roy", 4, 900),
                (5, "Dr. Vikram Sethi", 5, 550),
                (6, "Dr. Meera Iyer", 6, 750)
            ]
            for doc_id, name, cat_id, fees in doctors:
                cur.execute(
                    """
                    INSERT INTO doctors (id, name, category_id, fees) OVERRIDING SYSTEM VALUE
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, fees = EXCLUDED.fees
                    """,
                    (doc_id, name, cat_id, fees)
                )
            # Update sequences if needed
            try:
                cur.execute("SELECT setval(pg_get_serial_sequence('doctors', 'id'), (SELECT MAX(id) FROM doctors))")
                cur.execute("SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories))")
            except Exception:
                pass
            print("Doctors seeded.")

            # 3. Doctor Profiles
            profiles = [
                (1, "MBBS, MD (Cardiology), DM (Interventional Cardiology), FACC", 15,
                 "Senior Consultant Interventional Cardiologist specializing in preventive cardiology, coronary artery disease, heart failure management, and advanced echocardiography. 15+ years of dedicated cardiac care.",
                 "Suite 401, Heart & Vascular Center, Sanjeevni Clinic, Metro Wing"),
                (2, "MBBS, MD (Dermatology, Venereology & Leprosy), FAAD", 10,
                 "Board-certified Clinical & Aesthetic Dermatologist with expertise in chronic acne, eczema, psoriasis management, allergy testing, and cosmetic dermatology.",
                 "Suite 205, Skin & Aesthetic Pavilion, Sanjeevni Clinic"),
                (3, "MBBS, MD (Internal Medicine), PGD (Diabetology)", 12,
                 "Senior Primary Care Physician specializing in comprehensive lifestyle medicine, type 2 diabetes management, hypertension, infectious diseases, and preventive health screenings.",
                 "Suite 102, Primary Care Pavilion, Sanjeevni Clinic"),
                (4, "MBBS, MD, DM (Neurology), FINS", 11,
                 "Consultant Neurologist focusing on neurovascular care, headache disorders, migraine prevention, epilepsy management, neuropathy, and stroke rehabilitation.",
                 "Suite 310, Neurosciences Center, Sanjeevni Clinic"),
                (5, "MBBS, MD (Pediatrics), DNB (Pediatrics), FIAP", 8,
                 "Dedicated Pediatrician and Child Health Specialist committed to compassionate developmental care, pediatric immunizations, childhood infections, and adolescent medicine.",
                 "Suite 108, Pediatric Wellness Center, Sanjeevni Clinic"),
                (6, "MBBS, MS (Orthopedics), MCh (Joint Replacement)", 14,
                 "Orthopedic Surgeon specializing in joint preservation, arthritis care, sports injuries, knee and hip replacements, and spine wellness.",
                 "Suite 215, Bone & Joint Clinic, Sanjeevni Clinic")
            ]
            for doc_id, qual, exp, about, address in profiles:
                cur.execute(
                    """
                    SELECT id FROM doctor_profiles WHERE doctor_id = %s
                    """,
                    (doc_id,)
                )
                row = cur.fetchone()
                if row:
                    cur.execute(
                        """
                        UPDATE doctor_profiles
                        SET qualification = %s, experience_years = %s, about = %s, clinic_address = %s
                        WHERE doctor_id = %s
                        """,
                        (qual, exp, about, address, doc_id)
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO doctor_profiles (doctor_id, qualification, experience_years, about, clinic_address, created_at)
                        VALUES (%s, %s, %s, %s, %s, NOW())
                        """,
                        (doc_id, qual, exp, about, address)
                    )
            print("Doctor profiles seeded.")

            # 4. Doctor Availability (Monday to Saturday)
            # Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
            availability_rules = [
                # Dr. Sharma: Mon-Fri 09:00 - 13:00, Sat 09:00 - 12:00
                (1, [(1, time(9, 0), time(13, 0)), (2, time(9, 0), time(13, 0)), (3, time(9, 0), time(13, 0)),
                     (4, time(9, 0), time(13, 0)), (5, time(9, 0), time(13, 0)), (6, time(9, 0), time(12, 0))]),
                # Dr. Verma: Mon-Fri 14:00 - 18:00, Sat 10:00 - 14:00
                (2, [(1, time(14, 0), time(18, 0)), (2, time(14, 0), time(18, 0)), (3, time(14, 0), time(18, 0)),
                     (4, time(14, 0), time(18, 0)), (5, time(14, 0), time(18, 0)), (6, time(10, 0), time(14, 0))]),
                # Dr. Gupta: Mon-Sat 09:30 - 16:30
                (3, [(1, time(9, 30), time(16, 30)), (2, time(9, 30), time(16, 30)), (3, time(9, 30), time(16, 30)),
                     (4, time(9, 30), time(16, 30)), (5, time(9, 30), time(16, 30)), (6, time(9, 30), time(13, 30))]),
                # Dr. Roy: Mon, Wed, Fri 11:00 - 17:00
                (4, [(1, time(11, 0), time(17, 0)), (3, time(11, 0), time(17, 0)), (5, time(11, 0), time(17, 0))]),
                # Dr. Sethi: Tue, Thu, Sat 09:00 - 14:00
                (5, [(2, time(9, 0), time(14, 0)), (4, time(9, 0), time(14, 0)), (6, time(9, 0), time(14, 0))]),
                # Dr. Meera: Mon, Tue, Thu, Fri 10:00 - 16:00
                (6, [(1, time(10, 0), time(16, 0)), (2, time(10, 0), time(16, 0)), (4, time(10, 0), time(16, 0)), (5, time(10, 0), time(16, 0))]),
            ]
            for doc_id, schedules in availability_rules:
                cur.execute("DELETE FROM doctor_availability WHERE doctor_id = %s", (doc_id,))
                for day_w, st, et in schedules:
                    cur.execute(
                        """
                        INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (doc_id, day_w, st, et)
                    )
            print("Doctor availability updated.")

            # 5. Seed Users (Admin, Doctor, Patient)
            # Default passwords:
            # admin / Admin@1234
            # dr.sharma / Doctor@1234
            # patient / Patient@1234
            users_to_seed = [
                ("admin", "admin@sanjeevni.com", "9876543210", hash_pw("Admin@1234"), "admin", None),
                ("dr.sharma", "sharma@sanjeevni.com", "9876543211", hash_pw("Doctor@1234"), "doctor", 1),
                ("dr.verma", "verma@sanjeevni.com", "9876543212", hash_pw("Doctor@1234"), "doctor", 2),
                ("patient", "patient@sanjeevni.com", "9876543213", hash_pw("Patient@1234"), "patient", None),
            ]
            for uname, uemail, umobile, phash, urole, udoc_id in users_to_seed:
                cur.execute("SELECT id FROM users WHERE username = %s", (uname,))
                row = cur.fetchone()
                if row:
                    cur.execute(
                        """
                        UPDATE users
                        SET email = %s, mobile = %s, password_hash = %s, role = %s, doctor_id = %s, update_at = NOW()
                        WHERE username = %s
                        """,
                        (uemail, umobile, phash, urole, udoc_id, uname)
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO users (username, email, mobile, password_hash, role, doctor_id, created_at, update_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """,
                        (uname, uemail, umobile, phash, urole, udoc_id)
                    )
            print("SaaS users seeded.")

            # 6. Sample completed appointments, prescriptions and payments for the demo patient
            cur.execute("SELECT id FROM users WHERE username = 'patient'")
            patient_id = cur.fetchone()[0]

            # Completed appointment 1 (Dr. Rajesh Sharma)
            past_date_1 = date.today() - timedelta(days=5)
            cur.execute(
                """
                INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, status, created_at)
                VALUES (%s, 1, %s, '10:00:00', 'completed', NOW() - INTERVAL '6 days')
                RETURNING id
                """,
                (patient_id, past_date_1)
            )
            appt_1_id = cur.fetchone()[0]

            # Prescription for appointment 1
            cur.execute(
                """
                INSERT INTO prescriptions (appointment_id, doctor_id, user_id, diagnosis, instructions, created_at)
                VALUES (%s, 1, %s, %s, %s, NOW() - INTERVAL '5 days')
                RETURNING id
                """,
                (
                    appt_1_id,
                    patient_id,
                    "Essential Hypertension Stage 1 & Mild Dyslipidemia",
                    "Follow low-sodium DASH diet. 30 mins brisk walking daily. Monitor BP twice weekly in the morning. Review in 4 weeks."
                )
            )
            rx_1_id = cur.fetchone()[0]

            # Prescription Medicines
            meds_1 = [
                (rx_1_id, "Telmisartan 40mg", "1 Tablet", "Once daily (Morning)", "30 Days", "Take with water after breakfast"),
                (rx_1_id, "Rosuvastatin 10mg", "1 Tablet", "Once daily (Night)", "30 Days", "Take after dinner"),
                (rx_1_id, "CoQ10 100mg", "1 Capsule", "Once daily", "30 Days", "Nutritional cardiac support")
            ]
            for rx_id, m_name, dosage, freq, dur, inst in meds_1:
                cur.execute(
                    """
                    INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (rx_id, m_name, dosage, freq, dur, inst)
                )

            # Payment for appointment 1
            cur.execute(
                """
                INSERT INTO payments (appointment_id, user_id, amount, payment_method, status, transaction_id, phone_number, created_at, paid_at)
                VALUES (%s, %s, 800, 'upi', 'paid', 'UPI-TXN-894210', '9876543213', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
                ON CONFLICT (appointment_id) DO NOTHING
                """,
                (appt_1_id, patient_id)
            )

            # Completed appointment 2 (Dr. Priya Verma)
            past_date_2 = date.today() - timedelta(days=14)
            cur.execute(
                """
                INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, status, created_at)
                VALUES (%s, 2, %s, '15:30:00', 'completed', NOW() - INTERVAL '15 days')
                RETURNING id
                """,
                (patient_id, past_date_2)
            )
            appt_2_id = cur.fetchone()[0]

            # Prescription for appointment 2
            cur.execute(
                """
                INSERT INTO prescriptions (appointment_id, doctor_id, user_id, diagnosis, instructions, created_at)
                VALUES (%s, 2, %s, %s, %s, NOW() - INTERVAL '14 days')
                RETURNING id
                """,
                (
                    appt_2_id,
                    patient_id,
                    "Acne Vulgaris (Grade II) with Contact Dermatitis",
                    "Avoid oil-based face creams. Apply gentle foaming cleanser twice daily. Use broad-spectrum SPF 50 sunscreen before sunlight."
                )
            )
            rx_2_id = cur.fetchone()[0]

            meds_2 = [
                (rx_2_id, "Clindamycin Phosphate Gel 1%", "Pea-sized amount", "Twice daily", "21 Days", "Apply thinly over affected facial areas"),
                (rx_2_id, "Doxycycline 100mg", "1 Capsule", "Once daily", "14 Days", "Take with plenty of water after lunch"),
                (rx_2_id, "Ceramide Moisturizer", "As needed", "Twice daily", "Ongoing", "Non-comedogenic barrier repair")
            ]
            for rx_id, m_name, dosage, freq, dur, inst in meds_2:
                cur.execute(
                    """
                    INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (rx_id, m_name, dosage, freq, dur, inst)
                )

            # Payment for appointment 2
            cur.execute(
                """
                INSERT INTO payments (appointment_id, user_id, amount, payment_method, status, transaction_id, phone_number, created_at, paid_at)
                VALUES (%s, %s, 650, 'card', 'paid', 'CC-AUTH-773120', '9876543213', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days')
                ON CONFLICT (appointment_id) DO NOTHING
                """,
                (appt_2_id, patient_id)
            )

            # Upcoming appointment (Dr. Amit Gupta)
            future_date = date.today() + timedelta(days=2)
            cur.execute(
                """
                INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, status, created_at)
                VALUES (%s, 3, %s, '11:00:00', 'booked', NOW())
                RETURNING id
                """,
                (patient_id, future_date)
            )
            appt_3_id = cur.fetchone()[0]

            # Payment pending for upcoming appointment
            cur.execute(
                """
                INSERT INTO payments (appointment_id, user_id, amount, payment_method, status, transaction_id, phone_number, created_at, paid_at)
                VALUES (%s, %s, 500, 'upi', 'pending', NULL, '9876543213', NOW(), NULL)
                ON CONFLICT (appointment_id) DO NOTHING
                """,
                (appt_3_id, patient_id)
            )

            conn.commit()
            print("Successfully seeded SaaS sample data: doctors, profiles, availability, users, appointments, prescriptions, medicines, and payments!")

if __name__ == "__main__":
    seed()
