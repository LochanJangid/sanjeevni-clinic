"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function BookAppointmentForm() {
  const searchParams = useSearchParams();

  const doctorId = searchParams.get("doctor_id");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function decodeJwtPayload(token: string) {
    try {
      const payload = token.split(".")[1];
      if (!payload) {
        return null;
      }

      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  async function bookAppointment() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login before booking an appointment.");
      return;
    }

    if (!doctorId) {
      setMessage("Doctor not selected.");
      return;
    }

    if (!date || !time) {
      setMessage("Please select date and time.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const tokenPayload = decodeJwtPayload(token);
      if (!tokenPayload || !tokenPayload.sub) {
        localStorage.removeItem("access_token");
        setMessage("Your login session is invalid. Please log in again.");
        return;
      }

      const userId = Number(tokenPayload.sub);
      if (!Number.isFinite(userId)) {
        setMessage("Unable to determine your user account.");
        return;
      }

      const response = await fetch(
        `${API_URL}/appointments/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            doctor_id: Number(doctorId),
            appointment_date: date,
            appointment_time: time,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.msg || "Unable to book appointment."
        );
        return;
      }

      setMessage("Appointment booked successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!doctorId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Doctor not selected.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">

      <div className="max-w-xl mx-auto">

        <Link
          href="/doctors"
          className="text-blue-600"
        >
          ← Back to doctors
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border p-8 mt-6">

          <h1 className="text-2xl font-bold">
            Book Appointment
          </h1>

          <p className="text-gray-500 mt-2">
            Doctor ID: {doctorId}
          </p>

          <div className="mt-8 space-y-6">

            <div>
              <label className="block mb-2 font-medium">
                Appointment Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Appointment Time
              </label>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <button
              onClick={bookAppointment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Booking..."
                : "Confirm Appointment"}
            </button>

            {message && (
              <p className="text-center text-sm mt-4">
                {message}
              </p>
            )}

          </div>
        </div>
      </div>

    </main>
  );
}