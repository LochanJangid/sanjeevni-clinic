"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { parseTokenClaims } from "../../../lib/auth";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  fees: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function BookAppointmentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doctorIdParam = searchParams.get("doctor_id");
  const doctorId = Number(doctorIdParam);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [message, setMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMinDate(getLocalDateString()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!Number.isSafeInteger(doctorId) || doctorId < 1) return;

    const controller = new AbortController();
    async function loadDoctor() {
      try {
        const response = await fetch(`${API_URL}/doctors/get_doctor/${doctorId}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Doctor not found.");
        setDoctor(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setBookingError(error instanceof Error ? error.message : "Unable to load doctor details.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingDoctor(false);
      }
    }

    loadDoctor();
    return () => controller.abort();
  }, [doctorId]);

  useEffect(() => {
    if (!date || !doctorId) return;

    const controller = new AbortController();
    async function loadSlots() {
      setLoadingSlots(true);
      setSlotError("");
      setTime("");
      try {
        const response = await fetch(
          `${API_URL}/doctors/get_doctor_slots/${doctorId}?date=${encodeURIComponent(date)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Could not check available times.");
        setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSlots([]);
          setSlotError(error instanceof Error ? error.message : "Could not check available times.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => controller.abort();
  }, [date, doctorId]);

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");
    setMessage("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setBookingError("Sign in to book your appointment.");
      return;
    }

    if (!parseTokenClaims(token)?.sub) {
      localStorage.removeItem("access_token");
      setBookingError("Your session is invalid. Please sign in again.");
      return;
    }

    if (!doctor || !date || !time || !slots.includes(time)) {
      setBookingError("Choose a date and an available time before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: doctor.id,
          appointment_date: date,
          appointment_time: time,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "We could not confirm this appointment.");

      setMessage("Your appointment request was recorded. Opening the details…");
      const appointmentId = data.appointment?.id;
      if (appointmentId) {
        window.setTimeout(() => router.push(`/appointments/${appointmentId}`), 700);
      }
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "We could not confirm this appointment. Please try another time.",
      );
      if (error instanceof Error && error.message.toLowerCase().includes("booked")) {
        setSlots((current) => current.filter((slot) => slot !== time));
        setTime("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!doctorIdParam || !Number.isSafeInteger(doctorId) || doctorId < 1) {
    return (
      <main className="page-shell">
        <div className="booking-state card">
          <h1 className="section-heading">Choose a doctor first</h1>
          <p>Return to the doctor directory to select a clinician and see bookable times.</p>
          <Link className="button button-primary" href="/doctors">Browse doctors</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell booking-shell">
      <Link className="back-link" href="/doctors">← Back to doctors</Link>
      <div className="booking-layout">
        <section>
          <p className="eyebrow">APPOINTMENT REQUEST</p>
          <h1 className="page-title">Choose a time for your visit.</h1>
          <p className="page-lead">Select a date to see available appointment times. Your booking is confirmed after the clinic accepts the request.</p>

          <form className="booking-card card" onSubmit={bookAppointment}>
            <label>
              <span className="field-label">Appointment date</span>
              <input
                className="field-input"
                type="date"
                min={minDate}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                  setSlots([]);
                  setSlotError("");
                }}
                required
              />
            </label>

            <fieldset className="slot-fieldset">
              <legend className="field-label">Available times</legend>
              {!date ? (
                <p className="booking-hint">Select a date to check available times.</p>
              ) : loadingSlots ? (
                <p className="booking-hint" role="status">Checking appointment availability…</p>
              ) : slotError ? (
                <p className="booking-error" role="alert">{slotError}</p>
              ) : slots.length === 0 ? (
                <p className="booking-hint">No bookable times are available on this date. Try another day.</p>
              ) : (
                <div className="slot-grid">
                  {slots.map((slot) => (
                    <label className={time === slot ? "slot-option selected" : "slot-option"} key={slot}>
                      <input
                        type="radio"
                        name="appointment-time"
                        value={slot}
                        checked={time === slot}
                        onChange={() => setTime(slot)}
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
            {message && <p className="booking-success" role="status">{message}</p>}

            <button className="button button-primary booking-submit" type="submit" disabled={submitting || !time || loadingSlots}>
              {submitting ? "Confirming…" : "Confirm appointment"}
            </button>
            <p className="booking-legal">No payment is collected on this page. Contact the clinic if you have questions about fees or payment.</p>
          </form>
        </section>

        <aside className="booking-summary card">
          <p className="eyebrow">VISIT SUMMARY</p>
          {loadingDoctor ? (
            <p className="booking-hint">Loading doctor details…</p>
          ) : doctor ? (
            <>
              <div className="booking-doctor-avatar" aria-hidden="true">
                {doctor.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
              </div>
              <h2>{doctor.name}</h2>
              <p className="booking-category">Care category {doctor.category_id}</p>
              <div className="summary-divider" />
              <div className="summary-fee">
                <span>Consultation fee</span>
                <strong>₹{doctor.fees}</strong>
              </div>
              {date && time && (
                <div className="summary-selected-time">
                  <span>Selected time</span>
                  <strong>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {time}</strong>
                </div>
              )}
            </>
          ) : (
            <div className="booking-error" role="alert">{bookingError || "Doctor not found."}</div>
          )}
          <div className="booking-summary-note">
            Appointment times reflect current availability and may be booked by another patient before confirmation.
          </div>
        </aside>
      </div>
    </main>
  );
}
