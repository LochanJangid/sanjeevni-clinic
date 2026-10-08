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
    const docId = claims.doctor_id || 1; // Default to Dr. Sharma if not set
    setDoctorId(docId);

    try {
      // Fetch doctor's appointments
      const apptRes = await fetch(`${API_URL}/admin/appointments?doctor_id=${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(Array.isArray(data) ? data : []);
      }

      // Fetch weekly availability schedule
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
              <form onSubmit={handleIssuePrescription} className="consult-form">
                <div className="form-group">
                  <label className="input-label">Clinical Diagnosis & Symptoms *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Pharyngitis with low-grade fever / Stage 1 Hypertension"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="input-label mb-0">Prescribed Medications ℞</label>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="button button-quiet text-xs py-1 px-2"
                    >
                      + Add Medication
                    </button>
                  </div>

                  <div className="meds-form-list">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="med-form-row">
                        <div className="med-col-name">
                          <input
                            type="text"
                            placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                            value={med.medicine_name}
                            onChange={(e) => handleMedicineChange(idx, "medicine_name", e.target.value)}
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="med-col-dosage">
                          <input
                            type="text"
                            placeholder="Dosage (1 Tab)"
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div className="med-col-freq">
                          <input
                            type="text"
                            placeholder="Frequency (Twice daily)"
                            value={med.frequency}
                            onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div className="med-col-dur">
                          <input
                            type="text"
                            placeholder="Duration (5 Days)"
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                            className="form-input"
                          />
                        </div>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="remove-med-btn"
                            title="Remove medicine"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Doctor&apos;s Advice & Follow-Up Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Drink plenty of warm fluids, rest for 3 days. Review in 1 week if symptoms persist."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="modal-actions mt-4">
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
