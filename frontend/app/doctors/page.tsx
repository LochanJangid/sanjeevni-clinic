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
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading doctors...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            Our Doctors
          </h1>

          <p className="text-gray-600 mt-2">
            Choose a doctor and book your appointment.
          </p>
        </div>

        {doctors.length === 0 ? (
          <p>No doctors available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl p-6 shadow-sm border"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-5">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>

                <h2 className="text-xl font-semibold">
                  {doctor.name}
                </h2>

                <p className="text-gray-500 mt-2">
                  Category ID: {doctor.category_id}
                </p>

                <p className="font-medium mt-4">
                  Consultation: ₹{doctor.fees}
                </p>

                <Link
                  href={`/appointments/book?doctor_id=${doctor.id}`}
                  className="block text-center mt-6 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
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