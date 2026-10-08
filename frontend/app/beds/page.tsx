"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bed, 
  Wind, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  Plus, 
  UserPlus, 
  LogOut, 
  Search, 
  Filter,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { getAuthClaims, getAuthToken } from "../../lib/auth";
import { getStoredHospitalName } from "../../lib/hospital";

interface HospitalBed {
  id: number;
  bed_number: string;
  ward_type: string;
  floor: string;
  has_oxygen: boolean;
  is_occupied: boolean;
  patient_name: string | null;
  doctor_id: number | null;
  doctor_name: string | null;
  admitted_at: string | null;
}

interface SummaryData {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  oxygen_available_beds: number;
  by_ward: Record<string, { total: number; occupied: number; available: number }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function HospitalBedsPage() {
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState("all");
  const [search, setSearch] = useState("");
  const [admitBedId, setAdmitBedId] = useState<number | null>(null);
  const [patientNameInput, setPatientNameInput] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [requisitionNotes, setRequisitionNotes] = useState("");
  const [patients, setPatients] = useState<Array<{ id: number; username: string; mobile: string | null }>>([]);
  const [admitting, setAdmitting] = useState(false);
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleName = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleName);
    return () => window.removeEventListener("hospital-name-change", handleName);
  }, []);

  const claims = getAuthClaims();
  const userRole = claims?.role || "guest";
  const isDoctor = userRole === "doctor";
  const isAdmin = userRole === "admin";
  const isPatient = userRole === "patient" || userRole === "guest";

  async function loadBeds() {
    try {
      const res = await fetch(`${API_URL}/clinical/beds`);
      if (res.ok) {
        const data = await res.json();
        setBeds(data.beds || []);
        setSummary(data.summary || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/clinical/patients-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadBeds();
    if (isDoctor || isAdmin) {
      loadPatients();
    }
  }, [userRole]);

  async function handleAdmit(e: React.FormEvent) {
    e.preventDefault();
    if (!admitBedId || !patientNameInput.trim()) return;
    setAdmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/beds/${admitBedId}/admit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_name: patientNameInput.trim(),
          patient_id: selectedPatientId,
          requisition_notes: requisitionNotes.trim(),
        }),
      });
      if (res.ok) {
        setAdmitBedId(null);
        setPatientNameInput("");
        setSelectedPatientId(null);
        setRequisitionNotes("");
        await loadBeds();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdmitting(false);
    }
  }

  async function handleDischarge(bedId: number) {
    if (!confirm("Confirm discharge for this patient?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/clinical/beds/${bedId}/discharge`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        await loadBeds();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = beds.filter((b) => {
    const matchesWard = selectedWard === "all" || b.ward_type.toLowerCase() === selectedWard.toLowerCase();
    const matchesSearch = b.bed_number.toLowerCase().includes(search.toLowerCase()) ||
                          (b.patient_name && b.patient_name.toLowerCase().includes(search.toLowerCase())) ||
                          b.floor.toLowerCase().includes(search.toLowerCase());
    return matchesWard && matchesSearch;
  });

  const wardTabs = [
    { id: "all", label: "All Wings" },
    { id: "icu", label: "ICU (Critical Care)" },
    { id: "semi-private", label: "Semi-Private" },
    { id: "general ward", label: "General Ward" },
    { id: "daycare", label: "Daycare / Post-Op" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-ping" />
                  IPD INPATIENT MATRIX
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#1E3A8A]" />
                  REAL-TIME TELEMETRY
                </span>
                <span className="text-xs font-mono text-gray-400">
                  UPDATED EVERY 15S
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Bed className="w-7 h-7" />
                </span>
                <span>{hospitalName} Ward &amp; Bed Census</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Live centralized census monitoring across Intensive Care Units (ICU), Semi-Private suites, and General Wards with central oxygen line monitoring and rapid inpatient triage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 flex items-center gap-2.5 text-xs font-medium text-[#4B5563]">
                <Building2 className="w-4 h-4 text-[#0D9488]" />
                <span>ADMISSIONS: <strong className="text-[#0D9488]">24x7 OPEN</strong></span>
              </div>
              <Link
                href="/emergency"
                className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Emergency Trauma Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Telemetry Metric HUD Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-gray-300 transition">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>TOTAL BEDS</span>
                <Layers className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
                {summary.total_beds}
              </div>
              <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                4 Active Wings
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>OCCUPIED</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
                {summary.occupied_beds}
              </div>
              <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Active Inpatients
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488]/40 transition">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>VACANT / READY</span>
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
              </div>
              <div className="text-3xl font-extrabold text-[#0D9488] font-mono tracking-tight">
                {summary.available_beds}
              </div>
              <div className="mt-2 text-[11px] text-[#0D9488] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                Sterilized &amp; Prepped
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488]/40 transition">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>O₂ INTEGRATED</span>
                <Wind className="w-4 h-4 text-[#0D9488]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
                {summary.oxygen_available_beds}
              </div>
              <div className="mt-2 text-[11px] text-[#0D9488] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                Central Pipeline O₂
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>OCCUPANCY RATIO</span>
                <Activity className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
                {summary.occupancy_rate}%
              </div>
              <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0D9488] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(summary.occupancy_rate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Search & Wing Segmented Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {wardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedWard(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedWard === tab.id
                    ? "bg-[#0D9488] text-white shadow-sm"
                    : "bg-slate-50 text-[#4B5563] hover:text-[#1E3A8A] hover:bg-slate-100 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bed ID (e.g. ICU-101) or patient..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
            />
          </div>
        </div>

        {/* Beds Matrix Grid */}
        {loading ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mb-3" />
            <p className="text-sm font-medium text-gray-500">CONNECTING TO WARD SENSOR MESH...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center space-y-3 shadow-sm">
            <Bed className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-[#1E3A8A]">No beds found matching filters</h3>
            <p className="text-xs text-gray-500">Try switching ward category or clear search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((bed) => {
              const isOccupied = bed.is_occupied;
              return (
                <div
                  key={bed.id}
                  className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden shadow-sm ${
                    isOccupied
                      ? "border-amber-200 hover:border-amber-400"
                      : "border-gray-200 hover:border-[#0D9488]/40 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-black text-[#1E3A8A] tracking-wider">
                          {bed.bed_number}
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-md bg-slate-100 text-[#4B5563] border border-gray-200 font-semibold">
                          {bed.floor}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 block mt-0.5 font-medium">
                        {bed.ward_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {bed.has_oxygen && (
                        <span
                          className="px-2 py-0.5 bg-teal-50 text-[#0D9488] border border-teal-200 rounded-md text-[10px] font-bold flex items-center gap-1"
                          title="Central Oxygen Supported"
                        >
                          <Wind className="w-3 h-3" />
                          <span>O₂</span>
                        </span>
                      )}
                      {isOccupied ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          OCCUPIED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                          VACANT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 text-xs space-y-1.5 mb-4">
                    {isOccupied ? (
                      isPatient ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Bed Status:</span>
                            <strong className="text-amber-700 font-semibold text-[11px]">Occupied (Inpatient Under Treatment)</strong>
                          </div>
                          {bed.doctor_name && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-[11px]">Attending MD:</span>
                              <span className="text-[#0D9488] font-semibold text-[11px]">{bed.doctor_name}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 italic pt-0.5">
                            Clinical privacy protected • Inpatient details confidential
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Inpatient:</span>
                            <strong className="text-[#1E3A8A] font-semibold">{bed.patient_name}</strong>
                          </div>
                          {bed.doctor_name && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-[11px]">Attending MD:</span>
                              <span className="text-[#0D9488] font-semibold">{bed.doctor_name}</span>
                            </div>
                          )}
                          {bed.admitted_at && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-[11px]">Admitted On:</span>
                              <span className="text-gray-500 text-[11px]">
                                {new Date(bed.admitted_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      <div className="text-[#0D9488] text-[11px] font-medium flex items-center gap-1.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Sterilized &amp; prepped for emergency triage</span>
                      </div>
                    )}
                  </div>

                  {/* Bed Action Trigger - Role Isolated */}
                  <div className="pt-2 border-t border-gray-100">
                    {isPatient ? (
                      /* Patient View Only - Cannot take action */
                      isOccupied ? (
                        <div className="w-full py-2 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl text-center border border-amber-200">
                          Inpatient Care In Progress • Bed Unavailable
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="w-full py-1.5 bg-teal-50 text-[#0D9488] text-[11px] font-bold rounded-xl text-center border border-teal-200">
                            ✓ Vacant &amp; Available for Inpatient Care
                          </div>
                          <Link
                            href="/doctors"
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#1E3A8A] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-gray-200"
                          >
                            <span>Consult Doctor for Bed Requisition →</span>
                          </Link>
                        </div>
                      )
                    ) : isDoctor ? (
                      /* Doctor Requisition & Assignment Mode */
                      isOccupied ? (
                        <button
                          type="button"
                          onClick={() => handleDischarge(bed.id)}
                          className="w-full py-2 bg-slate-50 hover:bg-rose-50 text-[#4B5563] hover:text-rose-600 border border-gray-200 hover:border-rose-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Discharge Patient</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdmitBedId(bed.id);
                            setPatientNameInput("");
                            setSelectedPatientId(null);
                            setRequisitionNotes("");
                          }}
                          className="w-full py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Request / Assign Bed for Patient</span>
                        </button>
                      )
                    ) : (
                      /* Admin Full Hospital Management Mode */
                      isOccupied ? (
                        <button
                          type="button"
                          onClick={() => handleDischarge(bed.id)}
                          className="w-full py-2 bg-slate-50 hover:bg-rose-50 text-[#4B5563] hover:text-rose-600 border border-gray-200 hover:border-rose-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Discharge Patient</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdmitBedId(bed.id);
                            setPatientNameInput("");
                            setSelectedPatientId(null);
                            setRequisitionNotes("");
                          }}
                          className="w-full py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Admit Patient to Bed</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable Bed Requisition / Admission Modal */}
        {admitBedId !== null && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white p-6 sm:p-8 max-w-lg w-full rounded-3xl shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-2 inline-flex">
                  {isDoctor ? "PHYSICIAN BED REQUISITION" : "ADMISSION PROTOCOL"}
                </span>
                <h3 className="text-lg font-bold text-[#1E3A8A]">
                  {isDoctor ? "Doctor Bed Requisition & Assignment" : "Admit Inpatient to Bed"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isDoctor
                    ? "Select registered patient or enter name to issue an electronic bed assignment order."
                    : "Assign patient to bed and generate electronic inpatient admission log."}
                </p>
              </div>

              <form onSubmit={handleAdmit} className="space-y-4 pt-2">
                {patients.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                      Select Registered Patient
                    </label>
                    <select
                      className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-xl text-[#1E3A8A] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                      onChange={(e) => {
                        const pid = Number(e.target.value);
                        setSelectedPatientId(pid || null);
                        const found = patients.find((p) => p.id === pid);
                        if (found) setPatientNameInput(found.username);
                      }}
                    >
                      <option value="">-- Choose patient or type custom name below --</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.username} {p.mobile ? `(${p.mobile})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientNameInput}
                    onChange={(e) => setPatientNameInput(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                    Clinical Indication / Diagnosis Notes
                  </label>
                  <input
                    type="text"
                    value={requisitionNotes}
                    onChange={(e) => setRequisitionNotes(e.target.value)}
                    placeholder="e.g. Acute respiratory distress, post-op observation"
                    className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setAdmitBedId(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 hover:text-[#1E3A8A] hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={admitting}
                    className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {admitting ? "Transmitting..." : isDoctor ? "Issue Bed Allocation Order" : "Confirm Inpatient Admission"}
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
