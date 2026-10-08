"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  Bed,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  FlaskConical,
  HelpCircle,
  Layers,
  Pill,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Tv,
  Users,
  Video,
  X,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  badgeColor?: string;
  isPopular?: boolean;
  highlight?: boolean;
  doctorSeats: string;
  targetAudience: string;
  highlights: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "solo",
    name: "Essential Clinic",
    tagline: "For solo practitioners, private OPD chambers, and pediatric/dental setups",
    monthlyPrice: 1999,
    annualPrice: 1599,
    doctorSeats: "Up to 2 Clinicians",
    targetAudience: "Solo Practices & Chambers",
    badge: "Solo Practitioner",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    highlights: [
      "Dynamic 30-min slot booking engine",
      "Conflict & double-booking prevention lock",
      "Direct Doctor PhonePe UPI QR integration",
      "Basic Patient Directory & medical history",
      "Automated SMS & WhatsApp visit confirmations",
      "Digital prescription (Rx) generator",
      "Cloud patient portal with 24/7 self-booking",
    ],
    cta: "Start 14-Day Free Pilot",
  },
  {
    id: "clinic",
    name: "Multi-Specialty Care",
    tagline: "For established polyclinics, diagnostic nursing centers, and multi-doctor groups",
    monthlyPrice: 4999,
    annualPrice: 3999,
    doctorSeats: "Up to 10 Clinicians",
    targetAudience: "Polyclinics & Centers",
    badge: "MOST POPULAR",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
    isPopular: true,
    highlight: true,
    highlights: [
      "Everything in Essential Clinic, plus:",
      "Up to 10 Doctor accounts with custom schedules",
      "Live OPD Waiting Room TV Screen display & chime",
      "In-House Pharmacy dispensary & stock alerts",
      "Diagnostic Lab Reports EHR repository with ranges",
      "Official GST-compliant medical tax receipts",
      "Patient longitudinal vitals & chronic care charts",
      "Admin revenue analytics by medical specialty",
    ],
    cta: "Scale Your Clinic OS",
  },
  {
    id: "hospital",
    name: "Super-Specialty Hospital",
    tagline: "For 20-100 bed hospitals, surgical nursing homes, and IPD/OPD facilities",
    monthlyPrice: 11999,
    annualPrice: 9599,
    doctorSeats: "Up to 25 Clinicians",
    targetAudience: "Hospitals (20-100 Beds)",
    badge: "HOSPITAL RECOMMENDED",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300 font-bold",
    highlights: [
      "Everything in Multi-Specialty, plus:",
      "Inpatient (IPD) Bed Occupancy Tracker (ICU & Wards)",
      "1-Click Inpatient Admission & Discharge manager",
      "In-App WebRTC Video Teleconsultation suite",
      "24/7 Emergency Ambulance SOS Command center",
      "Vaccine Passport & immunization certificates",
      "Cashier desk, multi-counter cash & UPI balance",
      "Nurse triage workstation & symptom red-flags",
    ],
    cta: "Deploy Hospital OS",
  },
  {
    id: "enterprise",
    name: "Health System Enterprise",
    tagline: "For multi-location hospital chains, medical colleges, and healthcare networks",
    monthlyPrice: 24999,
    annualPrice: 19999,
    doctorSeats: "Unlimited Clinicians",
    targetAudience: "Multi-Branch Networks",
    badge: "ENTERPRISE NETWORK",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    highlights: [
      "Everything in Super-Specialty, plus:",
      "Unlimited Doctor, Nurse & Front-Desk accounts",
      "Multi-Branch centralized administrative oversight",
      "White-label custom domain & hospital branding",
      "ABDM (Ayushman Bharat Digital Mission) sandbox",
      "Dedicated PostgreSQL database cluster & daily backups",
      "White-glove data migration from legacy EMR / Excel",
      "24/7 Priority Clinical Support & 99.99% SLA",
    ],
    cta: "Contact Enterprise Sales",
  },
];

interface FeatureRow {
  name: string;
  desc: string;
  category: "scheduling" | "billing" | "clinical" | "ipd" | "patient" | "security";
  solo: boolean | string;
  clinic: boolean | string;
  hospital: boolean | string;
  enterprise: boolean | string;
}

const FEATURE_MATRIX: FeatureRow[] = [
  // 1. Scheduling & OPD
  {
    name: "Dynamic 30-min Slot Engine",
    desc: "Automated booking slots matching doctor hours",
    category: "scheduling",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Conflict & Double-Booking Lock",
    desc: "PostgreSQL advisory locks preventing simultaneous duplicate visits",
    category: "scheduling",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Doctor Capacity & Seats",
    desc: "Number of active clinician profiles bookable concurrently",
    category: "scheduling",
    solo: "2 Doctors",
    clinic: "10 Doctors",
    hospital: "25 Doctors",
    enterprise: "Unlimited",
  },
  {
    name: "Custom Availability by Day",
    desc: "Individual doctor working hours (e.g. Mon-Sat 09:00 - 17:00)",
    category: "scheduling",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Live OPD Waiting Room TV Display",
    desc: "Digital signage screen with token numbers & cabin destination",
    category: "scheduling",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "OPD Audio Token Chime",
    desc: "Text-to-speech chime announcing next patient in waiting hall",
    category: "scheduling",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },

  // 2. Billing & PhonePe
  {
    name: "PhonePe Direct Doctor UPI QR",
    desc: "Dynamic QR code mapped to doctor phone number for 0-fee settlement",
    category: "billing",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "PhonePe Mobile App Deep-Linking",
    desc: "One-tap direct launch of PhonePe mobile app with prefilled fee",
    category: "billing",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Electronic Medical Payment Receipts",
    desc: "Official printable PDF receipts with doctor phone, UTR & verification stamp",
    category: "billing",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Statutory GST Exemption Clause",
    desc: "Compliant healthcare invoice notation under Notification 12/2017",
    category: "billing",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Multi-Counter Cash & Card Reconciliation",
    desc: "Reception cashier physical cash ledger and discrepancy tracker",
    category: "billing",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Department Financial Analytics",
    desc: "Revenue breakdown and transaction volume by clinical department",
    category: "billing",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },

  // 3. Clinical & EHR
  {
    name: "Digital Prescription (Rx) Generator",
    desc: "Branded digital prescriptions with dosage, frequency, and instructions",
    category: "clinical",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Doctor Consultation Workstation",
    desc: "Specialized clinical dashboard for active appointments & patient queue",
    category: "clinical",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "WebRTC Video Teleconsultation",
    desc: "Encrypted in-browser virtual medical visits with side vitals panel",
    category: "clinical",
    solo: false,
    clinic: false,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Patient Vitals & Chronic Care Charts",
    desc: "Longitudinal tracking of BP, SpO2, heart rate, BMI, and glucose",
    category: "clinical",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Immunization Passport & Records",
    desc: "Vaccination schedule tracker with printable official certificates",
    category: "clinical",
    solo: false,
    clinic: false,
    hospital: true,
    enterprise: true,
  },

  // 4. Inpatient (IPD), Pharmacy & Labs
  {
    name: "Hospital Bed Occupancy Monitor",
    desc: "Real-time occupancy across ICU, Semi-Private, General & Daycare wards",
    category: "ipd",
    solo: false,
    clinic: false,
    hospital: true,
    enterprise: true,
  },
  {
    name: "1-Click Patient Admit & Discharge",
    desc: "Seamless bed allocation, oxygen status tracking, and discharge slips",
    category: "ipd",
    solo: false,
    clinic: false,
    hospital: true,
    enterprise: true,
  },
  {
    name: "In-House Pharmacy Dispensary",
    desc: "Medication stock catalog, reorder alerts, and patient prescription fulfillment",
    category: "ipd",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Diagnostic Laboratory Reports EHR",
    desc: "Pathology tests repository with high/low biological reference range flags",
    category: "ipd",
    solo: false,
    clinic: true,
    hospital: true,
    enterprise: true,
  },

  // 5. Patient Experience & Emergency
  {
    name: "AI Clinical Triage & Red-Flag Checker",
    desc: "Rule-based symptom analyzer detecting cardiac & respiratory emergencies",
    category: "patient",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "24x7 Emergency Ambulance SOS",
    desc: "Ambulance fleet status, rapid driver callout, and BLS first-aid protocols",
    category: "patient",
    solo: false,
    clinic: false,
    hospital: true,
    enterprise: true,
  },
  {
    name: "WhatsApp & SMS Auto-Dispatches",
    desc: "Automated booking, token, and payment notifications to patient mobile",
    category: "patient",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Multilingual Patient Interface",
    desc: "English & Hindi bilingual support for patient convenience",
    category: "patient",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Google / Apple Calendar Sync (.ics)",
    desc: "RFC 5545 calendar export file generation for appointments",
    category: "patient",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },

  // 6. Security, Compliance & Governance
  {
    name: "Role-Based Access Control (RBAC)",
    desc: "Strict separation between Admin, Doctor, Receptionist, and Patient data",
    category: "security",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "HIPAA / NABH Audit Standards",
    desc: "Patient privacy encryption and compliance-ready data audit trails",
    category: "security",
    solo: true,
    clinic: true,
    hospital: true,
    enterprise: true,
  },
  {
    name: "Multi-Branch & Hospital Chains",
    desc: "Single unified administrative view across multiple clinics/branches",
    category: "security",
    solo: false,
    clinic: false,
    hospital: false,
    enterprise: true,
  },
  {
    name: "Custom Hospital Domain & Branding",
    desc: "White-label deployment with hospital custom URL, logo, and letterheads",
    category: "security",
    solo: false,
    clinic: false,
    hospital: "Add-on",
    enterprise: true,
  },
  {
    name: "Dedicated Database Cluster",
    desc: "Isolated PostgreSQL instance with automated daily point-in-time recovery",
    category: "security",
    solo: false,
    clinic: false,
    hospital: false,
    enterprise: true,
  },
  {
    name: "Uptime Service Level Agreement (SLA)",
    desc: "Guaranteed cloud platform availability",
    category: "security",
    solo: "99.5%",
    clinic: "99.9%",
    hospital: "99.95%",
    enterprise: "99.99%",
  },
  {
    name: "Support & Customer Success",
    desc: "Technical and clinical assistance channels",
    category: "security",
    solo: "Email Support",
    clinic: "Priority Chat",
    hospital: "Phone & WhatsApp",
    enterprise: "Dedicated Manager 24/7",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Operational Modules" },
  { id: "scheduling", label: "Scheduling & OPD Queue" },
  { id: "billing", label: "PhonePe Payments & Receipts" },
  { id: "clinical", label: "Clinical EHR & Teleconsult" },
  { id: "ipd", label: "Hospital Beds & Pharmacy" },
  { id: "patient", label: "Patient Portal & Triage" },
  { id: "security", label: "Governance & Enterprise" },
];

export default function PricingAndPlansPage() {
  const [annual, setAnnual] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [pilotSelectedPlan, setPilotSelectedPlan] = useState("clinic");

  // Pilot Form State
  const [pilotForm, setPilotForm] = useState({
    hospitalName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    doctorCount: "5",
  });
  const [pilotSubmitted, setPilotSubmitted] = useState(false);

  // ROI Calculator Interactive States
  const [numDoctors, setNumDoctors] = useState(8);
  const [dailyPatientsPerDoctor, setDailyPatientsPerDoctor] = useState(25);
  const [avgConsultFee, setAvgConsultFee] = useState(600);
  const [currentNoShowRate, setCurrentNoShowRate] = useState(18);

  // ROI Computations
  const monthlyConsultations = numDoctors * dailyPatientsPerDoctor * 25;
  const noShowsRecovered = Math.round(monthlyConsultations * ((currentNoShowRate - 3) / 100));
  const recoveredMonthlyFee = noShowsRecovered * avgConsultFee;
  const extraPatientsFromDigitalSpeed = numDoctors * 2 * 25 * avgConsultFee;
  const totalMonthlyGain = recoveredMonthlyFee + extraPatientsFromDigitalSpeed;
  const totalAnnualGain = totalMonthlyGain * 12;
  const monthlySaaSInvestment = 11999;
  const roiMultiplier = Math.round((totalMonthlyGain / monthlySaaSInvestment) * 10) / 10;

  // Filtered feature matrix
  const filteredFeatures = useMemo(() => {
    return FEATURE_MATRIX.filter((f) => {
      const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  function handleOpenPilot(planId: string) {
    setPilotSelectedPlan(planId);
    setShowPilotModal(true);
  }

  function handlePilotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPilotSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Hospital Owner Banner & Header */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hospital &amp; Clinic Owner Operating Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Commercial Plans Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Healthcare Growth</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate double-booking chaos, enable direct PhonePe UPI clinician settlement, monitor inpatient bed occupancy, broadcast live OPD waiting room queues, and manage clinical prescriptions under one unified Hospital OS.
          </p>

          {/* Trust Highlights Grid */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                Practice Trust
              </span>
              <strong className="text-lg font-black text-white">140+ Facilities</strong>
              <p className="text-[11px] text-slate-400">Hospitals &amp; polyclinics</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
                PhonePe Gateway
              </span>
              <strong className="text-lg font-black text-white">₹4.8 Cr+</strong>
              <p className="text-[11px] text-slate-400">Settled direct to doctors</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-teal-400 block tracking-wider">
                Patient Reliability
              </span>
              <strong className="text-lg font-black text-white">99.99% Uptime</strong>
              <p className="text-[11px] text-slate-400">High availability cluster</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                Compliance Ready
              </span>
              <strong className="text-lg font-black text-white">NABH &amp; ABDM</strong>
              <p className="text-[11px] text-slate-400">Full audit logging</p>
            </div>
          </div>

          {/* Billing Frequency Toggle */}
          <div className="pt-8 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-bold transition ${
                !annual ? "text-white" : "text-slate-400"
              }`}
            >
              Monthly Billing
            </span>

            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className="w-14 h-8 rounded-full bg-emerald-800 p-1 relative transition-colors focus:outline-none"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-6 h-6 rounded-full bg-emerald-400 shadow-md transform transition-transform ${
                  annual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>

            <span
              className={`text-xs font-bold transition flex items-center gap-1.5 ${
                annual ? "text-emerald-300" : "text-slate-400"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                Save 20% + 2 Months Free
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 4 Plan Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between relative shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
                  plan.highlight
                    ? "border-2 border-emerald-500 shadow-emerald-500/10 ring-4 ring-emerald-500/10"
                    : "border-slate-200"
                }`}
              >
                {/* Popular Pill */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                    <span
                      className={`text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border shadow-sm ${plan.badgeColor}`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {plan.targetAudience}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 min-h-[36px] leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Doctor Seats Tag */}
                  <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{plan.doctorSeats}</span>
                  </div>

                  {/* Price */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                        {price.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-500">/month</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {annual
                        ? `Billed ₹${(price * 12).toLocaleString()} annually`
                        : "Billed month-to-month"}
                    </span>
                  </div>

                  {/* Highlights List */}
                  <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
                      Included Capabilities:
                    </span>
                    {plan.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPilot(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
                      plan.highlight
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOSPITAL OWNER INTERACTIVE COMMERCIAL ROI CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-teal-800/40 shadow-2xl text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-teal-800/50">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Calculator className="w-4 h-4 text-teal-400" />
                <span>Executive Financial Model</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Hospital Owner Net Revenue Calculator
              </h2>
              <p className="text-xs sm:text-sm text-teal-200/80 max-w-2xl mt-1">
                Estimate the direct financial return your medical facility unlocks by eliminating patient no-shows with PhonePe advance QR payments and optimizing doctor consultation throughput.
              </p>
            </div>

            {/* Computed Gain Big Card */}
            <div className="bg-white/10 backdrop-blur-md border border-teal-500/30 rounded-2xl p-5 text-right min-w-[280px]">
              <span className="text-[11px] uppercase tracking-wider text-teal-300 font-bold block">
                Estimated Net Revenue Increase
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 mt-1">
                +₹{(totalMonthlyGain / 100000).toFixed(2)} Lakhs
                <span className="text-xs text-slate-300 font-normal"> / mo</span>
              </div>
              <div className="text-xs font-semibold text-teal-200 mt-1">
                ≈ +₹{(totalAnnualGain / 100000).toFixed(2)} Lakhs Added Practice Revenue / Year
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                <span>ROI Multiplier:</span>
                <span className="font-mono text-sm">{roiMultiplier}x SaaS Return</span>
              </div>
            </div>
          </div>

          {/* Calculator Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-200">Practicing Doctors:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{numDoctors}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={numDoctors}
                onChange={(e) => setNumDoctors(Number(e.target.value))}
                className="w-full accent-emerald-400 my-2 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">Active consultation chambers</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-200">Daily OPD / Doctor:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{dailyPatientsPerDoctor}</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                value={dailyPatientsPerDoctor}
                onChange={(e) => setDailyPatientsPerDoctor(Number(e.target.value))}
                className="w-full accent-emerald-400 my-2 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">Patients examined per doctor daily</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-200">Average Consultation Fee:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">₹{avgConsultFee}</span>
              </div>
              <input
                type="range"
                min={200}
                max={2500}
                step={50}
                value={avgConsultFee}
                onChange={(e) => setAvgConsultFee(Number(e.target.value))}
                className="w-full accent-emerald-400 my-2 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">Doctor OPD examination charge</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-200">Current No-Show Rate:</span>
                <span className="font-mono font-bold text-amber-400 text-base">{currentNoShowRate}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                value={currentNoShowRate}
                onChange={(e) => setCurrentNoShowRate(Number(e.target.value))}
                className="w-full accent-amber-400 my-2 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">Reduced to &lt;3% with PhonePe QR deposit</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE ALL-FEATURES COMPARISON MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs uppercase font-bold text-emerald-800 tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Complete Feature Breakdown
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Compare All Plans Across Every Clinical Module
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Inspect every single capability included in Sanjeevni Clinic OS across outpatient scheduling, PhonePe instant collection, diagnostic labs, inpatient wards, and enterprise security.
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat.id
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search features (e.g. PhonePe, Bed, Rx)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50"
            />
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white sticky top-0 z-20">
                  <th className="py-4 px-6 font-bold w-2/5">
                    Operational Feature &amp; Capability
                  </th>
                  <th className="py-4 px-4 font-bold text-center w-[15%]">
                    Essential Clinic
                    <span className="block text-[10px] text-slate-400 font-normal">
                      ₹1,599 / mo
                    </span>
                  </th>
                  <th className="py-4 px-4 font-bold text-center w-[15%] bg-emerald-900/60 border-x border-emerald-800">
                    Multi-Specialty ⭐
                    <span className="block text-[10px] text-emerald-300 font-normal">
                      ₹3,999 / mo
                    </span>
                  </th>
                  <th className="py-4 px-4 font-bold text-center w-[15%]">
                    Super-Specialty
                    <span className="block text-[10px] text-slate-400 font-normal">
                      ₹9,599 / mo
                    </span>
                  </th>
                  <th className="py-4 px-4 font-bold text-center w-[15%]">
                    Enterprise Network
                    <span className="block text-[10px] text-slate-400 font-normal">
                      ₹19,999 / mo
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFeatures.map((row, idx) => {
                  function renderValue(val: boolean | string) {
                    if (val === true) {
                      return (
                        <div className="flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      );
                    }
                    if (val === false) {
                      return (
                        <div className="flex items-center justify-center">
                          <X className="w-4 h-4 text-slate-300" />
                        </div>
                      );
                    }
                    return (
                      <span className="font-semibold text-slate-800 text-[11px] bg-slate-100 px-2.5 py-1 rounded-md">
                        {val}
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      <td className="py-3.5 px-6">
                        <strong className="text-slate-900 font-bold block text-sm">
                          {row.name}
                        </strong>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {row.desc}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderValue(row.solo)}
                      </td>
                      <td className="py-3.5 px-4 text-center bg-emerald-50/40 border-x border-emerald-100 font-medium">
                        {renderValue(row.clinic)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderValue(row.hospital)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderValue(row.enterprise)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredFeatures.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">No features found matching &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 text-xs text-emerald-700 font-bold underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* HOSPITAL OWNER PILOT MODAL */}
      {showPilotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowPilotModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowPilotModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {pilotSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Pilot Provisioned for {pilotForm.hospitalName || "Your Hospital"}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Our clinical deployment engineer will contact {pilotForm.contactName || "you"} at {pilotForm.phone || "your number"} within 2 business hours with dedicated pilot credentials.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowPilotModal(false)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
                  >
                    <span>Explore Live Sandbox Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">
                    14-Day Free Hospital Pilot
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">
                    Deploy Sanjeevni OS for Your Practice
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No credit card required. Includes white-glove onboarding and demo patient database.
                  </p>
                </div>

                <form onSubmit={handlePilotSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hospital / Clinic / Chamber Name:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Multi-Specialty Hospital"
                      value={pilotForm.hospitalName}
                      onChange={(e) => setPilotForm({ ...pilotForm, hospitalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Medical Director / Owner Name:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Rajesh Sharma"
                        value={pilotForm.contactName}
                        onChange={(e) => setPilotForm({ ...pilotForm, contactName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Contact Mobile / Phone:
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765-43210"
                        value={pilotForm.phone}
                        onChange={(e) => setPilotForm({ ...pilotForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Work Email:
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="owner@hospital.com"
                        value={pilotForm.email}
                        onChange={(e) => setPilotForm({ ...pilotForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        City / Location:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="New Delhi"
                        value={pilotForm.city}
                        onChange={(e) => setPilotForm({ ...pilotForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Target Plan:
                    </label>
                    <select
                      value={pilotSelectedPlan}
                      onChange={(e) => setPilotSelectedPlan(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="solo">Essential Clinic (Up to 2 Doctors)</option>
                      <option value="clinic">Multi-Specialty Care (Up to 10 Doctors)</option>
                      <option value="hospital">Super-Specialty Hospital (20-100 Beds)</option>
                      <option value="enterprise">Health System Enterprise (Multi-Branch)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-md mt-4"
                  >
                    Confirm &amp; Launch 14-Day Free Pilot →
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
