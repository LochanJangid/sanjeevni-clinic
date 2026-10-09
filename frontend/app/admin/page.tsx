"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Building2, 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  Activity, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X, 
  FileText, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  UserCheck,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  Lock,
  ExternalLink,
  Pencil,
  Trash2
} from "lucide-react";
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

interface DoctorWithKey {
  id: number;
  name: string;
  fees: number;
  doctor_key: string;
  category_id?: number;
  category_name: string;
  qualification: string;
  experience_years: number;
  about?: string;
  clinic_address?: string;
  username: string;
  total_appointments: number;
}

interface CategoryItem {
  id: number;
  category_name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [appointments, setAppointments] = useState<MasterAppointment[]>([]);
  const [doctorsWithKeys, setDoctorsWithKeys] = useState<DoctorWithKey[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalName, setHospitalName] = useState("Sanjeevni");

  // Appoint Doctor Modal State
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCatId, setDocCatId] = useState(1);
  const [docFees, setDocFees] = useState(600);
  const [docQual, setDocQual] = useState("MBBS, MD");
  const [docExp, setDocExp] = useState(8);
  const [docAbout, setDocAbout] = useState("");
  const [docAddr, setDocAddr] = useState("Sanjeevni Central Clinic");
  const [customKey, setCustomKey] = useState("");
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Edit Doctor Modal State
  const [editingDoctor, setEditingDoctor] = useState<DoctorWithKey | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocCatId, setEditDocCatId] = useState(1);
  const [editDocFees, setEditDocFees] = useState(600);
  const [editDocQual, setEditDocQual] = useState("");
  const [editDocExp, setEditDocExp] = useState(5);
  const [editDocAbout, setEditDocAbout] = useState("");
  const [editDocAddr, setEditDocAddr] = useState("");
  const [editDocCustomKey, setEditDocCustomKey] = useState("");
  const [updatingDoctor, setUpdatingDoctor] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  // New Doctor Created Success Modal
  const [newDoctorCreated, setNewDoctorCreated] = useState<{
    id: number;
    name: string;
    doctor_key: string;
    fees: number;
    username: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleName = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleName);
    return () => window.removeEventListener("hospital-name-change", handleName);
  }, []);

  async function loadAdminData() {
    const token = getAuthToken();
    if (!token) {
      setError("Please sign in as hospital administrator (lochan / admin) to access the operations console.");
      setLoading(false);
      return;
    }

    const claims = parseTokenClaims(token);
    if (claims?.role !== "admin") {
      setError("Access Restricted: Hospital Administration credentials required (Admin: lochan / admin).");
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

      // 3. Doctors with Keys
      const docsKeyRes = await fetch(`${API_URL}/admin/doctors-with-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (docsKeyRes.ok) {
        setDoctorsWithKeys(await docsKeyRes.json());
      }

      // 4. Categories
      const catRes = await fetch(`${API_URL}/doctors/categories`);
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading clinic administration data.");
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
      const res = await fetch(`${API_URL}/admin/appoint-doctor`, {
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
          custom_doctor_key: customKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to appoint doctor.");
      }

      const data = await res.json();
      setShowDoctorModal(false);
      setDocName("");
      setCustomKey("");
      setNewDoctorCreated(data.doctor);
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error appointing doctor.");
    } finally {
      setSavingDoctor(false);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  function handleStartEditDoctor(doc: DoctorWithKey) {
    setEditingDoctor(doc);
    setEditDocName(doc.name);
    setEditDocCatId(doc.category_id || 1);
    setEditDocFees(doc.fees);
    setEditDocQual(doc.qualification || "MBBS, MD");
    setEditDocExp(doc.experience_years || 5);
    setEditDocAbout(doc.about || "");
    setEditDocAddr(doc.clinic_address || "Cabin 1, Sanjeevni Central Clinic");
    setEditDocCustomKey(doc.doctor_key || "");
  }

  async function handleUpdateDoctorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoctor) return;
    setUpdatingDoctor(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/admin/doctors/${editingDoctor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editDocName.trim(),
          category_id: Number(editDocCatId),
          fees: Number(editDocFees),
          qualification: editDocQual.trim() || undefined,
          experience_years: Number(editDocExp),
          about: editDocAbout.trim() || undefined,
          clinic_address: editDocAddr.trim() || undefined,
          custom_doctor_key: editDocCustomKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update doctor profile.");
      }

      setEditingDoctor(null);
      await loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating doctor.");
    } finally {
      setUpdatingDoctor(false);
    }
  }

  async function handleDeleteDoctor(doc: DoctorWithKey) {
    if (!confirm(`Are you sure you want to remove Dr. ${doc.name} (Access Key: ${doc.doctor_key}) from Sanjeevni Clinic? This will decommission their login credentials.`)) {
      return;
    }
    setDeletingDocId(doc.id);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/admin/doctors/${doc.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete doctor.");
      }

      await loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting doctor.");
    } finally {
      setDeletingDocId(null);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Operations Executive Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200 text-xs font-bold tracking-wider uppercase">
                  HOSPITAL ADMINISTRATION ERP
                </span>
                <span className="px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ADMIN: LOCHAN
                </span>
                <span className="text-xs font-mono text-gray-500">
                  CLINICAL OPERATIONS COCKPIT
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E3A8A] shadow-sm">
                  <Building2 className="w-7 h-7" />
                </span>
                <span>{hospitalName} Operations ERP</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Appoint clinic doctors, issue Doctor Access Keys, monitor live OPD attendance, oversee bed allocations, and reconcile daily clinic cash drawer ledger.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDoctorModal(true)}
                className="px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Appoint New Doctor &amp; Key</span>
              </button>

              <Link
                href="/beds"
                className="px-4 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-[#1E3A8A] text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <span>Bed Census</span>
              </Link>

              <Link
                href="/billing"
                className="px-4 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-[#1E3A8A] text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <span>Daily Cash Drawer</span>
              </Link>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-8 rounded-2xl bg-white border border-red-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-red-800">{error}</h3>
            <p className="text-xs text-[#4B5563] max-w-md mx-auto">
              Please sign in with administrator credentials: Username <strong className="text-gray-900">lochan</strong> and password <strong className="text-gray-900">admin</strong>.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs transition"
            >
              Go to Sign In Page
            </Link>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-xs font-mono text-gray-500">
            LOADING OPERATIONS TELEMETRY...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Patients</span>
                  <strong className="text-2xl font-black text-[#1E3A8A] font-mono">{stats.total_patients}</strong>
                  <span className="text-[10px] text-[#0D9488] block mt-1 font-semibold">Registered</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Faculty</span>
                  <strong className="text-2xl font-black text-[#1E3A8A] font-mono">{stats.total_doctors}</strong>
                  <span className="text-[10px] text-[#0D9488] block mt-1 font-semibold">Appointed Doctors</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Total Visits</span>
                  <strong className="text-2xl font-black text-[#1E3A8A] font-mono">{stats.total_appointments}</strong>
                  <span className="text-[10px] text-gray-500 block mt-1">OPD Consultations</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Today&apos;s OPD</span>
                  <strong className="text-2xl font-black text-[#1E3A8A] font-mono">{stats.today_appointments}</strong>
                  <span className="text-[10px] text-amber-600 block mt-1 font-semibold">Active Queue</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Completed</span>
                  <strong className="text-2xl font-black text-[#0D9488] font-mono">{stats.completed_appointments}</strong>
                  <span className="text-[10px] text-[#0D9488] block mt-1 font-semibold">Prescriptions Issued</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Revenue</span>
                  <strong className="text-2xl font-black text-[#1E3A8A] font-mono">₹{stats.total_revenue.toLocaleString()}</strong>
                  <span className="text-[10px] text-gray-500 block mt-1">Reconciled Desk</span>
                </div>
              </div>
            )}

            {/* SECTION 1: APPOINTED DOCTORS & ACCESS KEYS */}
            <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold">
                      CLINICAL FACULTY CREDENTIALS
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {doctorsWithKeys.length} Clinicians Appointed
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1E3A8A] mt-1">
                    Appointed Medical Faculty &amp; Doctor Access Keys
                  </h2>
                  <p className="text-xs text-[#4B5563]">
                    Hand these unique Access Keys to doctors. Doctors enter this key on the login screen to enter their physician cockpit directly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDoctorModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Appoint Clinician</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                      <th className="py-3 px-3 font-sans">Doctor Name</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Consultation Fee</th>
                      <th className="py-3 px-3">Doctor Access Key (Login Key)</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doctorsWithKeys.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-3 font-sans">
                          <strong className="text-[#1E3A8A] text-sm block">{doc.name}</strong>
                          <span className="text-[11px] text-[#4B5563]">{doc.qualification}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#1E3A8A] text-[11px] font-semibold">
                            {doc.category_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#0D9488]">₹{doc.fees}</td>
                        <td className="py-3.5 px-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] font-mono font-bold text-xs">
                            <KeyRound className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                            <span>{doc.doctor_key || "NO KEY"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => copyKey(doc.doctor_key)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-sans text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Copy Login Key"
                            >
                              {copiedKey === doc.doctor_key ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#0D9488]" />
                                  <span className="text-[#0D9488]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Key</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEditDoctor(doc)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 font-sans text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Edit Doctor Details & Fees"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#1E3A8A]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              disabled={deletingDocId === doc.id}
                              onClick={() => handleDeleteDoctor(doc)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-sans text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Decommission & Remove Doctor"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>{deletingDocId === doc.id ? "Removing…" : "Remove"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 2: APPOINTMENTS & CONSULTATION ACTIONS */}
            <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold mb-1 inline-flex">
                    OPD ROSTER DISPATCH
                  </span>
                  <h2 className="text-lg font-bold text-[#1E3A8A]">Live Patient Consultations &amp; Slips</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patient / doctor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs py-2 pl-8 pr-3 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs py-2 px-3 bg-white border border-gray-200 rounded-xl text-[#4B5563] focus:outline-none focus:border-[#0D9488] transition"
                  >
                    <option value="">All Statuses</option>
                    <option value="booked">Booked</option>
                    <option value="checked_in">Checked In</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                      <th className="py-3 px-3">Token</th>
                      <th className="py-3 px-3 font-sans">Patient</th>
                      <th className="py-3 px-3 font-sans">Doctor</th>
                      <th className="py-3 px-3">Date / Slot</th>
                      <th className="py-3 px-3">Fee</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-3 text-[#0D9488] font-bold">#{appt.id}</td>
                        <td className="py-3.5 px-3 font-sans">
                          <strong className="text-[#1E3A8A] text-sm block">{appt.patient_name}</strong>
                          <span className="text-[11px] font-mono text-gray-500">{appt.patient_mobile || "No phone"}</span>
                        </td>
                        <td className="py-3.5 px-3 font-sans">
                          <strong className="text-[#1E3A8A] block">{appt.doctor_name}</strong>
                          <span className="text-[11px] text-[#0D9488] font-mono">{appt.category_name}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-[#1E3A8A]">{appt.appointment_date}</span>
                          <div className="text-[11px] text-gray-500">{appt.appointment_time}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <strong className="text-[#1E3A8A]">₹{appt.fees}</strong>
                          <div>
                            <span
                              className={`text-[10px] font-bold ${
                                appt.payment_status === "paid" ? "text-[#0D9488]" : "text-amber-600"
                              }`}
                            >
                              {appt.payment_status === "paid" ? "PAID ✓" : "PENDING"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              appt.status === "completed"
                                ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                                : appt.status === "checked_in"
                                ? "bg-blue-50 text-[#1E3A8A] border border-blue-200"
                                : appt.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-gray-100 text-[#4B5563] border border-gray-200"
                            }`}
                          >
                            {appt.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex gap-1.5 justify-end flex-wrap">
                            {appt.status === "booked" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, "checked_in")}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Check In
                              </button>
                            )}
                            {appt.status === "checked_in" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, "completed")}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#0D9488] border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Mark Done
                              </button>
                            )}
                            {appt.status !== "cancelled" && appt.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                            {appt.status === "completed" && (
                              <Link
                                href={`/prescriptions/${appt.id}`}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-[#1E3A8A] border border-gray-200 rounded-lg text-xs transition inline-flex items-center gap-1"
                              >
                                <span>View Rx</span>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* MODAL 1: APPOINT DOCTOR MODAL */}
        {showDoctorModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="p-6 sm:p-8 bg-white max-w-xl w-full rounded-2xl shadow-xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold mb-1 inline-flex">
                    CLINICAL FACULTY ONBOARDING
                  </span>
                  <h2 className="text-xl font-bold text-[#1E3A8A]">Appoint Specialist Doctor</h2>
                  <p className="text-xs text-[#4B5563]">
                    Appoint a physician to Sanjeevni Clinic and generate a unique Doctor Access Key.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDoctor} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Chander"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Specialty Category *
                  </label>
                  <select
                    value={docCatId}
                    onChange={(e) => setDocCatId(Number(e.target.value))}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0D9488] transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                      Consultation Fee (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={docFees}
                      onChange={(e) => setDocFees(Number(e.target.value))}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={docExp}
                      onChange={(e) => setDocExp(Number(e.target.value))}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Qualification &amp; Degrees
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD, DM (Cardiology)"
                    value={docQual}
                    onChange={(e) => setDocQual(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Custom Doctor Access Key (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate (e.g. DOC-RAMESH-8192)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488] font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    The doctor will use this key on the login screen to enter their workstation.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowDoctorModal(false)}
                    className="px-4 py-2 border border-gray-300 text-[#4B5563] hover:text-gray-900 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDoctor}
                    className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingDoctor ? "Appointing Doctor…" : "Appoint Doctor & Generate Key"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: SUCCESS DOCTOR CREATED & KEY DISPLAY */}
        {newDoctorCreated && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="p-6 sm:p-8 bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-200 text-center space-y-5 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0D9488] mx-auto flex items-center justify-center font-bold">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-bold mb-1 inline-flex">
                  APPOINTMENT CONFIRMED
                </span>
                <h3 className="text-xl font-black text-[#1E3A8A] mt-1">
                  {newDoctorCreated.name} Appointed!
                </h3>
                <p className="text-xs text-[#4B5563] mt-1">
                  The clinician is now active on the Sanjeevni Clinic roster. Provide the Access Key below to the doctor.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 text-center space-y-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Official Doctor Access Key:
                </span>
                <div className="text-2xl font-black text-[#0D9488] font-mono tracking-wider">
                  {newDoctorCreated.doctor_key}
                </div>
                <button
                  type="button"
                  onClick={() => copyKey(newDoctorCreated.doctor_key)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedKey === newDoctorCreated.doctor_key ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Access Key Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Click to Copy Access Key</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-[#4B5563] text-left bg-slate-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                <div className="font-bold text-[#1E3A8A]">How the doctor signs in:</div>
                <div>1. Doctor visits the Sanjeevni Sign In page (<kbd className="font-mono text-[#0D9488]">/login</kbd>).</div>
                <div>2. Selects the &ldquo;Doctor Key Login&rdquo; tab.</div>
                <div>3. Pastes their key and instantly opens the clinical workstation.</div>
              </div>

              <button
                type="button"
                onClick={() => setNewDoctorCreated(null)}
                className="w-full py-3 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* MODAL 3: EDIT DOCTOR MODAL */}
        {editingDoctor && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="p-6 sm:p-8 bg-white max-w-xl w-full rounded-2xl shadow-xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200 text-[10px] font-bold mb-1 inline-flex">
                    DOCTOR PROFILE MANAGEMENT
                  </span>
                  <h2 className="text-xl font-bold text-[#1E3A8A]">Edit Doctor #{editingDoctor.id}</h2>
                  <p className="text-xs text-[#4B5563]">
                    Update doctor specialty, consultation fees, credentials, and access keys.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateDoctorSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDocName}
                    onChange={(e) => setEditDocName(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Specialty Department *
                  </label>
                  <select
                    value={editDocCatId}
                    onChange={(e) => setEditDocCatId(Number(e.target.value))}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0D9488] transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                      Consultation Fee (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={editDocFees}
                      onChange={(e) => setEditDocFees(Number(e.target.value))}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editDocExp}
                      onChange={(e) => setEditDocExp(Number(e.target.value))}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Qualification &amp; Degrees
                  </label>
                  <input
                    type="text"
                    value={editDocQual}
                    onChange={(e) => setEditDocQual(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Chamber / Cabin Address
                  </label>
                  <input
                    type="text"
                    value={editDocAddr}
                    onChange={(e) => setEditDocAddr(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Doctor Access Key (Login Key)
                  </label>
                  <input
                    type="text"
                    value={editDocCustomKey}
                    onChange={(e) => setEditDocCustomKey(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-[#0D9488] font-mono font-bold focus:outline-none focus:border-[#0D9488]"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Updating the key will update the doctor&apos;s active login credentials.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                    Physician Bio / About (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editDocAbout}
                    onChange={(e) => setEditDocAbout(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingDoctor(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingDoctor}
                    className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {updatingDoctor ? (
                      <span>Saving Changes…</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Update Doctor Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
