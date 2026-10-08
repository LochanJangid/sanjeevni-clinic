"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getAuthToken } from "../../../lib/auth";

interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionDetails {
  id: number;
  appointment_id: number;
  doctor_id: number;
  user_id: number;
  doctor_name: string;
  category_name: string;
  qualification: string;
  clinic_address: string;
  patient_name: string;
  patient_mobile: string;
  patient_email: string;
  diagnosis: string;
  instructions: string;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
  medicines: Medicine[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function PrescriptionDetailContent() {
  const params = useParams<{ id: string }>();
  const appointmentId = params?.id;
  const [rx, setRx] = useState<PrescriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRx() {
      const token = getAuthToken();
      if (!token) {
        setError("Please sign in to view this prescription.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/prescriptions/appointment/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Could not retrieve prescription.");
        const data = await res.json();
        if (!data.prescription) {
          setError("No prescription has been issued for this appointment yet.");
        } else {
          setRx(data.prescription);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load prescription.");
      } finally {
        setLoading(false);
      }
    }

    if (appointmentId) loadRx();
  }, [appointmentId]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="card directory-state">Loading official medical prescription…</div>
      </main>
    );
  }

  if (error || !rx) {
    return (
      <main className="page-shell">
        <div className="card directory-state directory-error">
          <h2>Prescription Unavailable</h2>
          <p>{error || "Prescription details could not be found."}</p>
          <Link href="/appointments" className="button button-quiet">
            Return to Appointments
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell rx-view-shell">
      {/* Top action bar (hidden on print) */}
      <div className="rx-action-bar no-print">
        <Link href="/prescriptions" className="back-link">
          ← Back to Prescriptions
        </Link>
        <div className="action-buttons">
          <Link href={`/appointments/${rx.appointment_id}`} className="button button-quiet">
            View Visit Details
          </Link>
          <button type="button" onClick={handlePrint} className="button button-primary">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Official Prescription Paper Document */}
      <div className="card rx-paper-document">
        {/* Clinic Header */}
        <header className="rx-doc-header">
          <div className="rx-clinic-brand">
            <span className="rx-brand-cross">+</span>
            <div>
              <h1 className="rx-clinic-title">SANJEEVNI CLINIC</h1>
              <p className="rx-clinic-sub">Integrated Healthcare & Multispecialty Center</p>
              <p className="rx-clinic-addr">Metro Wing, Healthcare Corridor · Ph: +91 98765 43210</p>
            </div>
          </div>
          <div className="rx-doc-meta">
            <span className="rx-doc-badge">DIGITAL Rx</span>
            <p><strong>Rx #:</strong> SANJ-RX-{rx.id.toString().padStart(5, "0")}</p>
            <p><strong>Date:</strong> {new Date(rx.created_at).toLocaleDateString()}</p>
          </div>
        </header>

        <div className="rx-doc-divider" />

        {/* Doctor and Patient Blocks */}
        <div className="rx-two-col">
          <div className="rx-doctor-col">
            <p className="rx-col-title">CONSULTING CLINICIAN</p>
            <p className="rx-doc-name">{rx.doctor_name}</p>
            <p className="rx-doc-qual">{rx.qualification}</p>
            <p className="rx-doc-dept">{rx.category_name} Specialist</p>
            <p className="rx-doc-loc">{rx.clinic_address}</p>
          </div>

          <div className="rx-patient-col">
            <p className="rx-col-title">PATIENT DETAILS</p>
            <p className="rx-pat-name">{rx.patient_name}</p>
            <p className="rx-pat-detail">Contact: {rx.patient_mobile || "On File"}</p>
            <p className="rx-pat-detail">Visit Date: {rx.appointment_date} at {rx.appointment_time}</p>
            <p className="rx-pat-detail">Appointment Ref: #{rx.appointment_id}</p>
          </div>
        </div>

        <div className="rx-doc-divider" />

        {/* Clinical Diagnosis */}
        <div className="rx-diagnosis-section">
          <h2 className="rx-section-label">CLINICAL DIAGNOSIS & OBSERVATIONS</h2>
          <div className="rx-diagnosis-content">
            {rx.diagnosis}
          </div>
        </div>

        {/* Rx Symbol & Medication Schedule */}
        <div className="rx-medications-section">
          <div className="rx-symbol-heading">
            <span className="rx-big-symbol" aria-hidden="true">℞</span>
            <span className="rx-section-label">PRESCRIBED MEDICATIONS</span>
          </div>

          <table className="rx-meds-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine / Formulation</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Directions</th>
              </tr>
            </thead>
            <tbody>
              {rx.medicines.map((med, index) => (
                <tr key={med.id || index}>
                  <td>{index + 1}</td>
                  <td className="med-name-cell"><strong>{med.medicine_name}</strong></td>
                  <td>{med.dosage || "1 Unit"}</td>
                  <td><span className="rx-freq-tag">{med.frequency}</span></td>
                  <td>{med.duration}</td>
                  <td className="med-inst-cell">{med.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Doctor Instructions & Advice */}
        {rx.instructions && (
          <div className="rx-instructions-section">
            <h2 className="rx-section-label">DOCTOR&apos;S ADVICE & LIFESTYLE GUIDANCE</h2>
            <p className="rx-instructions-text">{rx.instructions}</p>
          </div>
        )}

        {/* Signoff & Verification Stamp */}
        <div className="rx-doc-footer">
          <div className="rx-disclaimer">
            <p>
              * This is a digitally validated prescription generated under Sanjeevni Clinic OS.
              Dispense only in accordance with relevant medical and pharmaceutical regulations.
            </p>
          </div>
          <div className="rx-signature-block">
            <div className="rx-stamp">
              <span className="stamp-clinic">SANJEEVNI CLINIC</span>
              <span className="stamp-verified">VERIFIED DIGITAL Rx</span>
            </div>
            <p className="sig-name">{rx.doctor_name}</p>
            <p className="sig-title">Attending Specialist</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PrescriptionDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card directory-state">Loading official prescription…</div>
        </main>
      }
    >
      <PrescriptionDetailContent />
    </Suspense>
  );
}
