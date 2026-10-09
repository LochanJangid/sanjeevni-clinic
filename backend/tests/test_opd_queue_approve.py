import unittest
from datetime import date, timedelta
import os
from jose import jwt
from fastapi.testclient import TestClient
from app.main import app
from database.connection import Database

class OpdQueueApproveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        secret = os.getenv("SECRET_KEY", "fallback_secret")
        cls.token = jwt.encode({"sub": "1", "username": "admin", "role": "admin"}, secret, algorithm="HS256")
        cls.headers = {"Authorization": f"Bearer {cls.token}"}
        cls.db = Database()

    def test_approve_and_admit_today_workflow(self):
        today = date.today()
        tomorrow = today + timedelta(days=1)
        today_str = today.isoformat()
        tomorrow_str = tomorrow.isoformat()

        import uuid
        unique_username = f"patient_{uuid.uuid4().hex[:8]}"
        user_row = self.db.query(
            "INSERT INTO users (username, role, password_hash) VALUES (%s, 'patient', 'hash123') RETURNING id",
            (unique_username,),
            decision="fetchone"
        )
        user_id = user_row["id"]

        appt_row = self.db.query(
            """
            INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, status)
            VALUES (%s, 1, %s, '10:30:00', 'booked')
            RETURNING id
            """,
            (user_id, tomorrow),
            decision="fetchone"
        )
        appt_id = appt_row["id"]

        try:
            # 1. Approve & Queue for scheduled date (tomorrow)
            res1 = self.client.post(f"/admin/appointments/{appt_id}/approve", headers=self.headers, json={})
            self.assertEqual(res1.status_code, 200)
            data1 = res1.json()
            self.assertTrue(data1["success"])
            self.assertEqual(data1["token"]["token_date"], tomorrow_str)
            self.assertEqual(data1["token"]["status"], "waiting")

            # Verify it is NOT in today's live queue
            live_today_1 = self.client.get(f"/clinical/opd-queue/live?date={today_str}").json()
            doc1_tokens_today_1 = next(d for d in live_today_1["doctors_on_duty"] if d["doctor_id"] == 1)["waiting_tokens"]
            self.assertNotIn(data1["token"]["token_number"], doc1_tokens_today_1)

            # 2. Patient arrives early: click "Admit Today"
            res2 = self.client.post(f"/admin/appointments/{appt_id}/approve", headers=self.headers, json={"queue_date": today_str})
            self.assertEqual(res2.status_code, 200)
            data2 = res2.json()
            self.assertTrue(data2["success"])
            self.assertEqual(data2["appointment"]["appointment_date"], today_str)
            self.assertEqual(data2["token"]["token_date"], today_str)
            self.assertEqual(data2["token"]["status"], "waiting")
            today_token_num = data2["token"]["token_number"]

            # Verify it is NOW in today's live queue on OPD Queue TV!
            live_today_2 = self.client.get(f"/clinical/opd-queue/live?date={today_str}").json()
            doc1_duty = next(d for d in live_today_2["doctors_on_duty"] if d["doctor_id"] == 1)
            self.assertIn(today_token_num, doc1_duty["waiting_tokens"])

            # Verify patient name appears in waiting_details
            patient_detail = next(w for w in doc1_duty["waiting_details"] if w["token_number"] == today_token_num)
            self.assertEqual(patient_detail["patient_name"], unique_username)

        finally:
            # Cleanup test records
            self.db.query("DELETE FROM opd_tokens WHERE appointment_id = %s", (appt_id,))
            self.db.query("DELETE FROM payments WHERE appointment_id = %s", (appt_id,))
            self.db.query("DELETE FROM appointments WHERE id = %s", (appt_id,))
            self.db.query("DELETE FROM users WHERE id = %s", (user_id,))

if __name__ == "__main__":
    unittest.main()
