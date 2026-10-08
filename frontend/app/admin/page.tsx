"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";
import { getStoredHospitalName } from "../../lib/hospital";

interface AdminStats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  completed_appointments: number;
  today_appointments: number;
  total_revenue: number;
}

interface MasterAppointment {
  id: number;
  user_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  patient_name: string;
  patient_mobile: string;
  patient_email: string;
  doctor_name: string;
  fees: number;
  category_name: string;
  payment_status: string;
  payment_amount: number;
}

interface DoctorItem {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  fees: number;
  qualification: string;
  experience_years: number;
  clinic_address: string;
}

interface CategoryItem {
  id: number;
  category_name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [appointments, setAppointments] = useState<MasterAppointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleName = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleName);
    return () => window.removeEventListener("hospital-name-change", handleName);
  }, []);

  // Manage Doctor Modal
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCatId, setDocCatId] = useState(1);
  const [docFees, setDocFees] = useState(600);
  const [docQual, setDocQual] = useState("MBBS, MD");
  const [docExp, setDocExp] = useState(8);
  const [docAbout, setDocAbout] = useState("");
  const [docAddr, setDocAddr] = useState("Sanjeevni Central Clinic");
  const [savingDoctor, setSavingDoctor] = useState(false);

  async function loadAdminData() {
    const token = getAuthToken();
    if (!token) {
      setError("Please sign in as an administrator to access the clinic operating system.");
      setLoading(false);
      return;
    }

    const claims = parseTokenClaims(token);
    if (claims?.role !== "admin") {
      setError("Admin privileges required. Please use the top role switcher to select 'Clinic Admin'.");
      setLoading(false);
      return;
    }

    try {
      // 1. Stats
      const statsRes = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // 2. Appointments
      const url = new URL(`${API_URL}/admin/appointments`);
      if (statusFilter) url.searchParams.set("status", statusFilter);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const apptRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apptRes.ok) {
        setAppointments(await apptRes.json());
      }

      // 3. Doctors & Categories
      const docsRes = await fetch(`${API_URL}/doctors/get_doctors`);
      if (docsRes.ok) setDoctors(await docsRes.json());

      const catRes = await fetch(`${API_URL}/doctors/categories`);
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading clinic data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [statusFilter, searchQuery]);

  async function handleUpdateStatus(apptId: number, newStatus: string) {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/admin/appointments/${apptId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Could not update status.");
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function handleSaveDoctor(e: React.FormEvent) {
    e.preventDefault();
    setSavingDoctor(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/doctors/manage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: docName.trim(),
          category_id: Number(docCatId),
          fees: Number(docFees),
          qualification: docQual.trim(),
          experience_years: Number(docExp),
          about: docAbout.trim() || undefined,
          clinic_address: docAddr.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save doctor.");
      setShowDoctorModal(false);
      setDocName("");
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving doctor.");
    } finally {
      setSavingDoctor(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">{hospitalName.toUpperCase()} EXECUTIVE ERP</p>
          <h1 className="page-title">{hospitalName} Operations &amp; Admin Center</h1>
          <p className="page-lead">
            Centralized clinic management: monitor patient throughput, front-desk check-ins, doctor rosters, and revenue.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/billing" className="button button-quiet">
            Billing Analytics
          </Link>
          <button
            type="button"
            onClick={() => setShowDoctorModal(true)}
            className="button button-primary"
          >
            + Add Doctor
          </button>
        </div>
      </div>

      {error ? (
        <div className="card directory-state directory-error">
          <h2>Administrative Access Restricted</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Clinic Operations KPIs */}
          {stats && (
            <div className="stats-kpi-grid mb-8">
              <div className="kpi-card">
                <span className="kpi-label">Total Patients</span>
                <span className="kpi-value">{stats.total_patients}</span>
                <span className="kpi-sub">Registered accounts</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Active Doctors</span>
                <span className="kpi-value">{stats.total_doctors}</span>
                <span className="kpi-sub">Medical specialists</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Total Appointments</span>
                <span className="kpi-value">{stats.total_appointments}</span>
                <span className="kpi-sub">{stats.completed_appointments} Completed</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Today&apos;s Clinic Load</span>
                <span className="kpi-value text-amber">{stats.today_appointments}</span>
                <span className="kpi-sub">Scheduled visits today</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Total Revenue</span>
                <span className="kpi-value text-emerald">₹{stats.total_revenue.toLocaleString()}</span>
                <span className="kpi-sub">Collected collections</span>
              </div>
            </div>
          )}

          {/* Master Appointments Desk */}
          <section className="card mb-8">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">MASTER DISPATCH DESK</p>
                <h2 className="section-heading">All Clinic Appointments</h2>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="booked">Booked</option>
                  <option value="checked_in">Checked In</option>
                  <option value="in_consultation">In Consultation</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="text"
                  placeholder="Search patient / doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-search"
                />
              </div>
            </div>

            {loading ? (
              <div className="directory-state">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="directory-state">No appointments match your filters.</div>
            ) : (
              <div className="table-responsive">
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Patient</th>
                      <th>Doctor / Specialty</th>
                      <th>Date & Time</th>
                      <th>Fee / Pay Status</th>
                      <th>Status</th>
                      <th>Front-Desk Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>#{appt.id}</td>
                        <td>
                          <strong>{appt.patient_name}</strong>
                          <div className="text-xs text-muted">{appt.patient_mobile || "No phone"}</div>
                        </td>
                        <td>
                          <strong>{appt.doctor_name}</strong>
                          <div className="text-xs text-muted">{appt.category_name}</div>
                        </td>
                        <td>
                          {appt.appointment_date} <br />
                          <small className="text-muted">{appt.appointment_time}</small>
                        </td>
                        <td>
                          <strong>₹{appt.fees}</strong>
                          <div>
                            <span
                              className={`status-pill ${
                                appt.payment_status === "paid" ? "status-completed" : "status-pending"
                              }`}
                            >
                              {appt.payment_status === "paid" ? "Paid" : "Pending"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              appt.status === "completed"
                                ? "status-completed"
                                : appt.status === "checked_in"
                                ? "status-checkedin"
                                : appt.status === "cancelled"
                                ? "status-cancelled"
                                : "status-booked"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {appt.status === "booked" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, "checked_in")}
                                className="button button-primary text-xs py-1 px-2"
                              >
                                Check In
                              </button>
                            )}
                            {appt.status === "checked_in" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, "completed")}
                                className="button button-quiet text-xs py-1 px-2"
                              >
                                Mark Done
                              </button>
                            )}
                            {appt.status !== "cancelled" && appt.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                                className="button button-quiet text-xs py-1 px-2 text-red-600"
                              >
                                Cancel
                              </button>
                            )}
                            {appt.status === "completed" && (
                              <Link
                                href={`/prescriptions/${appt.id}`}
                                className="button button-quiet text-xs py-1 px-2"
                              >
                                View Rx
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Doctors Roster Table */}
          <section className="card mb-8">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">MEDICAL STAFF</p>
                <h2 className="section-heading">Doctor & Specialty Directory</h2>
              </div>
              <span className="badge-quiet">{doctors.length} Doctors</span>
            </div>

            <div className="table-responsive">
              <table className="bills-table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Department</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Consultation Fee</th>
                    <th>Clinic Suite</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.id}>
                      <td><strong>{doc.name}</strong></td>
                      <td><span className="badge-quiet">{doc.category_name}</span></td>
                      <td className="text-sm">{doc.qualification}</td>
                      <td>{doc.experience_years} Years</td>
                      <td><strong>₹{doc.fees}</strong></td>
                      <td className="text-xs text-muted">{doc.clinic_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Add / Edit Doctor Modal */}
      {showDoctorModal && (
        <div className="modal-backdrop" onClick={() => setShowDoctorModal(false)}>
          <div className="modal-sheet card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">DOCTOR ONBOARDING</p>
                <h2>Add Specialist Doctor</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowDoctorModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="checkout-form">
              <div className="form-group">
                <label className="input-label">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Chander"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Specialty Category *</label>
                <select
                  value={docCatId}
                  onChange={(e) => setDocCatId(Number(e.target.value))}
                  className="form-input"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="input-label">Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={docFees}
                    onChange={(e) => setDocFees(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    value={docExp}
                    onChange={(e) => setDocExp(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Qualification & Degrees</label>
                <input
                  type="text"
                  placeholder="e.g. MBBS, MD, DM (Cardiology)"
                  value={docQual}
                  onChange={(e) => setDocQual(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Clinic Room / Suite Location</label>
                <input
                  type="text"
                  placeholder="e.g. Suite 305, West Wing, Sanjeevni Clinic"
                  value={docAddr}
                  onChange={(e) => setDocAddr(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Biography / About</label>
                <textarea
                  rows={2}
                  placeholder="Brief clinical background..."
                  value={docAbout}
                  onChange={(e) => setDocAbout(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="button button-quiet"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="button button-primary"
                >
                  {savingDoctor ? "Saving Doctor…" : "Onboard Doctor to Clinic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
