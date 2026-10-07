"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function BookAppointmentForm() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctor_id");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  function decodeJwtPayload(token: string) {
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;

      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!doctorId || !date) {
        setSlots([]);
        setTime("");
        return;
      }

      try {
        setSlotsLoading(true);
        const response = await fetch(
          `${API_URL}/doctors/get_doctor_slots/${doctorId}?date=${date}`
        );

        if (!response.ok) {
          throw new Error("Unable to load appointment slots");
        }

        const data = await response.json();
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setTime("");
      } catch {
        setSlots([]);
        setTime("");
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchAvailableSlots();
  }, [date, doctorId]);

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
      setMessage("Please select an available appointment slot.");
      return;
    }

    const selectedDateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(selectedDateTime.getTime()) || selectedDateTime <= new Date()) {
      setMessage("Please choose a future appointment time.");
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

      const response = await fetch(`${API_URL}/appointments/book`, {
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
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.msg || "Unable to book appointment.");
        return;
      }

      setMessage("Appointment booked successfully!");
      setTime("");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while booking.");
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
      <div className="mx-auto max-w-xl">
        <Link href="/doctors" className="text-blue-600">
          ← Back to doctors
        </Link>

        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Book Appointment</h1>
          <p className="mt-2 text-gray-500">Doctor ID: {doctorId}</p>

          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block font-medium">Appointment Date</label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Available Time Slots</label>

              {date ? (
                slotsLoading ? (
                  <p className="text-sm text-gray-500">Loading available times...</p>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          time === slot
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    No available slots for this date. Please choose another date.
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-500">Choose a date to view available slots.</p>
              )}
            </div>

            {time && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Selected slot: <span className="font-semibold">{date} at {time}</span>
              </div>
            )}

            <button
              onClick={bookAppointment}
              disabled={loading || !time}
              className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Appointment"}
            </button>

            {message && <p className="mt-4 text-center text-sm">{message}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
