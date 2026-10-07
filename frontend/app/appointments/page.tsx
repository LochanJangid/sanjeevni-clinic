"use client";

import { useEffect, useState } from "react";

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor_id: number;
  doctor_name: string;
  fees: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setLoading(false);
          return;
        }

        const payload = JSON.parse(
          atob(token.split(".")[1])
        );

        const userId = payload.sub;

        const response = await fetch(
          `${API_URL}/appointments/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Unable to load appointments");
        }

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading appointments...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold">
          My Appointments
        </h1>

        <p className="text-gray-600 mt-2 mb-8">
          Your upcoming and previous appointments.
        </p>

        {appointments.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8 text-center">
            <p className="text-gray-500">
              No appointments found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >

                <div>
                  <h2 className="text-xl font-semibold">
                    {appointment.doctor_name}
                  </h2>

                  <p className="text-gray-500 mt-1">
                    {appointment.appointment_date}
                    {" • "}
                    {appointment.appointment_time}
                  </p>

                  <p className="mt-2">
                    Consultation: ₹{appointment.fees}
                  </p>
                </div>

                <div>
                  <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm">
                    {appointment.status}
                  </span>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </main>
  );
}