"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  fees: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDoctors() {
      try {
        const response = await fetch(`${API_URL}/doctors/get_doctors`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Doctor directory is temporarily unavailable.");

        const data = await response.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (problem) {
        if (problem instanceof DOMException && problem.name === "AbortError") return;
        setError(problem instanceof Error ? problem.message : "Unable to load the doctor directory.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchDoctors();
    return () => controller.abort();
  }, []);

  return (
    <main className="page-shell">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">SANJEEVNI CLINIC</p>
          <h1 className="page-title">Find a doctor for your care.</h1>
          <p className="page-lead">
            Review the doctors currently listed with the clinic and choose an available appointment time.
          </p>
        </div>
        <Link href="/appointments" className="button button-quiet">My appointments</Link>
      </div>

      {loading ? (
        <div className="directory-state card" role="status">Loading the doctor directory…</div>
      ) : error ? (
        <div className="directory-state card directory-error" role="alert">
          <h2>We couldn’t load the doctor directory.</h2>
          <p>{error}</p>
          <button className="button button-quiet" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="directory-state card">
          <span className="empty-calendar" aria-hidden="true">+</span>
          <h2>No doctors are listed right now.</h2>
          <p>Please check back later or contact the clinic for assistance.</p>
        </div>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article className="doctor-card card" key={doctor.id}>
              <div className="doctor-card-top">
                <span className="doctor-initials" aria-hidden="true">
                  {doctor.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
                </span>
                <span className="doctor-label">Clinic doctor</span>
              </div>

              <h2>{doctor.name}</h2>
              <p className="doctor-specialty">Care category {doctor.category_id}</p>

              <div className="doctor-fee">
                <span>Consultation fee</span>
                <strong>₹{doctor.fees}</strong>
              </div>

              <div className="doctor-card-actions">
                <Link className="doctor-profile-button" href={`/doctors/${doctor.id}`}>View details</Link>
                <Link className="doctor-book-button" href={`/appointments/book?doctor_id=${doctor.id}`}>Choose a time <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="directory-note">
        Appointment times shown are generated from the clinic’s current scheduling rules. Availability can change before a booking is confirmed.
      </p>
    </main>
  );
}
