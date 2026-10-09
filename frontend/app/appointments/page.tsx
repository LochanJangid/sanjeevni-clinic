"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  ChevronRight, 
  FileText, 
  QrCode, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { parseTokenClaims } from "../../lib/auth";

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor_id: number;
  doctor_name: string;
  fees: number;
  category_name?: string;
  payment_status?: string;
  has_prescription?: boolean;
  opd_token_number?: number | null;
  opd_token_status?: string | null;
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
    <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <strong className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[#0D9488]" />
          <span>Reschedule Visit Slot</span>
        </strong>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-[#1E3A8A] text-base"
        >
          ✕
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Select New Consultation Date
        </label>
        <input
          className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
          type="date"
          min={localDateString()}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setSlots([]);
            setTime("");
            setError("");
          }}
        />
      </div>

      {date && (loading ? (
        <p className="text-xs font-medium text-[#0D9488] animate-pulse">Checking doctor availability mesh…</p>
      ) : slots.length > 0 ? (
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
            Available 30-min Clinical Slots
          </label>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot}
                onClick={() => setTime(slot)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  time === slot
                    ? "bg-[#0D9488] text-white font-bold shadow-sm"
                    : "bg-white text-[#4B5563] hover:bg-slate-100 border border-gray-200"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      ) : !error ? (
        <p className="text-xs text-gray-400">No available slots on this date. Please choose another date.</p>
      ) : null)}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!time || saving}
          onClick={saveReschedule}
          className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
        >
          {saving ? "Confirming…" : "Confirm Rescheduled Slot"}
        </button>
      </div>
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleAppointments = appointments.filter((appointment) => {
    const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const isCancelled = appointment.status?.toLowerCase() === "cancelled";
    const isUpcomingTime = mounted ? appointmentTime.getTime() >= Date.now() : true;
    return activeTab === "upcoming"
      ? !isCancelled && isUpcomingTime
      : isCancelled || !isUpcomingTime;
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
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#0D9488]" />
                  VISITS &amp; CONSULTATIONS MATRIX
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#1E3A8A]" />
                  30-MIN RESERVED SLOTS
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Calendar className="w-7 h-7" />
                </span>
                <span>My Appointments &amp; Consultations</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Review scheduled clinical consultations, access digital prescriptions (Rx), verify PhonePe payment status, or reschedule appointment timings.
              </p>
            </div>

            <Link
              href="/doctors"
              className="px-5 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition self-start lg:self-auto"
            >
              <span>Book New Visit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {!token && !loading ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-[#1E3A8A]">Sign In to Review Appointments</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your consultation records and medical history are encrypted and private.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex items-center justify-between">
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-50 border border-gray-200 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === "upcoming"
                      ? "bg-[#0D9488] text-white shadow-sm"
                      : "text-[#4B5563] hover:text-[#1E3A8A]"
                  }`}
                >
                  Upcoming Appointments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("past")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === "past"
                      ? "bg-[#0D9488] text-white shadow-sm"
                      : "text-[#4B5563] hover:text-[#1E3A8A]"
                  }`}
                >
                  Past &amp; Cancelled
                </button>
              </div>

              {!loading && (
                <span className="text-xs text-gray-500 font-medium">
                  {visibleAppointments.length} {visibleAppointments.length === 1 ? "Visit" : "Visits"}
                </span>
              )}
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
                {actionError}
              </div>
            )}

            {loading ? (
              <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mb-2" />
                <p className="text-xs font-medium text-gray-500">LOADING APPOINTMENT RECORDS...</p>
              </div>
            ) : visibleAppointments.length === 0 ? (
              <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center space-y-3 shadow-sm">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-semibold text-[#1E3A8A]">
                  {activeTab === "upcoming" ? "No Upcoming Visits Scheduled" : "No Past Visits Found"}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {activeTab === "upcoming"
                    ? "When you book your consultation with our clinicians, it will appear here."
                    : "Completed consultations and previous visits will be recorded here."}
                </p>
                {activeTab === "upcoming" && (
                  <Link
                    href="/doctors"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
                  >
                    <span>Find a Clinician</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleAppointments.map((appointment) => {
                  const isCancelled = appointment.status?.toLowerCase() === "cancelled";
                  const canManage = activeTab === "upcoming" && !isCancelled;
                  return (
                    <article
                      key={appointment.id}
                      className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-[#0D9488]/40 hover:shadow-md transition space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-gray-200 flex flex-col items-center justify-center text-center p-2 shrink-0 font-mono">
                            <strong className="text-lg font-black text-[#1E3A8A] leading-none">
                              {new Date(appointment.appointment_date).toLocaleDateString(undefined, { day: "2-digit" })}
                            </strong>
                            <span className="text-[10px] text-gray-400 uppercase mt-0.5">
                              {new Date(appointment.appointment_date).toLocaleDateString(undefined, { month: "short" })}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200">
                              {appointment.category_name || "SPECIALIST CONSULTATION"}
                            </span>
                            <h3 className="text-lg font-bold text-[#1E3A8A]">
                              {appointment.doctor_name}
                            </h3>
                            <p className="text-xs text-[#4B5563]">
                              {new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {appointment.appointment_time.slice(0, 5)}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right space-y-1.5">
                          <div className="text-xs text-gray-500 font-medium">
                            Fee: <strong className="text-[#1E3A8A] text-base font-bold">₹{appointment.fees}</strong>
                          </div>
                          <div className="flex gap-1.5 justify-start sm:justify-end flex-wrap items-center">
                            {appointment.opd_token_number && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
                                Token #{appointment.opd_token_number}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isCancelled
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : appointment.status === "completed"
                                  ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                                  : appointment.status === "approved" || appointment.status === "checked_in"
                                  ? "bg-blue-50 text-[#1E3A8A] border border-blue-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {appointment.status === "approved"
                                ? "APPROVED (QUEUED)"
                                : appointment.status === "booked" || appointment.status === "pending"
                                ? "AWAITING APPROVAL"
                                : appointment.status?.toUpperCase() || "BOOKED"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                appointment.payment_status === "paid"
                                  ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {appointment.payment_status === "paid" ? "PAID ✓" : "UNPAID"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions strip */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/appointments/${appointment.id}`}
                            className="text-[#0D9488] hover:underline font-semibold inline-flex items-center gap-1 transition"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          {appointment.has_prescription && (
                            <Link
                              href={`/prescriptions/${appointment.id}`}
                              className="text-[#0D9488] hover:underline font-semibold inline-flex items-center gap-1 transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Digital Rx ℞</span>
                            </Link>
                          )}

                          {appointment.payment_status !== "paid" && !isCancelled && (
                            <Link
                              href="/billing"
                              className="text-[#1E3A8A] hover:underline font-semibold inline-flex items-center gap-1 transition"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Pay on PhonePe (₹{appointment.fees}) ↗</span>
                            </Link>
                          )}
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError("");
                                setReschedulingId(reschedulingId === appointment.id ? null : appointment.id);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#4B5563] border border-gray-200 text-xs font-semibold transition"
                            >
                              {reschedulingId === appointment.id ? "Close Form" : "Reschedule Slot"}
                            </button>

                            <button
                              type="button"
                              disabled={busyId === appointment.id}
                              onClick={() => cancelAppointment(appointment)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                            >
                              {busyId === appointment.id ? "Cancelling…" : "Cancel Visit"}
                            </button>
                          </div>
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

      </div>
    </div>
  );
}
