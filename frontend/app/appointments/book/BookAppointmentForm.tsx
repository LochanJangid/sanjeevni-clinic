"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  HeartPulse,
  Info,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { parseTokenClaims } from "../../../lib/auth";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  fees: number;
  qualification?: string;
  experience_years?: number;
  about?: string;
  clinic_address?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookAppointmentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doctorIdParam = searchParams.get("doctor_id");
  const doctorId = Number(doctorIdParam);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paymentPreference, setPaymentPreference] = useState<"phonepe" | "counter">("phonepe");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [message, setMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const today = getLocalDateString(0);
      setMinDate(today);
      if (!date) setDate(today);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!Number.isSafeInteger(doctorId) || doctorId < 1) return;

    const controller = new AbortController();
    async function loadDoctor() {
      try {
        const response = await fetch(`${API_URL}/doctors/get_doctor/${doctorId}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Doctor not found.");
        setDoctor(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setBookingError(error instanceof Error ? error.message : "Unable to load doctor details.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingDoctor(false);
      }
    }

    loadDoctor();
    return () => controller.abort();
  }, [doctorId]);

  useEffect(() => {
    if (!date || !doctorId) return;

    const controller = new AbortController();
    async function loadSlots() {
      setLoadingSlots(true);
      setSlotError("");
      setTime("");
      try {
        const response = await fetch(
          `${API_URL}/doctors/get_doctor_slots/${doctorId}?date=${encodeURIComponent(date)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Could not check available times.");
        setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSlots([]);
          setSlotError(error instanceof Error ? error.message : "Could not check available times.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => controller.abort();
  }, [date, doctorId]);

  // Group slots by time of day
  const groupedSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    for (const s of slots) {
      const hour = parseInt(s.split(":")[0], 10);
      if (hour < 12) {
        morning.push(s);
      } else if (hour < 16) {
        afternoon.push(s);
      } else {
        evening.push(s);
      }
    }

    return { morning, afternoon, evening };
  }, [slots]);

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");
    setMessage("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setBookingError("Please sign in to your patient account to book your consultation.");
      return;
    }

    if (!parseTokenClaims(token)?.sub) {
      localStorage.removeItem("access_token");
      setBookingError("Your session is invalid. Please sign in again.");
      return;
    }

    if (!doctor || !date || !time || !slots.includes(time)) {
      setBookingError("Please choose an appointment date and an available consultation time.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: doctor.id,
          appointment_date: date,
          appointment_time: time,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "We could not confirm this appointment slot.");

      setMessage("Slot successfully reserved! Forwarding to visit confirmation & digital receipt…");
      const appointmentId = data.appointment?.id;
      if (appointmentId) {
        const payQuery = paymentPreference === "phonepe" ? "?pay=phonepe" : "";
        window.setTimeout(() => router.push(`/appointments/${appointmentId}${payQuery}`), 600);
      }
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "We could not confirm this appointment. Please try another time.",
      );
      if (error instanceof Error && error.message.toLowerCase().includes("booked")) {
        setSlots((current) => current.filter((slot) => slot !== time));
        setTime("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!doctorIdParam || !Number.isSafeInteger(doctorId) || doctorId < 1) {
    return (
      <main className="min-h-screen bg-white text-[#4B5563] py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#1E3A8A]">Select a Specialist First</h1>
          <p className="text-sm text-[#4B5563]">
            Please browse our clinician directory to select a doctor and view their live bookable consultation hours.
          </p>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Doctor Directory</span>
          </Link>
        </div>
      </main>
    );
  }

  const todayStr = getLocalDateString(0);
  const tomorrowStr = getLocalDateString(1);
  const dayAfterStr = getLocalDateString(2);

  return (
    <main className="min-h-screen bg-white text-[#4B5563] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#0D9488] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clinician Directory</span>
          </Link>

          <span className="text-xs font-semibold text-gray-400">
            Step 1 of 2: Time Slot &amp; Payment Preference
          </span>
        </div>

        {/* Main 2-Column Booking Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Date & Slot Selection */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Real-Time Appointment Scheduling</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A8A] tracking-tight">
                  Choose Date &amp; Consultation Time
                </h1>
                <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                  Select your preferred day. Real-time availability locks each slot for 30 minutes to eliminate clinic waiting times.
                </p>
              </div>

              <form onSubmit={bookAppointment} className="space-y-6">
                {/* Quick Date Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    1. Select Visit Date
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDate(todayStr)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-center ${
                        date === todayStr
                          ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm"
                          : "bg-slate-50 text-[#4B5563] border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-[10px] font-medium opacity-80">TODAY</span>
                      <span>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDate(tomorrowStr)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-center ${
                        date === tomorrowStr
                          ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm"
                          : "bg-slate-50 text-[#4B5563] border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-[10px] font-medium opacity-80">TOMORROW</span>
                      <span>
                        {new Date(Date.now() + 86400000).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDate(dayAfterStr)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-center ${
                        date === dayAfterStr
                          ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm"
                          : "bg-slate-50 text-[#4B5563] border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-[10px] font-medium opacity-80">IN 2 DAYS</span>
                      <span>
                        {new Date(Date.now() + 172800000).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </button>
                  </div>

                  {/* Manual Date Input */}
                  <div className="pt-2">
                    <input
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-gray-200 text-xs font-semibold text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                      required
                    />
                  </div>
                </div>

                {/* Available Slots Picker */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      2. Choose 30-Minute Time Slot
                    </label>
                    {slots.length > 0 && (
                      <span className="text-xs text-[#0D9488] font-semibold">
                        {slots.length} available slots
                      </span>
                    )}
                  </div>

                  {!date ? (
                    <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-gray-500">
                      Select a date above to check doctor availability.
                    </div>
                  ) : loadingSlots ? (
                    <div className="p-8 rounded-2xl bg-slate-50 text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-gray-500 font-medium">Checking live appointment availability…</p>
                    </div>
                  ) : slotError ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {slotError}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center space-y-1 text-xs">
                      <strong>No available slots for this date</strong>
                      <p className="text-[11px] opacity-80">
                        The doctor&apos;s schedule is full or offline for this day. Please pick another date.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Morning Slots */}
                      {groupedSlots.morning.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            🌅 Morning (09:00 AM – 12:00 PM)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {groupedSlots.morning.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                                  time === slot
                                    ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm scale-102"
                                    : "bg-slate-50 text-[#4B5563] border-gray-200 hover:border-[#0D9488]"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Afternoon Slots */}
                      {groupedSlots.afternoon.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            ☀️ Afternoon (12:00 PM – 04:00 PM)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {groupedSlots.afternoon.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                                  time === slot
                                    ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm scale-102"
                                    : "bg-slate-50 text-[#4B5563] border-gray-200 hover:border-[#0D9488]"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evening Slots */}
                      {groupedSlots.evening.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            🌇 Evening (04:00 PM – 07:00 PM)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {groupedSlots.evening.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                                  time === slot
                                    ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm scale-102"
                                    : "bg-slate-50 text-[#4B5563] border-gray-200 hover:border-[#0D9488]"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment & Settlement Method Preference */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    3. Payment Settlement Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentPreference("phonepe")}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                        paymentPreference === "phonepe"
                          ? "bg-purple-50 border-purple-500 shadow-sm"
                          : "bg-slate-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-black text-xs shrink-0">
                        पे
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#1E3A8A] block">
                          PhonePe Dynamic UPI QR
                        </strong>
                        <span className="text-[11px] text-gray-500">
                          Instant verified GST receipt &amp; automated OPD check-in.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPreference("counter")}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                        paymentPreference === "counter"
                          ? "bg-teal-50 border-[#0D9488] shadow-sm"
                          : "bg-slate-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-black text-xs shrink-0">
                        ₹
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#1E3A8A] block">
                          Hospital Reception Counter
                        </strong>
                        <span className="text-[11px] text-gray-500">
                          Pay cash or POS card when reporting to reception on visit day.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Error and Message Banners */}
                {bookingError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}
                {message && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0D9488]" />
                    <span>{message}</span>
                  </div>
                )}

                {/* Submit Confirmation Button */}
                <button
                  type="submit"
                  disabled={submitting || !time || loadingSlots}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Consultation Booking…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirm Appointment Slot {time ? `(${time})` : ""}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-gray-400 leading-relaxed">
                  🔒 Encrypted transaction under DPDP Act 2023. Real-time slot serialized inside PostgreSQL to prevent overlap.
                </p>
              </form>
            </div>
          </div>

          {/* Right Summary Sidebar Card */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Consultation Summary
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
                  Live Verified
                </span>
              </div>

              {loadingDoctor ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading clinician credentials…</div>
              ) : doctor ? (
                <div className="space-y-4">
                  {/* Doctor Mini-Card */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#0D9488] text-white font-black text-lg flex items-center justify-center shadow-sm">
                      {doctor.name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join("")}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#1E3A8A]">
                        {doctor.name}
                      </h2>
                      <p className="text-xs font-semibold text-[#0D9488]">
                        {doctor.category_name || "Specialist Consultant"}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {doctor.qualification} · {doctor.experience_years}y exp
                      </p>
                    </div>
                  </div>

                  {/* Chamber Location */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-gray-100 text-xs flex items-center gap-2 text-[#4B5563]">
                    <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" />
                    <span>{doctor.clinic_address || "OPD Chamber 102 · Ground Floor East Wing"}</span>
                  </div>

                  {/* Selected Date & Time Pill */}
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#0D9488] block tracking-wider">
                      Selected Slot
                    </span>
                    <strong className="text-sm font-black text-[#1E3A8A] block">
                      {date
                        ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select Date"}
                      {" · "}
                      {time || "Choose Time"}
                    </strong>
                    <span className="text-[11px] text-teal-800 block">
                      Duration: 30-Minute In-Person Consultation
                    </span>
                  </div>

                  {/* Fee Calculation Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Doctor Consultation Fee:</span>
                      <span className="font-semibold text-[#1E3A8A]">₹{doctor.fees}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Platform Booking Convenience Fee:</span>
                      <span className="font-semibold text-[#0D9488]">₹0 (Free)</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Statutory Healthcare GST:</span>
                      <span className="font-semibold text-[#0D9488]">0% (Entry 74 Exempt)</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                      <span className="font-bold text-[#1E3A8A]">Total Amount Due:</span>
                      <strong className="text-2xl font-black text-[#1E3A8A]">
                        ₹{doctor.fees}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Guarantees Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 text-xs space-y-2 text-[#4B5563]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                  <span>Free cancellation up to 2 hours before slot</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Instant SMS token &amp; digital prescription link</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
