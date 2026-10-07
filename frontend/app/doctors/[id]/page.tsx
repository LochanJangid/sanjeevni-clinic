"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  fees: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function DoctorDetailContent() {
  const params = useParams<{ id: string }>();
  const doctorId = Number(params.id);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDoctor() {
      if (!doctorId) {
        setLoading(false);
        setError("Doctor not found.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/doctors/get_doctor/${doctorId}`);
        if (!response.ok) throw new Error("Doctor info unavailable");

        const data = await response.json();
        setDoctor(data);
      } catch {
        setError("Doctor info is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctor();
  }, [doctorId]);

  if (loading) {
    return (
      <main className="page-shell">
        <div className="directory-state card" role="status">Loading doctor profile…</div>
      </main>
    );
  }

  if (error || !doctor) {
    return (
      <main className="page-shell">
        <div className="directory-state card directory-error" role="alert">
          <h2>Doctor not available</h2>
          <p>{error || "Please return to the doctor list."}</p>
          <Link className="button button-quiet" href="/doctors">Back to doctors</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="doctor-detail-shell">
        <Link href="/doctors" className="back-link">← Back to doctors</Link>

        <div className="doctor-profile-layout card">
          <div>
            <div className="doctor-detail-avatar" aria-hidden="true">
              {doctor.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
            </div>
            <p className="eyebrow doctor-detail-eyebrow">DOCTOR PROFILE</p>
            <h1 className="doctor-detail-name">{doctor.name}</h1>

            <div className="doctor-detail-info">
              <p><strong>Care category</strong><span>{doctor.category_id}</span></p>
              <p><strong>Consultation fee</strong><span>₹{doctor.fees}</span></p>
            </div>
            <p className="doctor-detail-note">
              Choose a date to see the appointment times currently available for this doctor.
              Doctor biography and qualification details have not been provided by the clinic.
            </p>
          </div>

          <div className="doctor-detail-fee-panel">
            <p className="eyebrow">CONSULTATION</p>
            <p className="doctor-detail-price">₹{doctor.fees}</p>
            <p>The listed amount is the consultation fee.</p>

            <Link
              href={`/appointments/book?doctor_id=${doctor.id}`}
              className="button button-primary"
            >
              Book appointment
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DoctorDetailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-gray-50"><p className="rounded-2xl border bg-white px-6 py-5 shadow-sm">Loading doctor profile...</p></main>}>
      <DoctorDetailContent />
    </Suspense>
  );
}
