"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  HeartHandshake,
  MapPin,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tv,
  Users,
  CreditCard,
  Video,
  UserCheck,
  ChevronRight,
  ClipboardList,
  LogIn,
  KeyRound,
  LayoutDashboard,
  Pill,
} from "lucide-react";
import { getAuthClaims, TokenClaims } from "../lib/auth";

export default function SanjeevniClinicHomePage() {
  const [claims, setClaims] = useState<TokenClaims | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<number>(1);

  useEffect(() => {
    setMounted(true);
    const updateClaims = () => {
      setClaims(getAuthClaims());
    };
    updateClaims();
    window.addEventListener("storage", updateClaims);
    window.addEventListener("sanjeevni-session-change", updateClaims);
    return () => {
      window.removeEventListener("storage", updateClaims);
      window.removeEventListener("sanjeevni-session-change", updateClaims);
    };
  }, []);

  const departments = [
    {
      id: 1,
      name: "Cardiology & Vascular Sciences",
      doctor: "Dr. Rajesh Sharma",
      degrees: "MD, DM (Cardiology), FACC",
      cabin: "Cabin 01 · Ground Floor",
      fee: "₹800",
      hours: "09:00 AM – 01:00 PM & 05:00 PM – 08:00 PM",
      description:
        "Comprehensive cardiac evaluation, 12-lead ECG, 2D Echocardiography, lipid management, and hypertension control protocols.",
      tag: "Chief of Cardiology",
    },
    {
      id: 2,
      name: "Dermatology & Aesthetic Medicine",
      doctor: "Dr. Priya Verma",
      degrees: "MD (Dermatology, Venereology & Leprosy)",
      cabin: "Cabin 02 · First Floor",
      fee: "₹650",
      hours: "10:00 AM – 02:00 PM & 05:00 PM – 07:30 PM",
      description:
        "Evidence-based clinical dermatology, allergy screening, acne therapeutics, pediatric dermatology, and cutaneous lasers.",
      tag: "Consultant Dermatologist",
    },
    {
      id: 3,
      name: "General Medicine & Diabetology",
      doctor: "Dr. Amit Gupta",
      degrees: "MBBS, MD (Internal Medicine)",
      cabin: "Cabin 03 · Ground Floor",
      fee: "₹500",
      hours: "09:00 AM – 01:00 PM & 04:30 PM – 08:00 PM",
      description:
        "Acute viral fever management, diabetes glycemic optimization, geriatric health assessments, and comprehensive preventive health checkups.",
      tag: "Senior Physician",
    },
    {
      id: 4,
      name: "Neurology & Neuro-Physiology",
      doctor: "Dr. Anita Roy",
      degrees: "MD, DM (Neurology)",
      cabin: "Cabin 04 · Second Floor",
      fee: "₹900",
      hours: "10:30 AM – 02:30 PM",
      description:
        "Specialized diagnosis and treatment for migraines, epilepsy, neuropathies, stroke rehabilitation, and movement disorders.",
      tag: "Consultant Neurologist",
    },
    {
      id: 5,
      name: "Pediatrics & Child Wellness",
      doctor: "Dr. Vikram Sethi",
      degrees: "MBBS, MD (Pediatrics), DCH",
      cabin: "Cabin 05 · First Floor",
      fee: "₹600",
      hours: "09:30 AM – 01:30 PM & 05:00 PM – 08:00 PM",
      description:
        "Newborn care, growth milestone tracking, nutritional counseling, acute childhood infections, and complete UIP immunization schedules.",
      tag: "Senior Pediatrician",
    },
    {
      id: 6,
      name: "Orthopedics & Joint Reconstruction",
      doctor: "Dr. Meera Iyer",
      degrees: "MS (Orthopedics), MCh (Ortho)",
      cabin: "Cabin 06 · Ground Floor",
      fee: "₹750",
      hours: "10:00 AM – 02:00 PM & 05:30 PM – 08:30 PM",
      description:
        "Joint arthroplasty, fracture trauma management, sports ligament rehabilitation, osteopenia management, and spine evaluations.",
      tag: "Orthopedic Surgeon",
    },
  ];

  const activeDept = departments.find((d) => d.id === selectedDepartment) || departments[0];

  const role = mounted ? claims?.role : null;
  const username = mounted ? claims?.username : null;

  return (
    <main className="min-h-screen bg-white text-[#4B5563] selection:bg-[#0D9488] selection:text-white">
      {/* 1. TOP LIVE CLINICAL DISPATCH BAR */}
      <div className="bg-slate-50 border-b border-gray-200 text-xs py-2.5 px-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#0D9488] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
              {role === "admin" ? (
                <span>SANJEEVNI CLINIC · EXECUTIVE GOVERNANCE ACTIVE</span>
              ) : role === "doctor" ? (
                <span>SANJEEVNI CLINIC · PHYSICIAN WORKSTATION ACTIVE</span>
              ) : role === "patient" ? (
                <span>SANJEEVNI CLINIC · PATIENT CARE PORTAL ACTIVE</span>
              ) : (
                <span>SANJEEVNI CLINIC · OPD CONSULTATIONS ACTIVE</span>
              )}
            </span>
            <span className="hidden md:inline text-gray-300">|</span>
            <span className="hidden md:inline text-[#4B5563]">
              {role === "admin" ? (
                <span>Logged in as Administrator: <strong className="text-gray-800 font-semibold">{username || "lochan"}</strong></span>
              ) : role === "doctor" ? (
                <span>Attending Clinician: <strong className="text-gray-800 font-semibold">Dr. {username || "Physician"}</strong></span>
              ) : role === "patient" ? (
                <span>Patient Account: <strong className="text-gray-800 font-semibold">{username || "Registered Patient"}</strong></span>
              ) : (
                <span>Hours: <strong className="text-gray-700">09:00 AM – 01:00 PM &amp; 05:00 PM – 08:00 PM</strong></span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[#4B5563] flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>24x7 Trauma Line:</span>
              <a href="tel:+919999108108" className="text-red-600 font-bold hover:underline">
                +91 9999-108-108
              </a>
            </span>
            <Link
              href="/chat"
              className="px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 hover:bg-teal-100 text-xs font-bold transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#0D9488]" />
              <span>AI Assistant</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. ROLE-SPECIFIC HERO SECTION */}

      {/* CASE A: ADMIN ROLE */}
      {role === "admin" && (
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>ADMINISTRATIVE EXECUTIVE COCKPIT · SUPERUSER CONTROL</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1E3A8A] max-w-4xl mx-auto leading-tight">
              Hospital Governance &amp; Executive Command
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#4B5563] max-w-3xl mx-auto leading-relaxed">
              Welcome, Administrator <strong>{username || "Lochan"}</strong>. Manage clinical doctor appointments, issue secure physician access keys, monitor real-time bed census, supervise OPD queue chimes, and track hospital payments.
            </p>

            {/* Admin Primary Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-sm shadow-md transition-all"
              >
                <LayoutDashboard className="w-5 h-5 text-white" />
                <span>Open ERP Console</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/opd-queue"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all"
              >
                <Tv className="w-5 h-5 text-teal-300" />
                <span>OPD TV Signage</span>
              </Link>

              <Link
                href="/beds"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-sm border border-gray-300 shadow-sm transition"
              >
                <Bed className="w-5 h-5 text-[#0D9488]" />
                <span>Inpatient Bed Census</span>
              </Link>

              <Link
                href="/billing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-sm border border-gray-300 shadow-sm transition"
              >
                <CreditCard className="w-5 h-5 text-[#0D9488]" />
                <span>Revenue &amp; Payments (7240499165)</span>
              </Link>
            </div>

            {/* Admin Metric Cards */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto text-left">
              <Link
                href="/admin"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Staff Credentialing
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Doctor Access Keys
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Appoint doctors &amp; generate keys</p>
              </Link>

              <Link
                href="/billing"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Admin Destination
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  7240499165-2@ybl
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Direct PhonePe collections</p>
              </Link>

              <Link
                href="/beds"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Inpatient Telemetry
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  20 Hospital Beds
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">ICU, Semi-Private, General</p>
              </Link>

              <Link
                href="/opd-queue"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Waiting Hall Audio
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Live OPD Queue
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Web Audio cabin chimes</p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CASE B: DOCTOR ROLE */}
      {role === "doctor" && (
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-bold uppercase tracking-wider mb-6">
              <Stethoscope className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>PHYSICIAN CLINICAL WORKSTATION · ACTIVE CLINICIAN</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1E3A8A] max-w-4xl mx-auto leading-tight">
              Doctor Chamber Cockpit &amp; Clinical Encounters
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#4B5563] max-w-3xl mx-auto leading-relaxed">
              Welcome, <strong>Dr. {username || "Physician"}</strong>. Review today&apos;s scheduled appointments, summon waiting hall patients with audible chimes, complete active consult sessions, and conduct virtual teleconsultations.
            </p>

            {/* Doctor Primary Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/doctor-portal"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-sm shadow-md transition-all"
              >
                <Stethoscope className="w-5 h-5 text-white" />
                <span>Open Doctor Chamber Cockpit</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/opd-queue"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all"
              >
                <Tv className="w-5 h-5 text-teal-300" />
                <span>Call Patient (OPD TV 🔔)</span>
              </Link>

              <Link
                href="/teleconsult"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-sm border border-gray-300 shadow-sm transition"
              >
                <Video className="w-5 h-5 text-[#0D9488]" />
                <span>Video Teleconsultation</span>
              </Link>

              <Link
                href="/prescriptions"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-sm border border-gray-300 shadow-sm transition"
              >
                <FileText className="w-5 h-5 text-[#0D9488]" />
                <span>Digital Prescriptions</span>
              </Link>
            </div>

            {/* Doctor Quick Access Cards */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto text-left">
              <Link
                href="/doctor-portal"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Scheduled Visits
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Patient Roster
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Consultation queue &amp; history</p>
              </Link>

              <Link
                href="/opd-queue"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Waiting Hall Chime
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  OPD Audio Call
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Summon patient &amp; complete session</p>
              </Link>

              <Link
                href="/teleconsult"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Telemedicine
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Virtual Chambers
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">HD video &amp; live notes dock</p>
              </Link>

              <Link
                href="/lab-reports"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Diagnostics
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  EHR Lab Results
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">CBC, HbA1c, Lipid panels</p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CASE C: PATIENT ROLE */}
      {role === "patient" && (
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-bold uppercase tracking-wider mb-6">
              <UserCheck className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>PATIENT PERSONAL HEALTH PORTAL · SANJEEVNI CLINIC</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1E3A8A] max-w-4xl mx-auto leading-tight">
              Your Health, Appointments &amp; Medical Records
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#4B5563] max-w-3xl mx-auto leading-relaxed">
              Welcome back, <strong>{username || "Patient"}</strong>. Book verified doctor consultations, check live waiting hall OPD tokens, view pathology diagnostic results, and download digitally signed prescriptions.
            </p>

            {/* Patient Primary Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-sm shadow-md transition-all"
              >
                <Calendar className="w-5 h-5 text-white" />
                <span>Book Doctor Consultation</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/appointments"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all"
              >
                <Clock className="w-5 h-5 text-teal-300" />
                <span>My Appointments</span>
              </Link>

              <Link
                href="/lab-reports"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-sm border border-gray-300 shadow-sm transition"
              >
                <FlaskConical className="w-5 h-5 text-[#0D9488]" />
                <span>Diagnostic Lab Reports</span>
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-sm border border-gray-300 shadow-sm transition"
              >
                <MessageSquare className="w-5 h-5 text-[#0D9488]" />
                <span>Ask AI Health Assistant</span>
              </Link>
            </div>

            {/* Patient Services Cards */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto text-left">
              <Link
                href="/doctors"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Expert Clinicians
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Book Chamber Slot
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">6 multi-specialty departments</p>
              </Link>

              <Link
                href="/opd-queue"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Waiting Hall Telemetry
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Live OPD Queue TV
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Track token call status live</p>
              </Link>

              <Link
                href="/prescriptions"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Medical Records
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Digital Prescriptions
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">Prescription history &amp; dosage</p>
              </Link>

              <Link
                href="/teleconsult"
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#0D9488] hover:shadow-md transition group"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Virtual Care
                </span>
                <strong className="text-xl font-black text-[#1E3A8A] mt-1 block group-hover:text-[#0D9488] transition">
                  Video Consultations
                </strong>
                <p className="text-xs text-[#4B5563] mt-1">HD video chamber with doctor</p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CASE D: GUEST / UNAUTHENTICATED HERO */}
      {!role && (
        <section className="relative overflow-hidden pt-20 pb-28 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-8">
              <Building2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Sanjeevni Super-Specialty Medical Pavilion · Registered Clinic</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1E3A8A] max-w-5xl mx-auto leading-tight">
              High-Precision Clinical Medicine &amp; Compassionate Care
            </h1>

            <p className="mt-6 text-base sm:text-xl text-[#4B5563] max-w-3xl mx-auto leading-relaxed">
              Welcome to Sanjeevni Clinic. Offering expert multi-specialty physician chambers, live OPD token queues, 24/7 emergency trauma care, in-house digital prescriptions, and automated laboratory diagnostics.
            </p>

            {/* Guest Primary Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/doctors"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="w-5 h-5 text-white" />
                <span>Book Doctor Consultation</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition"
              >
                <LogIn className="w-4 h-4 text-teal-300" />
                <span>Patient / Doctor Sign In</span>
              </Link>

              <Link
                href="/emergency"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm border border-red-200 transition"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Emergency SOS</span>
              </Link>
            </div>

            {/* Hospital Telemetry Cards */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto text-left">
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Specialist Clinicians
                </span>
                <strong className="text-2xl font-black text-[#1E3A8A] mt-1 block">6 Chambers</strong>
                <p className="text-xs text-[#4B5563] mt-1">Cardiology, Neuro, Ortho &amp; Peds</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Waiting Hall Audio TV
                </span>
                <strong className="text-2xl font-black text-[#1E3A8A] mt-1 block">Live OPD Queue</strong>
                <p className="text-xs text-[#4B5563] mt-1">Automated cabin calling chime</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Inpatient Wards
                </span>
                <strong className="text-2xl font-black text-[#1E3A8A] mt-1 block">20 Hospital Beds</strong>
                <p className="text-xs text-[#4B5563] mt-1">ICU, Semi-Private &amp; Daycare</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0D9488] block">
                  Diagnostics &amp; Lab
                </span>
                <strong className="text-2xl font-black text-[#1E3A8A] mt-1 block">NABL-Standard</strong>
                <p className="text-xs text-[#4B5563] mt-1">Automated digital pathology</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. CLINICAL DEPARTMENTS & SPECIALIST DOCTORS */}
      <section className="py-24 border-b border-gray-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0D9488] bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
              Clinical Specializations
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E3A8A] mt-4 tracking-tight">
              Expert Multi-Disciplinary Medical Faculty
            </h2>
            <p className="text-sm text-[#4B5563] mt-2.5">
              Select a clinical department to explore consulting hours, specialist credentials, and book an immediate appointment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Department Navigation List */}
            <div className="lg:col-span-5 space-y-3">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                    selectedDepartment === dept.id
                      ? "bg-white border-[#0D9488] ring-2 ring-[#0D9488]/20 shadow-md text-[#1E3A8A]"
                      : "bg-white border-gray-200 hover:border-gray-300 text-[#4B5563]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <strong className={`text-sm font-bold block ${selectedDepartment === dept.id ? "text-[#1E3A8A]" : "text-gray-800"}`}>
                      {dept.name}
                    </strong>
                    <span className="text-xs text-[#4B5563]">{dept.doctor}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0D9488] shrink-0 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                    {dept.fee}
                  </span>
                </button>
              ))}
            </div>

            {/* Department Detailed Card */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div>
                  <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider block">
                    {activeDept.tag}
                  </span>
                  <h3 className="text-2xl font-black text-[#1E3A8A] mt-1">{activeDept.doctor}</h3>
                  <p className="text-xs text-[#4B5563] mt-0.5 font-medium">{activeDept.degrees}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Consultation Fee</span>
                  <span className="text-2xl font-black text-[#0D9488] font-mono">{activeDept.fee}</span>
                </div>
              </div>

              <div className="py-6 space-y-5">
                <p className="text-sm text-[#4B5563] leading-relaxed">
                  {activeDept.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Consultation Chamber</span>
                    <strong className="text-[#1E3A8A] mt-1 block text-sm">{activeDept.cabin}</strong>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">OPD Schedule</span>
                    <strong className="text-[#1E3A8A] mt-1 block text-sm">{activeDept.hours}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs text-[#4B5563] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  <span>30-minute guaranteed consultation slots</span>
                </span>
                <Link
                  href="/doctors"
                  className="px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                >
                  <span>Book with {activeDept.doctor.split(" ")[1]}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOSPITAL OPERATIONAL MODULES */}
      <section className="py-24 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0D9488] bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
              Clinical Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E3A8A] mt-4 tracking-tight">
              Patient Care &amp; Hospital Operations
            </h2>
            <p className="text-sm text-[#4B5563] mt-2.5">
              Explore key hospital services and digital patient care touchpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold mb-4 border border-blue-100">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E3A8A]">Live OPD Waiting Hall TV</h3>
                <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                  Real-time token marquee broadcasted in the clinic waiting hall with audible arrival chimes as doctors call patients into their chambers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  href="/opd-queue"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:underline"
                >
                  <span>View Waiting Hall Signage →</span>
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold mb-4 border border-teal-100">
                  <Bed className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E3A8A]">Inpatient Bed Occupancy (IPD)</h3>
                <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                  Monitored hospital ward census across ICU suites, Semi-Private rooms, and General Ward with oxygen telemetry and nurse station records.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  href="/beds"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:underline"
                >
                  <span>Check Bed Availability →</span>
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold mb-4 border border-blue-100">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E3A8A]">Diagnostic Pathology &amp; Lab EHR</h3>
                <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">
                  In-house clinical pathology results for CBC blood counts, Lipid profile, HbA1c, and Thyroid panels with automated abnormal range flags.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  href="/lab-reports"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:underline"
                >
                  <span>Access Lab Reports →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 24x7 EMERGENCY & TRAUMA FACILITY */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                <span>24x7 Critical Care &amp; Resuscitation</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-red-950">
                Emergency Trauma &amp; Ambulance Command
              </h3>
              <p className="text-xs sm:text-sm text-red-900 max-w-xl leading-relaxed">
                Equipped with emergency oxygen pipelines, crash carts, cardiac defibrillators, and advanced life-support (ALS) ambulance fleet on standby.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="tel:+919999108108"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition"
              >
                <PhoneCall className="w-4 h-4 text-white animate-pulse" />
                <span>Call +91 9999-108-108</span>
              </a>

              <Link
                href="/emergency"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-red-900 font-bold text-sm border border-red-200 transition shadow-sm"
              >
                <span>Emergency Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
