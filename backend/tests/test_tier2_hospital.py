import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestTier2HospitalWorkflows(unittest.TestCase):

    # 1. IPD Inpatient & Discharge Tests
    def test_ipd_bed_census(self):
        response = client.get("/ipd/census")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("summary", data)
        self.assertGreaterEqual(data["summary"]["total_beds"], 1)

    def test_ipd_admissions_list(self):
        response = client.get("/ipd/admissions?status_filter=all")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("admissions", data)
        self.assertGreaterEqual(data["count"], 1)

    def test_ipd_admission_details_and_ledger(self):
        # Fetch existing seeded admission
        admissions = client.get("/ipd/admissions").json().get("admissions", [])
        if admissions:
            admit_id = admissions[0]["id"]
            res = client.get(f"/ipd/admissions/{admit_id}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "success")
            self.assertIn("financials", data)
            # Hard Rule 1 verification: statutory GST exemption notice
            self.assertIn("gst_exemption_note", data["financials"])
            self.assertIn("Entry 74", data["financials"]["gst_exemption_note"])

    def test_ipd_add_billing_item(self):
        admissions = client.get("/ipd/admissions").json().get("admissions", [])
        if admissions:
            admit_id = admissions[0]["id"]
            payload = {
                "category": "procedure",
                "item_name": "Spirometry / PFT Test",
                "quantity": 1.0,
                "unit_price": 800.0,
                "gst_rate": 0.0,  # Exempt clinical procedure
                "added_by": "Test Suite"
            }
            res = client.post(f"/ipd/admissions/{admit_id}/billing-item", json=payload)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["status"], "success")
            self.assertEqual(res.json()["item"]["total_amount"], 800.0)

    # 2. Pharmacy Batches & Dispensing Tests
    def test_pharmacy_batches_expiry_status(self):
        response = client.get("/pharmacy-lab/pharmacy/batches")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("summary", data)
        self.assertIn("batches", data)
        if data["batches"]:
            first = data["batches"][0]
            self.assertIn("expiry_status", first)
            self.assertIn(first["expiry_status"], ["valid", "expiring_soon", "expired"])

    def test_pharmacy_dispensing_receipt(self):
        # Dispense 1 item of first medicine
        batches_res = client.get("/pharmacy-lab/pharmacy/batches").json().get("batches", [])
        if batches_res:
            m_id = batches_res[0]["medicine_id"]
            payload = {
                "uhid": "UHID-TEST-001",
                "patient_name": "Synthetic Patient X",
                "doctor_name": "Dr. Synthetic",
                "payment_method": "cash",
                "dispensed_by": "Counter Cashier",
                "items": [
                    {
                        "medicine_id": m_id,
                        "quantity": 2,
                        "unit_price": 100.0,
                        "gst_rate": 12.0
                    }
                ]
            }
            res = client.post("/pharmacy-lab/pharmacy/dispense", json=payload)
            self.assertEqual(res.status_code, 201)
            data = res.json()
            self.assertEqual(data["status"], "success")
            self.assertEqual(data["subtotal"], 200.0)
            self.assertEqual(data["gst_amount"], 24.0)
            self.assertEqual(data["total_amount"], 224.0)
            self.assertTrue(data["receipt_number"].startswith("RX-DISP-"))

    # 3. Lab Catalogue & Order Sample Tests
    def test_lab_catalogue(self):
        response = client.get("/pharmacy-lab/lab/catalogue")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertGreaterEqual(data["count"], 5)

    def test_lab_order_and_barcode_generation(self):
        catalogue = client.get("/pharmacy-lab/lab/catalogue").json().get("catalogue", [])
        if catalogue:
            test_id = catalogue[0]["id"]
            payload = {
                "uhid": "UHID-TEST-002",
                "patient_name": "Synthetic Lab Patient",
                "doctor_name": "Dr. Synthetic Path",
                "test_id": test_id,
                "clinical_notes": "Routine preoperative panel"
            }
            res = client.post("/pharmacy-lab/lab/orders", json=payload)
            self.assertEqual(res.status_code, 201)
            data = res.json()
            self.assertEqual(data["status"], "success")
            self.assertTrue(data["barcode"].startswith("SMPL-"))
            self.assertEqual(data["order"]["sample_status"], "ordered")

    # 4. DPDP Act Compliance Tests (Hard Rule 5)
    def test_dpdp_compliance_summary(self):
        response = client.get("/dpdp/compliance-summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["statutory_timeline"]["enforcement_start"], "2026-11-13")
        self.assertEqual(data["statutory_timeline"]["full_compliance_deadline"], "2027-05-13")
        self.assertIn("metrics", data)
        self.assertIn("security_posture", data)
        self.assertIn("AES-256", data["security_posture"]["encryption_at_rest"])

    def test_dpdp_consent_registration_and_hash(self):
        payload = {
            "uhid": "UHID-DPDP-TEST",
            "patient_name": "Consent Test Patient",
            "consent_type": "treatment_data",
            "purpose": "Inpatient clinical vital signs recording and treatment plan",
            "expires_in_days": 180,
            "captured_by": "OPD Registration Kiosk"
        }
        res = client.post("/dpdp/consents", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("consent_artifact_hash", data["consent"])
        self.assertEqual(len(data["consent"]["consent_artifact_hash"]), 64)  # Valid SHA-256 length

    def test_dpdp_audit_trail_logging(self):
        response = client.get("/dpdp/audit-trail?limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("audit_logs", data)

    def test_dpdp_export_dossier(self):
        response = client.get("/dpdp/export/UHID-2026-0814")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("records", data)
        self.assertIn("consents", data["records"])

    # 5. ABDM Sandbox Tests (Hard Rule 6)
    def test_abdm_sandbox_status(self):
        response = client.get("/abdm/sandbox-status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        # Hard Rule 6 verification: no fake certification claims
        self.assertIn("Sandbox Integration Mode", data["abdm_config"]["certification_status"])

    def test_abdm_m1_otp_flow(self):
        otp_req = {
            "aadhaar_number": "123456789012",
            "uhid": "UHID-ABDM-01",
            "patient_name": "Suresh Kumar"
        }
        gen_res = client.post("/abdm/m1/generate-aadhaar-otp", json=otp_req)
        self.assertEqual(gen_res.status_code, 200)
        tx_id = gen_res.json()["transaction_id"]

        verify_req = {
            "transaction_id": tx_id,
            "otp": "123456",
            "uhid": "UHID-ABDM-01",
            "patient_name": "Suresh Kumar"
        }
        verify_res = client.post("/abdm/m1/verify-otp", json=verify_req)
        self.assertEqual(verify_res.status_code, 200)
        profile = verify_res.json()["profile"]
        self.assertTrue(profile["abha_number"].startswith("91-"))
        self.assertTrue(profile["abha_address"].endswith("@abdm"))

    def test_abdm_m2_fhir_r4_bundle(self):
        res = client.get("/abdm/m2/fhir-bundle/IPD-ADMIT-2026-0814")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        bundle = data["fhir_r4_bundle"]
        self.assertEqual(bundle["resourceType"], "Bundle")
        self.assertEqual(bundle["type"], "document")
        self.assertEqual(bundle["meta"]["profile"][0], "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle")

    def test_abdm_m3_consent_request(self):
        payload = {
            "patient_abha": "ramesh.agarwal@abdm",
            "purpose": "Care Management",
            "hiu_id": "SANJEEVNI-HOSPITAL-HIU",
            "hip_id": "SANJEEVNI-HOSPITAL-HIP"
        }
        res = client.post("/abdm/m3/consent-request", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["consent_status"], "REQUESTED")
        req_id = data["consent_request_id"]

        sim_res = client.post(f"/abdm/m3/simulate-consent-grant/{req_id}")
        self.assertEqual(sim_res.status_code, 200)
        self.assertEqual(sim_res.json()["consent_status"], "GRANTED")

    # 6. Bulk CSV Import Test
    def test_bulk_medicine_csv_import(self):
        payload = {
            "medicines": [
                {
                    "name": "Synthetic Amoxicillin 500mg",
                    "generic_name": "Amoxicillin",
                    "category": "Antibiotic",
                    "dosage_form": "Capsule",
                    "strength": "500mg",
                    "price": 85.0,
                    "stock_quantity": 100,
                    "hsn_code": "3004",
                    "rack_location": "Rack-B2"
                }
            ]
        }
        # Simulate admin auth
        login_res = client.post("/users/demo_login/admin")
        token = login_res.json().get("access_token") or login_res.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        res = client.post("/admin/import/medicines", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["imported_count"], 1)

if __name__ == "__main__":
    unittest.main()
