"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Stethoscope, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  FlaskConical, 
  Zap, 
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Sparkles,
  Lock,
  ArrowRight
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";
import { getStoredHospitalName } from "../../lib/hospital";

interface AppointmentItem {
  id: number;
  user_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient_name: string;
  patient_mobile: string;
  patient_email: string;
  doctor_name: string;
  payment_status: string;
}

interface MedicineInput {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ScheduleSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const QUICK_DIAGNOSES = [
  "Acute Viral Fever / Pyrexia",
  "Type 2 Diabetes Mellitus (T2DM)",
  "Primary Hypertension (HTN)",
  "Acute Upper Respiratory Infection",
  "Dyspepsia & Acid Peptic Disease",
  "Acute Gastroenteritis",
  "Lumbar Spondylosis / Low Backache",
];

const RX_TEMPLATES = [
  {
    name: "🌡️ Viral Fever Protocol",
    diagnosis: "Acute Viral Upper Respiratory Infection with Pyrexia",
    meds: [
      { medicine_name: "Tab Dolo 650 (Paracetamol)", dosage: "1 Tab", frequency: "1-0-1 (Twice daily after meals)", duration: "5 Days", instructions: "Take with warm water; SOS if fever > 100°F" },
      { medicine_name: "Tab Levocetirizine 5mg", dosage: "1 Tab", frequency: "0-0-1 (At bedtime)", duration: "5 Days", instructions: "May cause mild drowsiness" },
      { medicine_name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "1-0-0 (Morning empty stomach)", duration: "5 Days", instructions: "Take 30 mins before breakfast" },
    ],
    instructions: "Drink plenty of warm boiled water. Steam inhalation twice daily. Review if fever persists after 3 days.",
  },
  {
    name: "🩺 Chronic HTN + Diabetes Refill",
    diagnosis: "Known Type-2 Diabetes Mellitus with Essential Hypertension",
    meds: [
      { medicine_name: "Tab Telmisartan 40mg", dosage: "1 Tab", frequency: "1-0-0 (Morning)", duration: "30 Days", instructions: "Take daily with morning meal" },
      { medicine_name: "Tab Metformin 500mg SR", dosage: "1 Tab", frequency: "1-0-1 (After breakfast & dinner)", duration: "30 Days", instructions: "Take immediately after food" },
    ],
    instructions: "Strict low salt diet (< 3g/day). 30 mins daily brisk walk. Maintain blood pressure and glucose log.",
  },
  {
    name: "🫄 Gastritis & GERD Protocol",
    diagnosis: "Acute Dyspepsia with Gastroesophageal Reflux",
    meds: [
      { medicine_name: "Cap Pantoprazole 40mg + Domperidone 30mg SR", dosage: "1 Cap", frequency: "1-0-0 (Empty stomach)", duration: "10 Days", instructions: "Take early morning 45 mins before breakfast" },
      { medicine_name: "Syp Gelusil MPS", dosage: "2 Tsp", frequency: "1-1-1 (After meals & bedtime)", duration: "7 Days", instructions: "Shake well before use" },
    ],
    instructions: "Avoid spicy/fried foods and tea/coffee. Early dinner at least 2 hours before bedtime.",
  },
];

const QUICK_LAB_TESTS = [
  { id: 1, code: "CBC", name: "CBC with ESR" },
  { id: 2, code: "LIPID", name: "Lipid Profile" },
  { id: 3, code: "KFT", name: "KFT (Kidney Panel)" },
  { id: 4, code: "LFT", name: "LFT (Liver Panel)" },
  { id: 5, code: "HBA1C", name: "HbA1c Blood Sugar" },
];

export default function DoctorPortalPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hospitalName, setHospitalName] = useState("Sanjeevni");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleName = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleName);
    return () => window.removeEventListener("hospital-name-change", handleName);
  }, []);

  // Consultation modal state
  const [consultingAppt, setConsultingAppt] = useState<AppointmentItem | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medicines, setMedicines] = useState<MedicineInput[]>([
    {
      medicine_name: "",
      dosage: "1 Tablet",
      frequency: "Twice daily after food",
      duration: "5 Days",
      instructions: "Take with warm water",
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [orderedLabs, setOrderedLabs] = useState<string[]>([]);
  const [labOrdering, setLabOrdering] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        const nextAppt = appointments.find((a) => ["booked", "checked_in", "approved", "pending"].includes(a.status));
        if (nextAppt) {
          setConsultingAppt(nextAppt);
          setSuccessToast("");
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appointments]);

  function handleApplyTemplate(tmpl: (typeof RX_TEMPLATES)[0]) {
    setDiagnosis(tmpl.diagnosis);
    setMedicines(tmpl.meds);
    setInstructions(tmpl.instructions);
  }

  async function handleOrderQuickLab(test: (typeof QUICK_LAB_TESTS)[0]) {
    if (!consultingAppt) return;
    setLabOrdering(true);
    try {
      const res = await fetch(`${API_URL}/pharmacy-lab/lab/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uhid: `UHID-PAT-${consultingAppt.user_id}`,
          patient_name: consultingAppt.patient_name,
          doctor_name: doctorName || "Attending Physician",
          test_id: test.id,
          clinical_notes: `Direct OPD requisition by doctor. Diagnosis: ${diagnosis || "Under evaluation"}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderedLabs((prev) => [...prev, `${test.code} (${data.barcode})`]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLabOrdering(false);
    }
  }

  async function loadDoctorData() {
    const token = getAuthToken();
    if (!token) {
      setError("Clinician authentication required. Please sign in with your Doctor Access Key.");
      setLoading(false);
      return;
    }

    const claims = parseTokenClaims(token);
    if (!claims || (claims.role !== "doctor" && claims.role !== "admin")) {
      setError("Access Restricted: This workstation is for verified clinicians only. Please sign in with your Doctor Access Key.");
      setLoading(false);
      return;
    }

    setDoctorName(claims.username || "Doctor");
    const docId = claims.doctor_id || 1;
    setDoctorId(docId);

    try {
      const apptRes = await fetch(`${API_URL}/admin/appointments?doctor_id=${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(Array.isArray(data) ? data : []);
      }

      const schedRes = await fetch(`${API_URL}/doctors/${docId}/availability`);
      if (schedRes.ok) {
        const data = await schedRes.json();
        setSchedules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctorData();
  }, []);

  function handleAddMedicine() {
    setMedicines((prev) => [
      ...prev,
      {
        medicine_name: "",
        dosage: "1 Tablet",
        frequency: "Once daily",
        duration: "7 Days",
        instructions: "Take after meal",
      },
    ]);
  }

  function handleRemoveMedicine(idx: number) {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleMedicineChange(idx: number, field: keyof MedicineInput, val: string) {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }

  async function handleIssuePrescription(e: React.FormEvent) {
    e.preventDefault();
    if (!consultingAppt) return;
    if (!diagnosis.trim()) {
      alert("Please enter a clinical diagnosis.");
      return;
    }

    const validMeds = medicines.filter((m) => m.medicine_name.trim());
    if (validMeds.length === 0) {
      alert("Please add at least one prescribed medicine.");
      return;
    }

    setSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/prescriptions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appointment_id: consultingAppt.id,
          diagnosis: diagnosis.trim(),
          instructions: instructions.trim() || "Take medicines as advised.",
          medicines: validMeds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to issue prescription.");
      }

      setSuccessToast(`Prescription successfully generated for ${consultingAppt.patient_name}!`);
      setTimeout(() => {
        setConsultingAppt(null);
        setSuccessToast("");
        setDiagnosis("");
        setInstructions("");
        setOrderedLabs([]);
        setMedicines([
          {
            medicine_name: "",
            dosage: "1 Tablet",
            frequency: "Twice daily after food",
            duration: "5 Days",
            instructions: "Take with warm water",
          },
        ]);
        loadDoctorData();
      }, 1200);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error generating prescription.");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingVisits = appointments.filter((a) => ["booked", "checked_in", "approved", "pending"].includes(a.status));
  const completedVisits = appointments.filter((a) => a.status === "completed");

  if (error) {
    return (
      <div className="min-h-screen bg-white text-[#4B5563] flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-4 max-w-md shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D9488] mx-auto flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1E3A8A]">{error}</h3>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Please sign in with the unique Doctor Access Key provided by Sanjeevni Clinic administration.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs transition shadow-sm"
          >
            <span>Go to Doctor Key Login</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cockpit Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-xs font-bold uppercase tracking-wider">
                  PHYSICIAN COCKPIT
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200 text-xs font-bold flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  DR. {doctorName.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  PRESS <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] border border-gray-300">Alt + N</kbd> FOR NEXT PATIENT
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E3A8A] shadow-sm">
                  <Stethoscope className="w-7 h-7" />
                </span>
                <span>{hospitalName} Clinical Workstation</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                High-throughput outpatient desk: conduct digital consultations, prescribe verified medications with 1-click clinical protocols, order diagnostic barcodes, and dispatch official e-prescriptions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/prescriptions"
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-[#1E3A8A] text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <FileText className="w-4 h-4 text-[#0D9488]" />
                <span>Prescriptions Archive</span>
              </Link>
              <Link
                href="/opd-queue"
                className="px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100 text-[#0D9488] text-xs font-bold transition flex items-center gap-2"
              >
                <span>OPD TV Signage Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488] transition">
            <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
              <span>ACTIVE QUEUE</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
              {pendingVisits.length}
            </div>
            <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Patients waiting / checked-in
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488] transition">
            <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
              <span>COMPLETED VISITS</span>
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0D9488] font-mono tracking-tight">
              {completedVisits.length}
            </div>
            <div className="mt-2 text-[11px] text-[#0D9488] flex items-center gap-1 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              Prescriptions issued &amp; archived
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488] transition">
            <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
              <span>TOTAL REGISTERED SESSIONS</span>
              <User className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
              {appointments.length}
            </div>
            <div className="mt-2 text-[11px] text-[#4B5563] flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Patient records in registry
            </div>
          </div>
        </div>

        {/* Patient Consultation Queue Table */}
        <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold mb-1 inline-flex">
                DISPATCH LIST
              </span>
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                Patient Consultation Queue
              </h2>
            </div>
            <span className="px-3 py-1 rounded-xl bg-slate-50 border border-gray-200 text-xs font-mono text-gray-600">
              {appointments.length} Total Visits Scheduled
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mb-3" />
              <p className="text-sm font-mono text-gray-500">SYNCHRONIZING APPOINTMENTS QUEUE...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#0D9488] mx-auto" />
              <h3 className="text-base font-semibold text-[#1E3A8A]">Consultation Queue is Clear</h3>
              <p className="text-xs text-[#4B5563]">All scheduled patients have been attended or no bookings exist for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-mono uppercase text-gray-600">
                    <th className="py-3 px-3">Slot Time &amp; Date</th>
                    <th className="py-3 px-3">Patient Details</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Clinical Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <strong className="text-gray-900 text-sm">{appt.appointment_time}</strong>
                        <div className="text-[11px] text-gray-400">{appt.appointment_date}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1E3A8A] text-sm font-sans">{appt.patient_name}</div>
                        <div className="text-[11px] text-gray-400">ID #{appt.id} · UHID-PAT-{appt.user_id}</div>
                      </td>
                      <td className="py-3 px-3 text-[#4B5563]">
                        {appt.patient_mobile || "Not provided"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.payment_status === "paid"
                              ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {appt.payment_status === "paid" ? "FEE PAID ✓" : "UNPAID"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === "completed"
                              ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                              : appt.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-blue-50 text-[#1E3A8A] border border-blue-200"
                          }`}
                        >
                          {appt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {appt.status === "completed" ? (
                          <Link
                            href={`/prescriptions/${appt.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1E3A8A] border border-gray-200 transition font-semibold text-xs"
                          >
                            <span>View Rx</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : appt.status === "cancelled" ? (
                          <span className="text-gray-400 text-xs">Cancelled</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setConsultingAppt(appt);
                              setSuccessToast("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold shadow-sm transition cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Consult &amp; Prescribe ℞</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Weekly Consultation Roster */}
        <section className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold mb-1 inline-flex">
                DUTY SCHEDULE
              </span>
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                My Weekly Consultation Roster
              </h2>
            </div>
          </div>

          {schedules.length === 0 ? (
            <p className="text-xs text-gray-400">Default clinic hours apply (09:00 - 17:00 daily across OPD wings).</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {schedules.map((s) => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                  <span className="text-xs font-mono font-bold text-[#0D9488] block">
                    {dayNames[s.day_of_week] || "Day"}
                  </span>
                  <div className="text-xs font-mono text-[#1E3A8A] font-bold">
                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 block">
                    30m Time Slots
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Digital Prescription Consultation Modal */}
        {consultingAppt && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="p-5 sm:p-8 bg-white max-w-4xl w-full rounded-2xl shadow-xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto space-y-5">
              
              <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold mb-1 inline-flex">
                    ELECTRONIC MEDICAL RECORD (EMR)
                  </span>
                  <h2 className="text-xl font-bold text-[#1E3A8A]">
                    Consultation: {consultingAppt.patient_name}
                  </h2>
                  <p className="text-xs font-mono text-[#4B5563] mt-0.5">
                    Slot: {consultingAppt.appointment_date} at {consultingAppt.appointment_time} · Phone: {consultingAppt.patient_mobile || "N/A"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConsultingAppt(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {successToast ? (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
                  <span>{successToast}</span>
                </div>
              ) : (
                <form onSubmit={handleIssuePrescription} className="space-y-5">
                  
                  {/* 1-Click Clinical Rx Protocols */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#1E3A8A] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#0D9488]" />
                        1-Click Clinical Rx Protocols (Quick Consult Speed):
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        PRESS <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">Alt+N</kbd> NEXT
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {RX_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-gray-200 hover:border-[#0D9488] text-gray-800 hover:text-[#0D9488] transition shadow-sm"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis & Quick Chips */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#1E3A8A]">
                      Clinical Diagnosis &amp; Symptoms *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acute Pharyngitis with low-grade fever / Stage 1 Essential Hypertension"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full text-sm p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_DIAGNOSES.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setDiagnosis(d)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#4B5563] transition"
                        >
                          + {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prescribed Medications */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#1E3A8A]">
                        Prescribed Medications ℞
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="px-3 py-1 bg-white hover:bg-gray-50 text-[#1E3A8A] rounded-xl text-xs font-semibold flex items-center gap-1 border border-gray-300 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Add Medication</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {medicines.map((med, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                                value={med.medicine_name}
                                onChange={(e) => handleMedicineChange(idx, "medicine_name", e.target.value)}
                                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                placeholder="Dosage (1 Tab)"
                                value={med.dosage}
                                onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                placeholder="Freq (1-0-1)"
                                value={med.frequency}
                                onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                              />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Dur (5 Days)"
                                value={med.duration}
                                onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                              />
                              {medicines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedicine(idx)}
                                  className="p-2 text-gray-400 hover:text-rose-600 transition"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Dosage Frequency Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                            <span className="text-gray-500">Quick Dose:</span>
                            {[
                              { label: "1-0-1 (After Food)", val: "1-0-1 (Twice daily after food)" },
                              { label: "1-0-0 (Empty Stomach)", val: "1-0-0 (Morning empty stomach)" },
                              { label: "0-0-1 (Bedtime)", val: "0-0-1 (At bedtime)" },
                              { label: "1-1-1 (TID)", val: "1-1-1 (Thrice daily)" },
                              { label: "SOS (As Needed)", val: "SOS (When needed)" },
                            ].map((chip, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => handleMedicineChange(idx, "frequency", chip.val)}
                                className="px-2 py-0.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instant Lab Diagnostic Requisitions */}
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#0D9488] flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-[#0D9488]" />
                        Order Diagnostic Investigations (Instant Barcode Dispatch):
                      </span>
                      {labOrdering && <span className="text-xs text-[#0D9488] animate-pulse font-mono">Generating Barcode…</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_LAB_TESTS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          disabled={labOrdering}
                          onClick={() => handleOrderQuickLab(t)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-teal-200 hover:border-[#0D9488] text-[#0F766E] transition shadow-sm"
                        >
                          + {t.name}
                        </button>
                      ))}
                    </div>
                    {orderedLabs.length > 0 && (
                      <div className="mt-2 text-xs text-[#0D9488] font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Requisitions Barcoded: {orderedLabs.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Doctor's Advice & Bilingual Hindi Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E3A8A]">
                        Doctor&apos;s Advice &amp; Follow-Up Instructions
                      </label>
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        <span className="text-gray-500 font-mono">हिन्दी निर्देश:</span>
                        {[
                          "खाना खाने के बाद लें",
                          "सुबह खाली पेट लें",
                          "पर्याप्त पानी पिएं व आराम करें",
                          "7 दिन बाद पुनः दिखाएं",
                        ].map((txt, hIdx) => (
                          <button
                            key={hIdx}
                            type="button"
                            onClick={() => setInstructions((prev) => (prev ? `${prev}. ${txt}` : txt))}
                            className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px]"
                          >
                            + {txt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="e.g. Drink plenty of warm fluids, rest for 3 days. Review in 1 week if symptoms persist."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488] transition"
                    />
                  </div>

                  {/* Form Submit & Cancel Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setConsultingAppt(null)}
                      className="px-4 py-2 border border-gray-300 text-[#4B5563] hover:text-gray-900 rounded-xl text-xs font-semibold transition"
                    >
                      Cancel Consultation
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{submitting ? "Finalizing E-Prescription…" : "Issue Digital Prescription & Complete Visit ↗"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
