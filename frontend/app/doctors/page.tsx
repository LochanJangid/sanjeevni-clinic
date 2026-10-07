"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  fees: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch(
          `${API_URL}/doctors/get_doctors`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch doctors");
        }

        const data = await response.json();
        setDoctors(data);
      } catch (error) {
        setError("Unable to load doctors");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-2xl border bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Loading doctors...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-semibold text-red-700">Unable to load doctors</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-blue-600">Healthcare team</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Our Doctors
            </h1>
          </div>

          <Link
            href="/appointments"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            View appointments
          </Link>
        </div>

        {doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-lg font-medium text-gray-700">No doctors available right now.</p>
            <p className="mt-2 text-sm text-gray-500">Please check back later for new consultation slots.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
                    👨‍⚕️
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Available
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">{doctor.name}</h2>
                  <p className="text-sm text-gray-500">Specialty ID: {doctor.category_id}</p>
                  <p className="text-sm text-gray-500">Consultation fee</p>
                  <p className="text-lg font-semibold text-gray-900">₹{doctor.fees}</p>
                </div>

                <div className="mt-6 grid gap-2 text-sm text-gray-600">
                  <p>• Flexible clinic availability</p>
                  <p>• Follow-up support</p>
                  <p>• Digital consultation records</p>
                </div>

                <Link
                  href={`/appointments/book?doctor_id=${doctor.id}`}
                  className="mt-6 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Book Appointment
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}