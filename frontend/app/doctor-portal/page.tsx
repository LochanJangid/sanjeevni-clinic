"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");

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
        const nextAppt = appointments.find((a) => a.status === "booked" || a.status === "checked_in");
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
      setLoading(false);
      return;
    }

    const claims = parseTokenClaims(token);
    if (!claims) {
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_id: consultingAppt.id,
          diagnosis: diagnosis.trim(),
          instructions: instructions.trim() || undefined,
          medicines: validMeds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to issue prescription.");

      setSuccessToast(`Prescription issued successfully for ${consultingAppt.patient_name}!`);
      setTimeout(() => {
        setConsultingAppt(null);
        setDiagnosis("");
        setInstructions("");
        setMedicines([
          {
            medicine_name: "",
            dosage: "1 Tablet",
            frequency: "Twice daily after food",
            duration: "5 Days",
            instructions: "Take with warm water",
          },
        ]);
        setSuccessToast("");
        loadDoctorData();
      }, 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error issuing prescription.");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingVisits = appointments.filter((a) => a.status !== "completed" && a.status !== "cancelled");
  const completedVisits = appointments.filter((a) => a.status === "completed");

  return (
    <main className="page-shell">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">{hospitalName.toUpperCase()} CLINICAL WORKSPACE</p>
          <h1 className="page-title">Doctor Consultation Desk</h1>
          <p className="page-lead">
            Manage your patient queue, record clinical diagnoses, and issue official digital prescriptions (Rx).
          </p>
        </div>
        <div className="header-actions">
          <Link href="/prescriptions" className="button button-quiet">
            Prescriptions Archive
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-kpi-grid mb-8">
        <div className="kpi-card">
          <span className="kpi-label">Active Queue</span>
          <span className="kpi-value text-amber">{pendingVisits.length}</span>
          <span className="kpi-sub">Patients waiting / scheduled</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Completed Consultations</span>
          <span className="kpi-value text-emerald">{completedVisits.length}</span>
          <span className="kpi-sub">Rx issued & finalized</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Patient Visits</span>
          <span className="kpi-value">{appointments.length}</span>
          <span className="kpi-sub">Registered with clinic</span>
        </div>
      </div>

      {/* Patient Queue Table */}
      <section className="card mb-8">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">APPOINTMENTS DISPATCH</p>
            <h2 className="section-heading">Patient Consultation Queue</h2>
          </div>
          <span className="badge-quiet">{appointments.length} Total Visits</span>
        </div>

        {loading ? (
          <div className="directory-state">Loading clinical queue…</div>
        ) : appointments.length === 0 ? (
          <div className="directory-state">
            <span className="empty-calendar" aria-hidden="true">✓</span>
            <h2>No appointments in queue</h2>
            <p>Your consultation queue is clear. New bookings will automatically display here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="bills-table">
              <thead>
                <tr>
                  <th>Time / Date</th>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Clinical Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <strong>{appt.appointment_time}</strong>
                      <div className="text-xs text-muted">{appt.appointment_date}</div>
                    </td>
                    <td>
                      <strong>{appt.patient_name}</strong>
                    </td>
                    <td>{appt.patient_mobile || "Not provided"}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          appt.payment_status === "paid" ? "status-completed" : "status-pending"
                        }`}
                      >
                        {appt.payment_status === "paid" ? "Fee Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          appt.status === "completed"
                            ? "status-completed"
                            : appt.status === "cancelled"
                            ? "status-cancelled"
                            : "status-booked"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {appt.status === "completed" ? (
                        <Link
                          href={`/prescriptions/${appt.id}`}
                          className="button button-quiet text-xs py-1 px-3"
                        >
                          View Rx ↗
                        </Link>
                      ) : appt.status === "cancelled" ? (
                        <span className="text-xs text-muted">Cancelled</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConsultingAppt(appt);
                            setSuccessToast("");
                          }}
                          className="button button-primary text-xs py-1 px-3"
                        >
                          Consult & Prescribe ℞
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

      {/* Weekly Schedule Overview */}
      <section className="card mb-8">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">ROSTER & TIMINGS</p>
            <h2 className="section-heading">My Weekly Consultation Schedule</h2>
          </div>
        </div>

        {schedules.length === 0 ? (
          <p className="subtle-copy">Default clinic hours apply (09:00 - 17:00 daily).</p>
        ) : (
          <div className="schedule-pills-grid">
            {schedules.map((s) => (
              <div key={s.id} className="schedule-card">
                <span className="schedule-day">{dayNames[s.day_of_week] || "Day"}</span>
                <span className="schedule-hours">
                  {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                </span>
                <span className="schedule-tag">Bookable 30m slots</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Consultation & Prescription Modal */}
      {consultingAppt && (
        <div className="modal-backdrop" onClick={() => setConsultingAppt(null)}>
          <div
            className="modal-sheet card modal-consult-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">ELECTRONIC MEDICAL RECORD</p>
                <h2>Consultation: {consultingAppt.patient_name}</h2>
                <p className="text-xs text-muted">
                  Visit Date: {consultingAppt.appointment_date} at {consultingAppt.appointment_time}
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setConsultingAppt(null)}
              >
                ✕
              </button>
            </div>

            {successToast ? (
              <div className="success-banner my-6">
                <span className="check-icon">✓</span> {successToast}
              </div>
            ) : (
              <form onSubmit={handleIssuePrescription} className="consult-form space-y-4">
                {/* Protocol Templates Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">⚡ 1-Click Clinical Rx Protocols (60-80 Patients/Day Speed):</span>
                    <span className="text-[11px] text-muted">Shortcut: <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Alt+N</kbd> next</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {RX_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 transition shadow-sm"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diagnosis & Quick Chips */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="input-label mb-0">Clinical Diagnosis & Symptoms *</label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Pharyngitis with low-grade fever / Stage 1 Hypertension"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="form-input"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_DIAGNOSES.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDiagnosis(d)}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                      >
                        + {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prescribed Medications */}
                <div className="form-group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="input-label mb-0 font-semibold">Prescribed Medications ℞</label>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="button button-quiet text-xs py-1 px-2.5"
                    >
                      + Add Medication
                    </button>
                  </div>

                  <div className="meds-form-list space-y-2">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="med-form-row">
                          <div className="med-col-name flex-1">
                            <input
                              type="text"
                              placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                              value={med.medicine_name}
                              onChange={(e) => handleMedicineChange(idx, "medicine_name", e.target.value)}
                              className="form-input text-sm"
                              required
                            />
                          </div>
                          <div className="med-col-dosage w-28">
                            <input
                              type="text"
                              placeholder="Dosage (1 Tab)"
                              value={med.dosage}
                              onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                              className="form-input text-sm"
                            />
                          </div>
                          <div className="med-col-freq w-44">
                            <input
                              type="text"
                              placeholder="Freq (1-0-1)"
                              value={med.frequency}
                              onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                              className="form-input text-sm"
                            />
                          </div>
                          <div className="med-col-dur w-28">
                            <input
                              type="text"
                              placeholder="Dur (5 Days)"
                              value={med.duration}
                              onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                              className="form-input text-sm"
                            />
                          </div>
                          {medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="remove-med-btn self-center"
                              title="Remove medicine"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Quick Dosage Frequency Chips */}
                        <div className="flex items-center gap-1.5 text-[11px] pt-1">
                          <span className="text-muted text-[10px]">Quick:</span>
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
                              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-blue-50 text-[10px] text-slate-700 dark:text-slate-300"
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant Lab Test Requisition */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">🧪 Order Diagnostic Investigations (Direct Requisition):</span>
                    {labOrdering && <span className="text-xs text-indigo-600 animate-pulse">Generating Barcode…</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_LAB_TESTS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={labOrdering}
                        onClick={() => handleOrderQuickLab(t)}
                        className="px-2 py-1 text-xs font-medium rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 transition"
                      >
                        + {t.name}
                      </button>
                    ))}
                  </div>
                  {orderedLabs.length > 0 && (
                    <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span>✓ Requisitions Created:</span>
                      <span className="underline">{orderedLabs.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Doctor's Advice & Bilingual Hindi Presets */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="input-label mb-0">Doctor&apos;s Advice & Follow-Up Notes</label>
                    <div className="flex gap-1 text-[11px]">
                      <span className="text-muted">हिन्दी निर्देश:</span>
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
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px]"
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
                    className="form-input text-sm"
                  />
                </div>

                <div className="modal-actions mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setConsultingAppt(null)}
                    className="button button-quiet"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button button-primary"
                  >
                    {submitting ? "Finalizing Rx…" : "Issue Digital Prescription & Complete Visit ↗"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
