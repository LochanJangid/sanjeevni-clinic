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
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="rounded-2xl border bg-white px-6 py-5 shadow-sm">Loading doctor profile...</p>
      </main>
    );
  }

  if (error || !doctor) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-semibold text-red-700">Doctor not available</p>
          <p className="mt-2 text-sm text-red-600">{error || "Please return to the doctor list."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/doctors" className="text-blue-600">← Back to doctors</Link>

        <div className="mt-6 grid gap-6 rounded-2xl border bg-white p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">👨‍⚕️</div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-blue-600">Doctor profile</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{doctor.name}</h1>

            <div className="mt-6 space-y-3 text-gray-600">
              <p><span className="font-medium text-gray-900">Specialty:</span> Category {doctor.category_id}</p>
              <p><span className="font-medium text-gray-900">Consultation fee:</span> ₹{doctor.fees}</p>
              <p><span className="font-medium text-gray-900">Availability:</span> Monday to Saturday</p>
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Experienced medical professional providing patient-centered care, preventive guidance,
                and follow-up support in a calm and trusted clinical environment.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-lg font-semibold text-blue-900">Consultation</h2>
            <p className="mt-3 text-3xl font-bold text-blue-900">₹{doctor.fees}</p>
            <p className="mt-2 text-sm text-blue-700">Includes consultation and follow-up guidance.</p>

            <Link
              href={`/appointments/book?doctor_id=${doctor.id}`}
              className="mt-6 block rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
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
