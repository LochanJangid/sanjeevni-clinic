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
  }, []);

  const upcoming = appointments.find((appointment) => {
    return appointment.status !== "cancelled"
      && new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) >= new Date();
  });

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
          <p className="eyebrow">QUICK ACCESS</p>
          <h2 className="section-heading">What would you like to do?</h2>
          <div className="quick-action-list">
            <Link href="/doctors" className="quick-action">
              <span className="action-icon">⌕</span>
              <span><strong>Find a doctor</strong><small>Browse the clinic team</small></span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/appointments" className="quick-action">
              <span className="action-icon">▤</span>
              <span><strong>My appointments</strong><small>Review or manage visits</small></span>
              <span className="action-arrow">→</span>
            </Link>
            <Link href="/profile" className="quick-action">
              <span className="action-icon">○</span>
              <span><strong>Patient profile</strong><small>Keep contact details current</small></span>
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
