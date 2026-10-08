import os
from types import SimpleNamespace
import unittest
from datetime import date, datetime, time, timedelta, timezone
from unittest.mock import patch

os.environ["SECRET_KEY"] = "unit-test-signing-key"

from fastapi import HTTPException
from jose import jwt

from routers import appointments, doctors, users


class AppointmentRuleTests(unittest.TestCase):
    def test_accepts_future_half_hour_slot_inside_clinic_hours(self):
        appointment_date = date.today() + timedelta(days=1)

        appointments.validate_slot(appointment_date, time(9, 30))
        appointments.validate_slot(appointment_date, time(16, 30))

    def test_rejects_past_date(self):
        with self.assertRaises(HTTPException) as context:
            appointments.validate_slot(date.today() - timedelta(days=1), time(10, 0))

        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_past_time_today(self):
        now = datetime.now()
        past_time = (now - timedelta(minutes=1)).time().replace(second=0, microsecond=0)

        with self.assertRaises(HTTPException) as context:
            appointments.validate_slot(date.today(), past_time)

        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_out_of_hours_and_non_slot_times(self):
        for invalid_time in (time(8, 30), time(17, 0), time(10, 15)):
            with self.subTest(invalid_time=invalid_time):
                with self.assertRaises(HTTPException) as context:
                    appointments.validate_slot(date.today() + timedelta(days=1), invalid_time)
                self.assertEqual(context.exception.status_code, 400)

    def test_rejects_timezone_qualified_clinic_time(self):
        with self.assertRaises(HTTPException) as context:
            appointments.validate_slot(
                date.today() + timedelta(days=1),
                time(10, 0, tzinfo=timezone.utc),
            )

        self.assertEqual(context.exception.status_code, 400)

    def test_authentication_rejects_missing_or_invalid_tokens(self):
        for authorization in (None, "Basic abc", "Bearer invalid"):
            with self.subTest(authorization=authorization):
                with self.assertRaises(HTTPException) as context:
                    users.authenticated_user_id(authorization)
                self.assertEqual(context.exception.status_code, 401)

    def test_authentication_reads_the_signed_user_subject(self):
        token = jwt.encode({"sub": "28"}, os.environ["SECRET_KEY"], algorithm="HS256")

        self.assertEqual(users.authenticated_user_id(f"Bearer {token}"), 28)

    def test_booking_uses_the_authenticated_patient_and_locks_the_day(self):
        class Cursor:
            description = [
                SimpleNamespace(name=column)
                for column in (
                    "id",
                    "user_id",
                    "doctor_id",
                    "appointment_date",
                    "appointment_time",
                    "status",
                )
            ]

            def __init__(self):
                self.rows = iter(
                    [
                        (7,),
                        (5,),
                        None,
                        (81, 7, 5, date.today() + timedelta(days=1), time(10, 0), "pending"),
                    ]
                )
                self.executed = []

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return None

            def execute(self, query, params=()):
                self.executed.append((query, params))

            def fetchone(self):
                return next(self.rows)

        class Connection:
            def __init__(self, cursor):
                self.cursor_instance = cursor

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return None

            def cursor(self):
                return self.cursor_instance

        token = jwt.encode({"sub": "7"}, os.environ["SECRET_KEY"], algorithm="HS256")
        cursor = Cursor()

        with patch.object(appointments.db, "get_connection", return_value=Connection(cursor)):
            result = appointments.book_appointment(
                appointments.AppointmentCreate(
                    doctor_id=5,
                    appointment_date=date.today() + timedelta(days=1),
                    appointment_time=time(10, 0),
                ),
                authorization=f"Bearer {token}",
            )

        self.assertTrue(result["success"])
        self.assertEqual(result["appointment"]["id"], 81)
        self.assertIn("pg_advisory_xact_lock", cursor.executed[0][0])
        self.assertNotIn("user_id", appointments.AppointmentCreate.model_fields)

    def test_slot_search_removes_existing_overlapping_appointments(self):
        future_date = date.today() + timedelta(days=1)

        with patch.object(
            doctors.db,
            "query",
            side_effect=[
                {"id": 5},
                [],
                None,
                [{"appointment_time": time(9, 15)}],
            ],
        ):
            result = doctors.get_doctor_slots(5, future_date)

        self.assertNotIn("09:00", result["slots"])
        self.assertNotIn("09:30", result["slots"])
        self.assertIn("10:00", result["slots"])


if __name__ == "__main__":
    unittest.main()
