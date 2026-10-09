"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  Heart,
  MapPin,
  Pill,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  TrendingUp,
  User,
  Video,
} from "lucide-react";
import { parseTokenClaims } from "../../lib/auth";

interface Appointment {
  id: number;
  doctor_name: string;
  category_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  fees: number;
  opd_token_number?: number | null;
  opd_token_status?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function loadOverview() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const payload = parseTokenClaims(token);
        if (!payload?.sub) throw new Error("Your session is invalid. Please sign in again.");
        setUsername(payload.username || "Patient");

        const response = await fetch(`${API_URL}/appointments/user/${payload.sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const problem = await response.json().catch(() => ({}));
          throw new Error(problem.detail || "We could not load your appointments.");
        }

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : "Unable to load your overview.");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
    setMounted(true);
  }, []);

  const upcoming = mounted
    ? appointments.find((appointment) => {
        return (
          appointment.status !== "cancelled" &&
          appointment.status !== "completed" &&
          new Date(`${appointment.appointment_date}T${appointment.appointment_time}`).getTime() >= Date.now() - 3600000
        );
      })
    : null;

  return (
    <main className="min-h-screen bg-white text-[#4B5563] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-10 shadow-sm border border-blue-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-bold uppercase tracking-wider border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Verified Patient Health Record · ABHA Compliant</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Welcome back, {username || "Patient"}
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Your medical history, confirmed appointments, prescriptions, and diagnostic lab reports in one unified clinical portal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/doctors"
                className="px-5 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Book New Appointment</span>
              </Link>
              <Link
                href="/prescriptions"
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-teal-300" />
                <span>My Prescriptions (Rx)</span>
              </Link>
            </div>
          </div>

          {/* Patient Vitals Biomarker Snapshot */}
          <div className="mt-8 pt-6 border-t border-blue-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/vitals"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition group"
            >
              <div className="flex items-center justify-between text-blue-150 text-xs">
                <span className="font-semibold text-blue-100">Blood Pressure</span>
                <Heart className="w-3.5 h-3.5 text-rose-300" />
              </div>
              <strong className="text-lg font-black text-white block mt-1">120 / 80</strong>
              <span className="text-[10px] text-teal-300 font-semibold">Normal · Recorded OPD</span>
            </Link>

            <Link
              href="/vitals"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition group"
            >
              <div className="flex items-center justify-between text-blue-150 text-xs">
                <span className="font-semibold text-blue-100">Blood Glucose</span>
                <Activity className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <strong className="text-lg font-black text-white block mt-1">96 mg/dL</strong>
              <span className="text-[10px] text-teal-300 font-semibold">Fasting Normal</span>
            </Link>

            <Link
              href="/vitals"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition group"
            >
              <div className="flex items-center justify-between text-blue-150 text-xs">
                <span className="font-semibold text-blue-100">Pulse Oxygen (SpO2)</span>
                <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <strong className="text-lg font-black text-white block mt-1">99 %</strong>
              <span className="text-[10px] text-teal-300 font-semibold">Optimal saturation</span>
            </Link>

            <Link
              href="/vitals"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition group"
            >
              <div className="flex items-center justify-between text-blue-150 text-xs">
                <span className="font-semibold text-blue-100">Heart Rate</span>
                <Clock className="w-3.5 h-3.5 text-teal-300" />
              </div>
              <strong className="text-lg font-black text-white block mt-1">72 bpm</strong>
              <span className="text-[10px] text-teal-300 font-semibold">Resting rhythm</span>
            </Link>
          </div>
        </div>

        {/* 2-Column: Next Visit vs Care Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Next Visit Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                  <Calendar className="w-4 h-4 text-[#0D9488]" />
                  <span>Your Next Scheduled Visit</span>
                </div>
                {upcoming && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200">
                    Confirmed
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading upcoming visits…</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {error}
                </div>
              ) : upcoming ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#1E3A8A]">
                        {upcoming.doctor_name}
                      </h3>
                      <p className="text-xs font-semibold text-[#0D9488]">
                        {upcoming.category_name || "Specialist Consultant"}
                      </p>
                      <p className="text-xs text-[#4B5563] mt-1">
                        Consultation Fee: ₹{upcoming.fees} · Entry 74 GST Exempt
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-base shrink-0">
                      👨‍⚕️
                    </div>
                  </div>

                  {/* Visit Time Badge */}
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#0D9488] block tracking-wider">
                      Appointment Date &amp; Slot
                    </span>
                    <strong className="text-base font-bold text-[#1E3A8A] block">
                      {new Date(`${upcoming.appointment_date}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {upcoming.appointment_time}
                    </strong>
                    <div className="flex items-center gap-1.5 text-xs text-[#4B5563] pt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0D9488]" />
                      <span>OPD Cabin 102 · Ground Floor Consultation Wing</span>
                    </div>
                  </div>

                  {/* Quick OPD Token Notice */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Waiting Hall Token</span>
                      {upcoming.opd_token_number ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
                          <strong className="text-[#1E3A8A] font-mono text-sm">
                            OPD Token #{upcoming.opd_token_number}
                          </strong>
                        </div>
                      ) : (
                        <strong className="text-amber-700 text-xs font-semibold block mt-0.5">
                          Pending Admin Approval
                        </strong>
                      )}
                    </div>
                    <Link
                      href="/opd-queue"
                      className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                    >
                      <span>Check Live TV</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/appointments/${upcoming.id}`}
                      className="py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs text-center shadow-sm transition"
                    >
                      View Visit Details
                    </Link>
                    <Link
                      href={`/appointments/${upcoming.id}?pay=phonepe`}
                      className="py-2.5 px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold text-xs text-center shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pay PhonePe QR</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E3A8A]">
                      No Upcoming Appointments
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-1 max-w-xs mx-auto">
                      Schedule a 30-minute consultation with any specialist or take our AI Symptom Triage.
                    </p>
                  </div>
                  <Link
                    href="/doctors"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition"
                  >
                    <span>Browse Doctors</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Portals & Quick Actions Grid */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] block">
                  Patient Health Records &amp; Services
                </span>
                <h2 className="text-xl font-bold text-[#1E3A8A] mt-1">
                  Clinical Portals &amp; Digital Health Tools
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Link
                  href="/symptom-checker"
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#0D9488] hover:bg-teal-50/20 transition flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
                    ⚡
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#1E3A8A] block group-hover:text-[#0D9488]">
                      AI Symptom Triage
                    </strong>
                    <span className="text-[11px] text-[#4B5563] leading-tight block mt-0.5">
                      Evidence-based symptom evaluation &amp; specialty guidance
                    </span>
                  </div>
                </Link>

                <Link
                  href="/lab-reports"
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#1E3A8A] hover:bg-blue-50/20 transition flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
                    🔬
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#1E3A8A] block group-hover:text-[#0D9488]">
                      Diagnostic Lab Reports
                    </strong>
                    <span className="text-[11px] text-[#4B5563] leading-tight block mt-0.5">
                      Pathology results, blood panels, and reference values
                    </span>
                  </div>
                </Link>

                <Link
                  href="/prescriptions"
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#0D9488] hover:bg-teal-50/20 transition flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
                    ℞
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#1E3A8A] block group-hover:text-[#0D9488]">
                      Digital Prescriptions (Rx)
                    </strong>
                    <span className="text-[11px] text-[#4B5563] leading-tight block mt-0.5">
                      Doctor dosage instructions, drug timing &amp; refill notes
                    </span>
                  </div>
                </Link>

                <Link
                  href="/billing"
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#1E3A8A] hover:bg-blue-50/20 transition flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
                    ₹
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#1E3A8A] block group-hover:text-[#0D9488]">
                      Billing &amp; GST Receipts
                    </strong>
                    <span className="text-[11px] text-[#4B5563] leading-tight block mt-0.5">
                      PhonePe UPI invoices, GST receipts, and transaction history
                    </span>
                  </div>
                </Link>

                <Link
                  href="/teleconsult"
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#0D9488] hover:bg-teal-50/20 transition flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
                    📹
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#1E3A8A] block group-hover:text-[#0D9488]">
                      Video Teleconsultation
                    </strong>
                    <span className="text-[11px] text-[#4B5563] leading-tight block mt-0.5">
                      Virtual doctor chamber with WebRTC encrypted video
                    </span>
                  </div>
                </Link>

                <Link
                  href="/opd-queue"
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#0D9488] hover:bg-teal-50/20 transition flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
                    📺
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#1E3A8A] block group-hover:text-[#0D9488]">
                      Live OPD Waiting Room TV
                    </strong>
                    <span className="text-[11px] text-[#4B5563] leading-tight block mt-0.5">
                      Real-time token marquee &amp; cabin arrival announcements
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointment History Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] block">
                Appointment History
              </span>
              <h2 className="text-xl font-bold text-[#1E3A8A] mt-1">
                Your Past &amp; Active Consultations
              </h2>
            </div>
            <Link
              href="/appointments"
              className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading visit history…</div>
          ) : appointments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {appointments.slice(0, 4).map((apt) => (
                <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center font-black">
                      {new Date(apt.appointment_date).toLocaleDateString(undefined, { day: "2-digit" })}
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-[#1E3A8A] block">
                        {apt.doctor_name}
                      </strong>
                      <span className="text-[#4B5563]">
                        {new Date(`${apt.appointment_date}T12:00:00`).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · "}
                        {apt.appointment_time} · ₹{apt.fees}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        apt.status === "completed"
                          ? "bg-gray-100 text-[#4B5563] border border-gray-200"
                          : apt.status === "cancelled"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-teal-50 text-[#0D9488] border border-teal-200"
                      }`}
                    >
                      {apt.status || "Booked"}
                    </span>
                    <Link
                      href={`/appointments/${apt.id}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#1E3A8A] font-semibold border border-gray-200 transition"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              No previous appointments found. When you book, your history will appear here.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
