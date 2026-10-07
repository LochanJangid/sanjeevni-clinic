"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseTokenClaims } from "../../lib/auth";

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor_id: number;
  doctor_name: string;
  fees: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function localDateString() {
  const current = new Date();
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
}

function ReschedulePanel({
  appointment,
  token,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) return;

    const controller = new AbortController();
    async function fetchSlots() {
      setLoading(true);
      setError("");
      setTime("");
      try {
        const response = await fetch(
          `${API_URL}/doctors/get_doctor_slots/${appointment.doctor_id}?date=${encodeURIComponent(date)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to check available times.");
        setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch (problem) {
        if (!(problem instanceof DOMException && problem.name === "AbortError")) {
          setError(problem instanceof Error ? problem.message : "Unable to check available times.");
          setSlots([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchSlots();
    return () => controller.abort();
  }, [appointment.doctor_id, date]);

  async function saveReschedule() {
    if (!date || !time) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/appointments/${appointment.id}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointment_date: date, appointment_time: time }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to reschedule this appointment.");
      onSaved();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Unable to reschedule this appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reschedule-panel">
      <div className="reschedule-panel-heading">
        <strong>Choose another time</strong>
        <button type="button" className="inline-close" onClick={onClose} aria-label="Close reschedule form">×</button>
      </div>
      <label className="reschedule-date">
        <span className="field-label">New date</span>
        <input className="field-input" type="date" min={localDateString()} value={date} onChange={(event) => {
          setDate(event.target.value);
          setSlots([]);
          setTime("");
          setError("");
        }} />
      </label>
      {date && (loading ? (
        <p className="booking-hint">Checking available times…</p>
      ) : slots.length > 0 ? (
        <div className="slot-grid reschedule-slots">
          {slots.map((slot) => (
            <label className={time === slot ? "slot-option selected" : "slot-option"} key={slot}>
              <input type="radio" name={`reschedule-${appointment.id}`} checked={time === slot} onChange={() => setTime(slot)} />
              <span>{slot}</span>
            </label>
          ))}
        </div>
      ) : !error ? (
        <p className="booking-hint">No available times on this date. Choose another day.</p>
      ) : null)}
      {error && <p className="booking-error" role="alert">{error}</p>}
      <button type="button" className="button button-primary" disabled={!time || saving} onClick={saveReschedule}>
        {saving ? "Saving…" : "Save new time"}
      </button>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchAppointments() {
      const currentToken = localStorage.getItem("access_token");
      if (!currentToken) {
        setLoading(false);
        return;
      }
      setToken(currentToken);

      const claims = parseTokenClaims(currentToken);
      if (!claims?.sub) {
        localStorage.removeItem("access_token");
        setError("Your session is invalid. Please sign in again.");
        setLoading(false);
        return;
      }
      const userId = claims.sub;

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/appointments/user/${userId}`, {
          headers: { Authorization: `Bearer ${currentToken}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401) localStorage.removeItem("access_token");
          throw new Error(data.detail || "Unable to load your appointments.");
        }
        setAppointments(Array.isArray(data) ? data : []);
      } catch (problem) {
        if (!(problem instanceof DOMException && problem.name === "AbortError")) {
          setError(problem instanceof Error ? problem.message : "Unable to load your appointments.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchAppointments();
    return () => controller.abort();
  }, [reload]);

  const visibleAppointments = appointments.filter((appointment) => {
    const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const isCancelled = appointment.status?.toLowerCase() === "cancelled";
    return activeTab === "upcoming"
      ? !isCancelled && appointmentTime >= new Date()
      : isCancelled || appointmentTime < new Date();
  });

  async function cancelAppointment(appointment: Appointment) {
    if (!window.confirm(`Cancel your appointment with ${appointment.doctor_name}?`)) return;
    setBusyId(appointment.id);
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/appointments/${appointment.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to cancel this appointment.");
      setReload((current) => current + 1);
    } catch (problem) {
      setActionError(problem instanceof Error ? problem.message : "Unable to cancel this appointment.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page-shell">
      <div className="appointments-heading">
        <div>
          <p className="eyebrow">YOUR VISITS</p>
          <h1 className="page-title">Appointments, all in one place.</h1>
          <p className="page-lead">Review upcoming appointments, see past visits, or change a time that no longer works.</p>
        </div>
        <Link href="/doctors" className="button button-primary">Book a visit <span aria-hidden="true">↗</span></Link>
      </div>

      {!token && !loading ? (
        <div className="appointments-blank card">
          <h2 className="section-heading">Sign in to see your appointments</h2>
          <p>Your appointment information is private and only available to you.</p>
          <Link className="button button-primary" href="/login">Sign in</Link>
        </div>
      ) : (
        <>
          <div className="appointment-tabs" role="tablist" aria-label="Appointment history">
            <button type="button" role="tab" aria-selected={activeTab === "upcoming"} className={activeTab === "upcoming" ? "appointment-tab active" : "appointment-tab"} onClick={() => setActiveTab("upcoming")}>Upcoming</button>
            <button type="button" role="tab" aria-selected={activeTab === "past"} className={activeTab === "past" ? "appointment-tab active" : "appointment-tab"} onClick={() => setActiveTab("past")}>Past & cancelled</button>
            {!loading && <span className="appointment-count">{visibleAppointments.length} {visibleAppointments.length === 1 ? "visit" : "visits"}</span>}
          </div>

          {actionError && <p className="booking-error appointment-action-error" role="alert">{actionError}</p>}
          {error ? (
            <div className="appointments-blank card appointments-error" role="alert">
              <h2 className="section-heading">We couldn’t load your visits.</h2>
              <p>{error}</p>
              <button className="button button-quiet" onClick={() => setReload((current) => current + 1)}>Try again</button>
            </div>
          ) : loading ? (
            <div className="appointments-blank card" role="status">Loading your appointments…</div>
          ) : visibleAppointments.length === 0 ? (
            <div className="appointments-blank card">
              <span className="empty-calendar" aria-hidden="true">{activeTab === "upcoming" ? "+" : "□"}</span>
              <h2 className="section-heading">{activeTab === "upcoming" ? "No upcoming visits" : "No past visits yet"}</h2>
              <p>{activeTab === "upcoming" ? "When you book your next appointment, it will show up here." : "Completed and cancelled appointments will be listed here."}</p>
              {activeTab === "upcoming" && <Link className="button button-primary" href="/doctors">Find a doctor</Link>}
            </div>
          ) : (
            <div className="appointment-list">
              {visibleAppointments.map((appointment) => {
                const isCancelled = appointment.status?.toLowerCase() === "cancelled";
                const canManage = activeTab === "upcoming" && !isCancelled;
                return (
                  <article className="appointment-card card" key={appointment.id}>
                    <div className="appointment-card-main">
                      <div className="appointment-date-tile">
                        <strong>{new Date(appointment.appointment_date).toLocaleDateString(undefined, { day: "2-digit" })}</strong>
                        <span>{new Date(appointment.appointment_date).toLocaleDateString(undefined, { month: "short" })}</span>
                      </div>
                      <div className="appointment-main-copy">
                        <p className="eyebrow">DOCTOR VISIT</p>
                        <h2>{appointment.doctor_name}</h2>
                        <p>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {appointment.appointment_time.slice(0, 5)}</p>
                      </div>
                      <div className="appointment-card-fee">
                        <span>Consultation fee</span>
                        <strong>₹{appointment.fees}</strong>
                        <span className={isCancelled ? "status-pill cancelled" : "status-pill"}>{appointment.status || "Booked"}</span>
                      </div>
                    </div>
                    <div className="appointment-card-actions">
                      <Link href={`/appointments/${appointment.id}`} className="appointment-text-action">View details <span aria-hidden="true">→</span></Link>
                      {canManage && (
                        <>
                          <button type="button" className="appointment-text-action" onClick={() => {
                            setActionError("");
                            setReschedulingId(reschedulingId === appointment.id ? null : appointment.id);
                          }}>
                            {reschedulingId === appointment.id ? "Close reschedule" : "Reschedule"}
                          </button>
                          <button type="button" className="appointment-cancel-action" disabled={busyId === appointment.id} onClick={() => cancelAppointment(appointment)}>
                            {busyId === appointment.id ? "Cancelling…" : "Cancel visit"}
                          </button>
                        </>
                      )}
                    </div>
                    {reschedulingId === appointment.id && (
                      <ReschedulePanel
                        appointment={appointment}
                        token={token}
                        onClose={() => setReschedulingId(null)}
                        onSaved={() => {
                          setReschedulingId(null);
                          setReload((current) => current + 1);
                        }}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
