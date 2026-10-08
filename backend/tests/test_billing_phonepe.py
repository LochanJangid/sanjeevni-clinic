import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestBillingPhonePe(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Obtain admin demo token for clinic cashier/admin operations
        res_admin = cls.client.post("/users/demo_login/admin")
        admin_data = res_admin.json()
        cls.admin_token = admin_data.get("access_token") or admin_data.get("token")
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # Obtain patient token
        res_pat = cls.client.post("/users/demo_login/patient")
        pat_data = res_pat.json()
        cls.patient_token = pat_data.get("access_token") or pat_data.get("token")
        cls.patient_headers = {"Authorization": f"Bearer {cls.patient_token}"}

    def test_phonepe_details_valid_appointment(self):
        # Appointment ID 5 is seeded
        response = self.client.get("/billing/phonepe-details/5", headers=self.admin_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["appointment_id"], 5)
        self.assertIn("doctor_name", data)
        self.assertIn("doctor_mobile", data)
        self.assertIn("doctor_upi", data)
        self.assertTrue(data["doctor_upi"].endswith("@ybl"))
        self.assertGreater(data["amount"], 0)
        self.assertTrue(data["upi_intent_uri"].startswith("upi://pay?pa="))
        self.assertTrue(data["phonepe_intent_uri"].startswith("phonepe://pay?pa="))
        self.assertIn("receipt_number", data)
        self.assertTrue(data["receipt_number"].startswith("SJ-REC-"))

    def test_phonepe_details_invalid_appointment(self):
        response = self.client.get("/billing/phonepe-details/999999", headers=self.admin_headers)
        self.assertEqual(response.status_code, 404)

    def test_phonepe_payment_flow(self):
        # Process a PhonePe payment using admin/cashier authorization
        payload = {
            "appointment_id": 5,
            "amount": 500,
            "payment_method": "phonepe",
            "transaction_id": "PP-UTR-9876543210-TEST",
            "phone_number": "9876543210"
        }
        response = self.client.post("/billing/pay", json=payload, headers=self.admin_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "paid")
        self.assertEqual(data["transaction_id"], "PP-UTR-9876543210-TEST")
        self.assertEqual(data["receipt_number"], "SJ-REC-00005")
        self.assertIn("paid_at", data)

if __name__ == "__main__":
    unittest.main()
