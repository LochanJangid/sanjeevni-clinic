"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Info,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  UserCheck,
  X,
} from "lucide-react";

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

// Specialty visual theming map
const SPECIALTY_META: Record<
  string,
  { icon: string; bg: string; text: string; border: string; desc: string }
> = {
  Cardiology: {
    icon: "🫀",
    bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    text: "text-rose-700",
    border: "border-rose-200 dark:border-rose-800",
    desc: "Heart care, blood pressure management, ECG & echocardiogram",
  },
  Orthopedics: {
    icon: "🦴",
    bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    text: "text-amber-700",
    border: "border-amber-200 dark:border-amber-800",
    desc: "Joint replacements, spine care, fracture casting & arthritis",
  },
  Pediatrics: {
    icon: "👶",
    bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    text: "text-sky-700",
    border: "border-sky-200 dark:border-sky-800",
    desc: "Childhood immunizations, pediatric growth & acute fever",
  },
  Dermatology: {
    icon: "✨",
    bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    text: "text-purple-700",
    border: "border-purple-200 dark:border-purple-800",
    desc: "Skin allergies, acne therapy, hair care & diagnostic biopsy",
  },
  "General Medicine": {
    icon: "🩺",
    bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    text: "text-emerald-700",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Diabetes control, viral illnesses, hypertension & comprehensive health checks",
  },
  Neurology: {
    icon: "🧠",
    bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    text: "text-indigo-700",
    border: "border-indigo-200 dark:border-indigo-800",
    desc: "Migraines, neurological evaluations, neuropathy & stroke recovery",
  },
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "exp" | "fee">("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeBioDoctor, setActiveBioDoctor] = useState<Doctor | null>(null);

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

  const sortedDoctors = useMemo(() => {
    const list = [...doctors];
    if (sortBy === "exp") {
      return list.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
    }
    if (sortBy === "fee") {
      return list.sort((a, b) => a.fees - b.fees);
    }
    return list;
  }, [doctors, sortBy]);

  return (
    <main className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 text-[#4B5563]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Hero */}
        <div className="bg-[#1E3A8A] text-white rounded-3xl p-8 sm:p-12 shadow-sm border border-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-bold uppercase tracking-wider border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>Verified Clinical Faculty &amp; Consultants</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Find the Right Specialist for Your Care
              </h1>
              <p className="text-blue-100 text-sm sm:base leading-relaxed">
                Connect with certified clinicians across major specialties. Book verified 30-minute consultation slots with real-time schedule conflict prevention and instant WhatsApp &amp; SMS confirmations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/appointments"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-teal-300" />
                <span>My Appointments</span>
              </Link>
              <Link
                href="/symptom-checker"
                className="px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-black text-xs shadow-sm transition flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-white" />
                <span>AI Symptom Triage</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-teal-300 font-bold uppercase text-[10px] tracking-wider block">Specialties</span>
              <strong className="text-base font-black text-white">{categories.length || 6} Departments</strong>
            </div>
            <div>
              <span className="text-teal-300 font-bold uppercase text-[10px] tracking-wider block">OPD Slots</span>
              <strong className="text-base font-black text-white">30-Min Realtime Slots</strong>
            </div>
            <div>
              <span className="text-teal-300 font-bold uppercase text-[10px] tracking-wider block">Payment Options</span>
              <strong className="text-base font-black text-white">PhonePe UPI &amp; Cash Counter</strong>
            </div>
            <div>
              <span className="text-teal-300 font-bold uppercase text-[10px] tracking-wider block">Consultation Tax</span>
              <strong className="text-base font-black text-white">0% GST (Entry 74 Exempt)</strong>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by doctor name, qualification (MD, MS, DM), or treatment..."
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 border border-gray-200 text-sm text-[#1E3A8A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#4B5563] shrink-0">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2.5 px-3 rounded-xl bg-slate-50 border border-gray-200 text-xs font-semibold text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              >
                <option value="featured">Featured Clinicians</option>
                <option value="exp">Most Experience First</option>
                <option value="fee">Consultation Fee (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Filter by Department
              </span>
              {selectedCatId !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedCatId(null)}
                  className="text-xs font-semibold text-[#0D9488] hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCatId(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCatId === null
                    ? "bg-[#0D9488] text-white shadow-sm"
                    : "bg-slate-100 text-[#4B5563] hover:bg-slate-200"
                }`}
              >
                <span>🏥 All Departments</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                  {doctors.length}
                </span>
              </button>

              {categories.map((cat) => {
                const meta = SPECIALTY_META[cat.category_name];
                const isActive = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCatId(isActive ? null : cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm"
                        : "bg-white text-[#4B5563] border-gray-200 hover:border-gray-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{meta?.icon || "🩺"}</span>
                    <span>{cat.category_name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-[#4B5563]">
                      {cat.doctor_count || 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Directory Content States */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto mb-4 animate-spin">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">
              Loading Verified Clinician Directory…
            </h3>
            <p className="text-xs text-[#4B5563] mt-1">
              Synchronizing active outpatient clinic schedules and consultation slots.
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
            <h3 className="text-base font-bold text-rose-800">
              Unable to load clinician directory
            </h3>
            <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : sortedDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-[#4B5563] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1E3A8A]">
              No specialists match your search criteria
            </h3>
            <p className="text-sm text-[#4B5563] mt-1 max-w-md mx-auto">
              We couldn&apos;t find doctors matching &ldquo;{search}&rdquo;. Try clearing filters or searching for general terms like &ldquo;Cardiology&rdquo; or &ldquo;MBBS&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCatId(null);
                setSearch("");
              }}
              className="mt-6 px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Grid of Doctors */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDoctors.map((doctor) => {
              const meta = SPECIALTY_META[doctor.category_name] || {
                icon: "🩺",
                bg: "bg-teal-50 text-[#0D9488]",
                text: "text-[#0D9488]",
                border: "border-teal-200",
                desc: "Consultant Physician",
              };
              const initials = doctor.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("");

              return (
                <article
                  key={doctor.id}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#0D9488] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0D9488]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verified Clinician</span>
                          </div>
                          <h2 className="text-lg font-black text-[#1E3A8A] tracking-tight">
                            {doctor.name}
                          </h2>
                          <p className="text-xs text-[#4B5563] font-medium">
                            {doctor.qualification}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#4B5563] shrink-0">
                        {doctor.experience_years}y exp
                      </span>
                    </div>

                    {/* Specialty Pill & Description */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.bg} ${meta.border}`}
                        >
                          <span>{meta.icon}</span>
                          <span>{doctor.category_name}</span>
                        </span>

                        <div className="flex items-center gap-1 text-xs text-[#4B5563]">
                          <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
                          <span className="text-[11px] font-semibold text-[#0D9488]">
                            Available Today
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                        {doctor.about || meta.desc}
                      </p>
                    </div>

                    {/* Hospital Chamber & Location */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-gray-100 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{doctor.clinic_address || "OPD Cabin 102 · Ground Floor East Wing"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Daily 09:00 AM – 05:00 PM · 30m slots</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Fee & Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                          Consultation Fee
                        </span>
                        <div className="flex items-baseline gap-1">
                          <strong className="text-xl font-black text-[#1E3A8A]">
                            ₹{doctor.fees}
                          </strong>
                          <span className="text-[10px] text-gray-400 font-medium">/ 30 min visit</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        PhonePe QR &amp; Cash Desk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveBioDoctor(doctor)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#4B5563] font-bold text-xs transition text-center border border-gray-200"
                      >
                        Doctor Bio &amp; Reviews
                      </button>

                      <Link
                        href={`/appointments/book?doctor_id=${doctor.id}`}
                        className="py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Book Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Informative Guidance Banner */}
        <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[#4B5563]">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              <Info className="w-4 h-4" />
              <span>Transparent Hospital Consultation Policy</span>
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">
              Direct Doctor Settlement with Zero Platform Convenience Fee
            </h3>
            <p className="text-xs text-[#4B5563] max-w-2xl leading-relaxed">
              Appointments booked on this portal reserve your live slot directly in the doctor&apos;s active OPD queue. Pay your consultation fee via PhonePe Dynamic UPI QR on arrival or at the reception desk. Consultations are exempt from Goods &amp; Services Tax under statutory Entry 74, Notification 12/2017-CT(R).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/opd-queue"
              className="px-5 py-3 rounded-xl bg-white text-[#1E3A8A] font-bold text-xs border border-gray-200 hover:border-[#0D9488] hover:text-[#0D9488] transition text-center shadow-sm"
            >
              View Live OPD Queue TV
            </Link>
            <a
              href="tel:+919999108108"
              className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>24x7 Emergency SOS</span>
            </a>
          </div>
        </div>
      </div>

      {/* Doctor Bio Modal */}
      {activeBioDoctor && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setActiveBioDoctor(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveBioDoctor(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#0D9488] text-white font-black text-2xl flex items-center justify-center shadow-md">
                {activeBioDoctor.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("")}
              </div>
              <div>
                <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider block">
                  {activeBioDoctor.category_name}
                </span>
                <h3 className="text-xl font-black text-[#1E3A8A]">
                  {activeBioDoctor.name}
                </h3>
                <p className="text-xs text-[#4B5563]">
                  {activeBioDoctor.qualification} · {activeBioDoctor.experience_years} Years Experience
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Clinical Background &amp; Profile
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {activeBioDoctor.about ||
                  `${activeBioDoctor.name} is a senior consultant in ${activeBioDoctor.category_name} with over ${activeBioDoctor.experience_years} years of inpatient and outpatient clinical experience, specializing in evidence-based patient management and chronic care coordination.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Consultation Fee</span>
                <strong className="text-base font-black text-[#1E3A8A]">₹{activeBioDoctor.fees}</strong>
                <span className="text-[10px] text-gray-500 block">Per 30-min slot</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">OPD Chamber</span>
                <strong className="text-sm font-bold text-[#1E3A8A] truncate block">
                  {activeBioDoctor.clinic_address || "Chamber 102"}
                </strong>
                <span className="text-[10px] text-[#0D9488] font-semibold block">Ground Floor OPD Wing</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveBioDoctor(null)}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#4B5563] font-bold text-xs transition border border-gray-200"
              >
                Close Profile
              </button>
              <Link
                href={`/appointments/book?doctor_id=${activeBioDoctor.id}`}
                className="w-1/2 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-black text-xs transition text-center shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Book Slot Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
