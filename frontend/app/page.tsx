"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  Bed,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FlaskConical,
  HeartHandshake,
  Layers,
  Lock,
  MessageCircle,
  Phone,
  PhoneCall,
  Pill,
  Play,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Tv,
  UserCheck,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { loginAsDemoRole } from "../lib/auth";
import { getStoredHospitalName, setStoredHospitalName } from "../lib/hospital";

export default function SellingSitePage() {
  const router = useRouter();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [hospitalInput, setHospitalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | "admin">("admin");
  const [isLaunching, setIsLaunching] = useState(false);

  function handleOpenDemoModal(preferredRole?: "patient" | "doctor" | "admin") {
    if (preferredRole) setSelectedRole(preferredRole);
    setHospitalInput(getStoredHospitalName());
    setShowDemoModal(true);
  }

  async function handleLaunchDemo(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsLaunching(true);

    const nameToSave = hospitalInput.trim() || "City Care Multi-Specialty Hospital";
    setStoredHospitalName(nameToSave);

    try {
      await loginAsDemoRole(selectedRole);
      setShowDemoModal(false);
      if (selectedRole === "admin") router.push("/admin");
      else if (selectedRole === "doctor") router.push("/doctor-portal");
      else router.push("/dashboard");
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. EXECUTIVE COMMERCIAL HERO BANNER */}
      <section className="relative overflow-hidden pt-12 pb-24 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/40">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Executive Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest shadow-inner mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Turnkey Hospital &amp; Medical Clinic Operating System For Sale</span>
          </div>

          {/* Main Sales Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight">
            The Complete Digital System for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Modern Hospitals &amp; Clinics
            </span>
          </h1>

          {/* Pitch Subtitle mentioning Lochan Jangid */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Architected and engineered by <strong className="text-white font-bold">Lochan Jangid</strong>. A full-scale, production-ready operating system delivering complete <strong>Patient</strong>, <strong>Doctor</strong>, and <strong>Hospital Admin</strong> portals, live OPD TV waiting room signage, PhonePe direct doctor settlement, and inpatient bed tracking.
          </p>

          {/* Core Interactive Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleOpenDemoModal("admin")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Building2 className="w-5 h-5 text-slate-950" />
              <span>Launch Live Demo with Your Hospital Name</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/hospital-plans"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 backdrop-blur-md transition"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>View All Plans &amp; Commercial Features</span>
            </Link>
          </div>

          {/* Live Trust Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 block">
                3 Unified Portals
              </span>
              <strong className="text-xl font-black text-white">Patient · Doctor · Admin</strong>
              <p className="text-xs text-slate-400 mt-0.5">Role-based security</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
              <span className="text-[11px] uppercase tracking-wider font-bold text-purple-400 block">
                PhonePe Settlement
              </span>
              <strong className="text-xl font-black text-white">0% Fee Direct Pay</strong>
              <p className="text-xs text-slate-400 mt-0.5">Instant GST receipt voucher</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
              <span className="text-[11px] uppercase tracking-wider font-bold text-teal-400 block">
                Hospital Operations
              </span>
              <strong className="text-xl font-black text-white">OPD TV &amp; IPD Beds</strong>
              <p className="text-xs text-slate-400 mt-0.5">Live queue chime + ICU beds</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
              <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 block">
                Deployment Model
              </span>
              <strong className="text-xl font-black text-white">Turnkey / Source Code</strong>
              <p className="text-xs text-slate-400 mt-0.5">Custom branding &amp; hosting</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE THREE FOUNDATIONAL ECOSYSTEMS (PATIENT, DOCTOR, ADMIN) */}
      <section className="py-20 border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              The 3 Integrated Sub-Systems
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              One Unified Core Powering Every Healthcare Role
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Everything your hospital needs without juggling 5 different subscriptions. Built specifically for high-efficiency clinical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* System 1: Patient System */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between hover:border-emerald-500/40 transition group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🧑‍🦱
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">
                  Sub-System 01
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Patient Portal &amp; Care App</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  24/7 frictionless patient booking with 30-minute slot availability, conflict locking, WhatsApp confirmations, digital prescription downloads, and longitudinal vital sign history.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Real-time doctor appointment booking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>PhonePe UPI scan &amp; pay with tax receipt</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Digital Rx prescriptions &amp; lab results access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Multilingual support in English &amp; Hindi</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenDemoModal("patient")}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Experience Patient Portal Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* System 2: Doctor System */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between hover:border-teal-500/40 transition group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🩺
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-teal-400">
                  Sub-System 02
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Doctor Clinical Workstation</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Dedicated physician console designed for speed. Open active queue visits, issue standardized digital Rx prescriptions with dosage calculators, log diagnosis notes, and initiate teleconsultations.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Live OPD token callout &amp; patient queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>1-Click Digital Rx with official clinic seal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Individual availability &amp; slot customization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Direct PhonePe mobile fee settlement</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenDemoModal("doctor")}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Experience Doctor Workspace Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                </button>
              </div>
            </div>

            {/* System 3: Hospital Admin System */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between hover:border-cyan-500/40 transition group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  🏥
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400">
                  Sub-System 03
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Hospital Executive ERP</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Complete executive command. Monitor hospital gross revenues, track departmental financial performance, manage staff permissions, oversee ICU bed availability, and manage OPD wait times.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Hospital financial ledger &amp; GST invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Bed &amp; Ward Inpatient census management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Central Pharmacy inventory &amp; reorder alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Comprehensive clinic audit trails &amp; analytics</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenDemoModal("admin")}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-800/60 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Experience Hospital Admin Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISUAL FEATURE SHOWCASE WITH DETAILED PHOTOS / MOCKUPS */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Visual Product Modules
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Every Operational Capability Explained
            </h2>
            <p className="text-sm text-slate-400">
              Explore the exact features and visual interfaces your clinic or hospital will receive upon deployment.
            </p>
          </div>

          {/* Module 1: Live OPD Waiting Room TV Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <Tv className="w-4 h-4" />
                <span>Feature 01 · Waiting Hall Automation</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Live OPD Waiting Room TV Display with Audio Chimes
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Eliminate waiting room chaos and patient anxiety. Any smart TV or monitor mounted in the waiting hall opens the live screen. As doctors click &ldquo;Call Next Patient&rdquo; in their chamber, token numbers update automatically accompanied by an audible arrival chime.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-time token dispatch with Doctor Cabin destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Text-to-speech audio announcement in waiting room</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Next-in-line tokens displayed for optimal patient flow</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/opd-queue"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Preview Live OPD TV Screen →</span>
                </Link>
              </div>
            </div>

            {/* Visual Photo Mockup: OPD TV Screen */}
            <div className="rounded-3xl bg-slate-950 p-6 border-2 border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>LIVE RECEPTION SIGNAGE TV</span>
                </span>
                <span className="font-mono text-slate-400">10:45 AM · AUDIBLE CHIME ON</span>
              </div>

              <div className="mt-6 bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center space-y-4">
                <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
                  Now Calling to Cabin 1
                </span>
                <div className="text-6xl font-black text-emerald-400 font-mono tracking-wider">
                  TOKEN #104
                </div>
                <div className="text-sm font-bold text-white">
                  Pooja Sharma → Dr. Rajesh Sharma (Cardiology)
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Next Up</span>
                  <span className="font-bold text-slate-200">Token #105 · Amit Verma</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Cabin 2</span>
                  <span className="font-bold text-slate-200">Token #102 · Dr. Priya Verma</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: PhonePe UPI Direct Doctor Settlement & Receipts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Visual Photo Mockup: PhonePe QR & Receipt */}
            <div className="rounded-3xl bg-slate-950 p-6 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden order-2 lg:order-1">
              <div className="bg-gradient-to-r from-[#5f259f] to-[#451675] p-4 rounded-2xl text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-white text-[#5f259f] flex items-center justify-center font-black text-sm">
                    पे
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-purple-200 block uppercase">
                      PhonePe Direct Doctor Gateway
                    </span>
                    <strong className="text-sm">Dr. Rajesh Sharma (+91 98765-43211)</strong>
                  </div>
                </div>
                <span className="text-lg font-black font-mono">₹500</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 items-center">
                <div className="bg-white p-3 rounded-xl text-center shadow-md">
                  <div className="w-28 h-28 mx-auto bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-mono">
                    [QR CODE]
                  </div>
                  <span className="text-[10px] font-bold text-purple-950 block mt-1.5">
                    Scan with PhonePe Scanner
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200">
                    <span className="text-[10px] font-bold uppercase block text-purple-400">Official Receipt Issued:</span>
                    <strong className="font-mono text-white text-xs">SJ-REC-00005</strong>
                    <span className="text-[10px] block text-emerald-400 font-semibold mt-0.5">PAID &amp; VERIFIED ✓</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    Settlement: Direct to Doctor PhonePe UPI
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Feature 02 · Zero-Fee Financial Settlement</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                PhonePe Direct Clinician Payment &amp; Electronic Receipts
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Patients scan a dynamic QR code on their mobile device or launch PhonePe directly with one tap. Payments route 100% directly to the doctor&apos;s verified mobile number or clinic account with zero intermediary commissions, issuing an authentic GST-compliant printable medical receipt instantly.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Doctor verified phone number &amp; UPI VPA mapping</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1-Tap deep link opening PhonePe mobile app directly</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Official printable receipt with authenticated division seal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module 3: Hospital Bed & Ward Management (IPD) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Bed className="w-4 h-4" />
                <span>Feature 03 · Inpatient Operations</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Inpatient (IPD) Bed Occupancy Tracker &amp; Census
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete real-time ward census for hospital admissions. Track bed availability across Intensive Care Units (ICU), Semi-Private suites, General Wards, and Daycare with one-click patient admission, oxygen status indicators, and discharge workflows.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Visual ward matrix with color-coded bed status</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Oxygen pipeline &amp; ventilator tracking per bed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant nurse admission and billing discharge coordination</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/beds"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Explore Inpatient Bed Census →</span>
                </Link>
              </div>
            </div>

            {/* Visual Photo Mockup: Bed Census */}
            <div className="rounded-3xl bg-slate-950 p-6 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-bold text-white">HOSPITAL BED OCCUPANCY CENSUS</span>
                <span className="text-emerald-400 font-bold">14 / 20 Available (70%)</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ICU-01</span>
                  <span className="text-emerald-400 font-bold text-sm block my-0.5">VACANT</span>
                  <span className="text-[9px] text-slate-400">O2 Active · Sanitized</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ICU-02</span>
                  <span className="text-rose-400 font-bold text-sm block my-0.5">OCCUPIED</span>
                  <span className="text-[9px] text-slate-400">Patient #1092</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">GW-101</span>
                  <span className="text-emerald-400 font-bold text-sm block my-0.5">VACANT</span>
                  <span className="text-[9px] text-slate-400">General Ward</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module 4: Digital Prescription (Rx) & Teleconsultation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Visual Photo Mockup: Digital Rx */}
            <div className="rounded-3xl bg-slate-950 p-6 border-2 border-slate-800 shadow-2xl relative overflow-hidden order-2 lg:order-1">
              <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="font-bold text-emerald-900 text-sm">
                    SANJEEVNI CLINIC · DIGITAL Rx
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Rx #9281-CONF</span>
                </div>

                <div className="mt-3 flex items-start justify-between text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Attending Doctor:</span>
                    <strong className="text-slate-900">Dr. Rajesh Sharma (MD)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Patient:</span>
                    <strong className="text-slate-900">Rahul Sharma (Age 34)</strong>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="font-mono font-bold text-sm text-emerald-800 mb-1">℞ Prescribed Medications:</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <strong>1. Paracetamol 650mg</strong>
                      <span>1 Tab · Thrice Daily (After Food)</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>2. Amoxicillin 500mg</strong>
                      <span>1 Cap · Twice Daily (5 Days)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Digitally Authorized EHR</span>
                  <span className="text-emerald-700 font-bold">Official Clinic Stamp ✓</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Feature 04 · Clinical Documentation</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Digital Prescriptions (Rx) &amp; WebRTC Teleconsultation
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Doctors generate beautiful branded digital prescriptions in seconds. Medication frequencies and diagnostic instructions are recorded and instantly accessible in the patient app. Doctors can also conduct encrypted WebRTC video teleconsultations with live timer and vitals monitoring.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Standardized medication dosing with instructions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant PDF download and automated WhatsApp dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>In-browser WebRTC encrypted video clinic with notes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMMERCIAL PACKAGING & SOURCE CODE LICENSING */}
      <section className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Commercial Delivery
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              What Lochan Jangid Delivers to Hospital Owners
            </h2>
            <p className="text-sm text-slate-400">
              Choose between complete turnkey cloud SaaS deployment, custom white-label branding, or full source code buyout for your medical network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-2xl">📦</span>
              <h4 className="text-base font-bold text-white">Full Source Code</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Production-grade Next.js 16 frontend + FastAPI Python backend + Neon PostgreSQL schema and tests.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-2xl">🏷️</span>
              <h4 className="text-base font-bold text-white">White-Label Branding</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rebranded with your hospital name, official logo, custom domain, and customized receipt letterheads.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-2xl">☁️</span>
              <h4 className="text-base font-bold text-white">Turnkey Deployment</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deployed on your AWS, DigitalOcean, or private on-premise local hospital intranet server with SSL.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-2xl">🤝</span>
              <h4 className="text-base font-bold text-white">Direct Support</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated engineering support from Lochan Jangid with feature customizations and staff training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ABOUT THE DEVELOPER — LOCHAN JANGID SECTION */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900/90 border-2 border-emerald-500/30 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shrink-0">
                LJ
              </div>

              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Lead Healthcare Software Architect</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Meet the Developer · Lochan Jangid
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  I architect mission-critical healthcare software designed specifically to eliminate administrative drag for doctors and hospital owners. This platform solves the exact operational pain points of modern polyclinics: double-booking prevention, 0% fee PhonePe direct doctor settlement, live OPD TV queues, and transparent inpatient bed tracking.
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button
                    type="button"
                    onClick={() => handleOpenDemoModal("admin")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition"
                  >
                    <span>Test Interactive System Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    href="/hospital-plans"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                  >
                    <span>Inspect Commercial Plans &amp; ROI</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE REBRANDING & DEMO LAUNCH MODAL */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl my-8 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>Interactive White-Label Simulation</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Enter Your Hospital or Clinic Name
              </h3>
              <p className="text-xs text-slate-400">
                The entire operating system will automatically rebrand to your facility name so you can see exactly how it looks for your hospital.
              </p>
            </div>

            <form onSubmit={handleLaunchDemo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Hospital / Clinic Name:
                </label>
                <input
                  type="text"
                  required
                  value={hospitalInput}
                  onChange={(e) => setHospitalInput(e.target.value)}
                  placeholder="e.g. Apollo Multi-Specialty Hospital"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Quick Name Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Apex Multi-Specialty Hospital",
                    "Apollo Health City",
                    "Max Care Clinic",
                    "Fortis Heart Pavilion",
                    "LifeLine Nursing Home",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHospitalInput(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choose Role */}
              <div className="pt-2">
                <label className="block font-bold text-slate-300 mb-1.5">
                  Choose Initial Demo Role to Experience:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("admin")}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedRole === "admin"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="block text-base mb-0.5">🏥</span>
                    <span className="text-[11px]">Hospital Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("doctor")}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedRole === "doctor"
                        ? "bg-teal-950 border-teal-500 text-teal-300 font-bold"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="block text-base mb-0.5">🩺</span>
                    <span className="text-[11px]">Doctor Console</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("patient")}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedRole === "patient"
                        ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="block text-base mb-0.5">🧑‍🦱</span>
                    <span className="text-[11px]">Patient App</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLaunching}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl transition disabled:opacity-50"
                >
                  {isLaunching ? "Rebranding & Loading System…" : `Launch Demo as "${hospitalInput || "Hospital"}" →`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
