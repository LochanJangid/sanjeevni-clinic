"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseTokenClaims } from "../../lib/auth";

interface Appointment {
  id: number;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  fees: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function loadOverview() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const payload = parseTokenClaims(token);
        if (!payload?.sub) throw new Error("Your session is invalid. Please sign in again.");
        setUsername(payload.username || "there");

        const response = await fetch(`${API_URL}/appointments/user/${payload.sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const problem = await response.json().catch(() => ({}));
          throw new Error(problem.detail || "We could not load your appointments.");
        }

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : "Unable to load your overview.");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
    setMounted(true);
  }, []);

  const upcoming = mounted
    ? appointments.find((appointment) => {
        return (
          appointment.status !== "cancelled" &&
          new Date(`${appointment.appointment_date}T${appointment.appointment_time}`).getTime() >= Date.now()
        );
      })
    : null;

  return (
    <main className="page-shell">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">PATIENT OVERVIEW</p>
          <h1 className="page-title">A little more clarity, {username || "for your care"}.</h1>
          <p className="page-lead">Your appointments and next steps, together in one place.</p>
        </div>
        <Link className="button button-primary" href="/doctors">Book an appointment <span aria-hidden="true">↗</span></Link>
      </div>

      <div className="dashboard-grid">
        <section className="card next-visit-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR NEXT VISIT</p>
              <h2 className="section-heading">Appointment</h2>
            </div>
            <span className="panel-icon" aria-hidden="true">✳</span>
          </div>

          {loading ? (
            <div className="dashboard-loading">Loading your appointments…</div>
          ) : error ? (
            <div className="dashboard-error" role="alert">
              <p>{error}</p>
              <Link href="/appointments">Open appointments</Link>
            </div>
          ) : upcoming ? (
            <div className="next-visit-content">
              <p className="doctor-name">{upcoming.doctor_name}</p>
              <p className="visit-date">
                {new Date(`${upcoming.appointment_date}T${upcoming.appointment_time}`).toLocaleDateString(undefined, {
                  weekday: "long", month: "long", day: "numeric",
                })}
              </p>
              <p className="visit-time">{upcoming.appointment_time} · Consultation ₹{upcoming.fees}</p>
              <div className="visit-footer">
                <span className="appointment-status">{upcoming.status || "Booked"}</span>
                <Link href={`/appointments/${upcoming.id}`}>View details <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          ) : (
            <div className="empty-next-visit">
              <span className="empty-calendar" aria-hidden="true">□</span>
              <h3>No upcoming visits</h3>
              <p>When you book an appointment, its details will appear here.</p>
              <Link href="/doctors">Find a doctor <span aria-hidden="true">→</span></Link>
            </div>
          )}
        </section>

        <section className="card quick-actions-card">
          <p className="eyebrow">PATIENT HEALTHCARE SUITE</p>
          <h2 className="section-heading">Clinical Portals &amp; Health Records</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
            <Link href="/symptom-checker" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-teal-100 text-teal-800 rounded-lg text-sm">⚡</span>
                <span><strong>AI Symptom Triage</strong><small className="block text-muted">Screen symptoms &amp; find doctor</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/lab-reports" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm">🔬</span>
                <span><strong>Diagnostic Lab Reports</strong><small className="block text-muted">Pathology, CBC &amp; test slips</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/vitals" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-100 text-rose-800 rounded-lg text-sm">📈</span>
                <span><strong>Vitals &amp; Biomarkers</strong><small className="block text-muted">BP, sugar, pulse &amp; weight logs</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/pharmacy" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm">💊</span>
                <span><strong>Clinic Dispensary</strong><small className="block text-muted">Prescribed medicines &amp; stocks</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/teleconsult" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-800 rounded-lg text-sm">📹</span>
                <span><strong>Teleconsult Room</strong><small className="block text-muted">Virtual video doctor visit</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/vaccinations" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-lg text-sm">💉</span>
                <span><strong>Vaccine Passport</strong><small className="block text-muted">Immunization certificates</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/prescriptions" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-teal-100 text-teal-800 rounded-lg text-sm">℞</span>
                <span><strong>Digital Prescriptions</strong><small className="block text-muted">Official dosage schedules</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/billing" className="quick-action p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="p-2 bg-slate-100 text-slate-800 rounded-lg text-sm">₹</span>
                <span><strong>Invoices &amp; Billing</strong><small className="block text-muted">UPI &amp; card payment receipts</small></span>
              </span>
              <span className="action-arrow">→</span>
            </Link>
          </div>
        </section>
      </div>

      <section className="card dashboard-appointments">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">YOUR CARE, AT A GLANCE</p>
            <h2 className="section-heading">Recent appointments</h2>
          </div>
          <Link className="text-link" href="/appointments">View all <span aria-hidden="true">→</span></Link>
        </div>
        {loading ? (
          <p className="subtle-copy">Loading appointment history…</p>
        ) : appointments.length > 0 ? (
          <div className="recent-appointment-list">
            {appointments.slice(0, 3).map((appointment) => (
              <Link href={`/appointments/${appointment.id}`} className="recent-appointment" key={appointment.id}>
                <span className="recent-date">
                  <strong>{new Date(appointment.appointment_date).toLocaleDateString(undefined, { day: "2-digit" })}</strong>
                  <small>{new Date(appointment.appointment_date).toLocaleDateString(undefined, { month: "short" })}</small>
                </span>
                <span className="recent-copy">
                  <strong>{appointment.doctor_name}</strong>
                  <small>{appointment.appointment_time} · ₹{appointment.fees}</small>
                </span>
                <span className="recent-status">{appointment.status || "Booked"}</span>
                <span className="action-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : !error ? (
          <div className="history-empty">
            <p>Your appointment history will appear here once you book a visit.</p>
            <Link className="text-link" href="/doctors">Explore doctors <span aria-hidden="true">→</span></Link>
          </div>
        ) : null}
      </section>

      <p className="dashboard-disclaimer">
        This overview is for organizing appointments and is not a substitute for emergency or medical advice.
      </p>
    </main>
  );
}
