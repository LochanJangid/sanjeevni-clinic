"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";

interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionItem {
  id: number;
  appointment_id: number;
  doctor_id: number;
  user_id: number;
  doctor_name: string;
  category_name: string;
  diagnosis: string;
  instructions: string;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
  medicines: Medicine[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("patient");

  useEffect(() => {
    async function loadPrescriptions() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const claims = parseTokenClaims(token);
      if (!claims?.sub) {
        setLoading(false);
        return;
      }

      setUserRole(claims.role || "patient");

      try {
        const response = await fetch(`${API_URL}/prescriptions/patient/${claims.sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const problem = await response.json().catch(() => ({}));
          throw new Error(problem.detail || "Unable to load prescriptions.");
        }

        const data = await response.json();
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching records.");
      } finally {
        setLoading(false);
      }
    }

    loadPrescriptions();
  }, []);

  return (
    <main className="page-shell">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">HEALTH RECORDS & Rx</p>
          <h1 className="page-title">Digital Prescriptions</h1>
          <p className="page-lead">
            Access your doctor consultation notes, verified digital prescriptions, and prescribed medicine schedules.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/appointments" className="button button-quiet">
            My Appointments
          </Link>
          <Link href="/doctors" className="button button-primary">
            New Consultation
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card directory-state">Loading your medical records…</div>
      ) : error ? (
        <div className="card directory-state directory-error">
          <h2>Could not load records</h2>
          <p>{error}</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card directory-state">
          <span className="empty-calendar" aria-hidden="true">℞</span>
          <h2>No prescriptions recorded yet</h2>
          <p>
            When a doctor completes your consultation and issues a medical prescription, it will appear here permanently for quick reference.
          </p>
          <Link href="/doctors" className="button button-primary">
            Find a doctor to consult
          </Link>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {prescriptions.map((rx) => (
            <article key={rx.id} className="card rx-card">
              <div className="rx-card-header">
                <div>
                  <span className="rx-symbol" aria-hidden="true">℞</span>
                  <span className="rx-tag">Official Clinical Rx</span>
                </div>
                <span className="rx-date">
                  {new Date(rx.created_at || rx.appointment_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="rx-card-body">
                <h2 className="rx-doctor-name">{rx.doctor_name}</h2>
                <p className="rx-department">{rx.category_name || "Specialist Care"}</p>

                <div className="rx-diagnosis-box">
                  <span className="label">Primary Diagnosis:</span>
                  <p className="diagnosis-text">{rx.diagnosis}</p>
                </div>

                {rx.medicines && rx.medicines.length > 0 && (
                  <div className="rx-medicines-preview">
                    <span className="label">Prescribed Medications ({rx.medicines.length}):</span>
                    <ul className="meds-list">
                      {rx.medicines.slice(0, 3).map((m, i) => (
                        <li key={i}>
                          <strong>{m.medicine_name}</strong>
                          <span className="med-timing"> · {m.dosage} ({m.frequency})</span>
                        </li>
                      ))}
                      {rx.medicines.length > 3 && (
                        <li className="meds-more">+{rx.medicines.length - 3} more medications</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rx-card-footer">
                <Link
                  href={`/prescriptions/${rx.appointment_id}`}
                  className="button button-primary rx-view-btn"
                >
                  View Full Rx & Print ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
