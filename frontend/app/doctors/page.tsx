"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  fees: number;
  qualification: string;
  experience_years: number;
  about: string;
  clinic_address: string;
}

interface Category {
  id: number;
  category_name: string;
  doctor_count: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_URL}/doctors/categories`);
        if (res.ok) setCategories(await res.json());
      } catch {
        // non-blocking
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDoctors() {
      setLoading(true);
      setError("");
      try {
        let url = `${API_URL}/doctors/get_doctors`;
        const params = new URLSearchParams();
        if (selectedCatId) params.append("category_id", String(selectedCatId));
        if (search.trim()) params.append("search", search.trim());
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { signal: controller.signal });
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

    const timer = setTimeout(fetchDoctors, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedCatId, search]);

  return (
    <main className="page-shell">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">SANJEEVNI CLINIC</p>
          <h1 className="page-title">Find a specialist for your care.</h1>
          <p className="page-lead">
            Explore verified clinicians across specialties, check their credentials, and book bookable 30-minute consultation slots.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/appointments" className="button button-quiet">
            My appointments
          </Link>
          <Link href="/prescriptions" className="button button-quiet">
            My Prescriptions (Rx)
          </Link>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="directory-filters card mb-8">
        <div className="filter-search-box">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder="Search by doctor name, specialty, or qualification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-search-input"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>

        <div className="category-pills">
          <button
            type="button"
            className={`category-pill ${selectedCatId === null ? "active" : ""}`}
            onClick={() => setSelectedCatId(null)}
          >
            All Departments
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${selectedCatId === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCatId(cat.id)}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="directory-state card" role="status">
          Loading specialists…
        </div>
      ) : error ? (
        <div className="directory-state card directory-error" role="alert">
          <h2>We couldn&apos;t load the doctor directory.</h2>
          <p>{error}</p>
          <button className="button button-quiet" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="directory-state card">
          <span className="empty-calendar" aria-hidden="true">+</span>
          <h2>No doctors found matching criteria.</h2>
          <p>Try clearing your search or switching categories.</p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setSelectedCatId(null);
              setSearch("");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article className="doctor-card card" key={doctor.id}>
              <div className="doctor-card-top">
                <span className="doctor-initials" aria-hidden="true">
                  {doctor.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")}
                </span>
                <span className="doctor-label">{doctor.experience_years} yrs exp</span>
              </div>

              <h2>{doctor.name}</h2>
              <p className="doctor-specialty">{doctor.category_name || "Specialist Consultant"}</p>
              <p className="doctor-qualification">{doctor.qualification}</p>

              <div className="doctor-fee">
                <span>Consultation fee</span>
                <strong>₹{doctor.fees}</strong>
              </div>

              <div className="doctor-card-actions">
                <Link className="doctor-profile-button" href={`/doctors/${doctor.id}`}>
                  Profile & Info
                </Link>
                <Link
                  className="doctor-book-button"
                  href={`/appointments/book?doctor_id=${doctor.id}`}
                >
                  Book Slot <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="directory-note">
        Appointment slots are dynamically generated based on each doctor&apos;s active weekly schedule and confirmed bookings.
      </p>
    </main>
  );
}
