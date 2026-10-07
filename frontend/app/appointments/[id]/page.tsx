"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { parseTokenClaims } from "../../../lib/auth";

interface Appointment {
  id: number;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  fees: number;
}

interface AppointmentListItem {
  id: number;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  fees: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function AppointmentDetailContent() {
  const params = useParams<{ id: string }>();
  const appointmentId = Number(params.id);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointment() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const claims = parseTokenClaims(token);
        if (!claims?.sub) throw new Error("Your session is invalid. Please sign in again.");
        const response = await fetch(`${API_URL}/appointments/user/${claims.sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unable to fetch appointments");

        const data: unknown = await response.json();
        const match = Array.isArray(data)
          ? data.find(
              (item: unknown): item is AppointmentListItem =>
                typeof item === "object"
                && item !== null
                && "id" in item
                && Number(item.id) === appointmentId,
            )
          : null;
        setAppointment(match ?? null);
      } catch {
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    }

    loadAppointment();
  }, [appointmentId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="rounded-2xl border bg-white px-6 py-5 shadow-sm">Loading appointment details...</p>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-semibold text-red-700">Appointment not found</p>
          <p className="mt-2 text-sm text-red-600">Your appointment details are unavailable right now.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/appointments" className="text-blue-600">← Back to appointments</Link>

        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-blue-600">Appointment</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{appointment.doctor_name}</h1>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{appointment.status}</span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Date</p>
              <p className="mt-1 font-semibold text-gray-900">{appointment.appointment_date}</p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Time</p>
              <p className="mt-1 font-semibold text-gray-900">{appointment.appointment_time}</p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Consultation fee</p>
              <p className="mt-1 font-semibold text-gray-900">₹{appointment.fees}</p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="mt-1 font-semibold text-gray-900">{appointment.status}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/appointments" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-200 hover:text-blue-700">
              View all appointments
            </Link>
            <Link href="/doctors" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700">
              Book another visit
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AppointmentDetailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-gray-50"><p className="rounded-2xl border bg-white px-6 py-5 shadow-sm">Loading appointment details...</p></main>}>
      <AppointmentDetailContent />
    </Suspense>
  );
}
