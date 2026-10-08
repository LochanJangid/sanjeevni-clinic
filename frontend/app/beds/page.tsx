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
  ShieldCheck
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
  const isStaff = claims?.role === "admin" || claims?.role === "doctor";

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

  useEffect(() => {
    loadBeds();
  }, []);

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
        body: JSON.stringify({ patient_name: patientNameInput.trim() }),
      });
      if (res.ok) {
        setAdmitBedId(null);
        setPatientNameInput("");
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

  return (
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-purple-100 text-purple-800 rounded-xl">
              <Bed className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">INPATIENT IPD SUITE</span>
                <span className="text-xs text-muted">Real-Time Ward &amp; Bed Occupancy</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {hospitalName} Ward &amp; Bed Census
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted bg-white border border-border px-3 py-1.5 rounded-lg shadow-sm">
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>Facility Status: <strong>Open 24x7 Admissions</strong></span>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Live monitor of inpatient hospital beds across Intensive Care Units (ICU), Semi-Private suites, General Wards, and Post-Op Daycare.
        </p>
      </div>

      {/* Hospital Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6">
          <div className="card p-4 bg-white border border-border">
            <span className="text-[11px] font-bold uppercase text-muted block mb-1">
              Total Inpatient Beds
            </span>
            <div className="text-2xl font-bold text-foreground">{summary.total_beds}</div>
            <span className="text-[11px] text-muted">Across 4 Medical Wings</span>
          </div>

          <div className="card p-4 bg-white border border-border">
            <span className="text-[11px] font-bold uppercase text-muted block mb-1">
              Occupied Beds
            </span>
            <div className="text-2xl font-bold text-amber-700">{summary.occupied_beds}</div>
            <span className="text-[11px] text-muted">Current Inpatients</span>
          </div>

          <div className="card p-4 bg-white border border-border">
            <span className="text-[11px] font-bold uppercase text-muted block mb-1">
              Available Vacancies
            </span>
            <div className="text-2xl font-bold text-emerald-700">{summary.available_beds}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Ready for Admission</span>
          </div>

          <div className="card p-4 bg-white border border-border">
            <span className="text-[11px] font-bold uppercase text-muted block mb-1">
              Oxygen-Ready Beds
            </span>
            <div className="text-2xl font-bold text-blue-700">{summary.oxygen_available_beds}</div>
            <span className="text-[11px] text-muted">With Central O2 Line</span>
          </div>

          <div className="card p-4 bg-white border border-border">
            <span className="text-[11px] font-bold uppercase text-muted block mb-1">
              Occupancy Rate
            </span>
            <div className="text-2xl font-bold text-teal-800">{summary.occupancy_rate}%</div>
            <span className="text-[11px] text-muted">Target Operating Buffer</span>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 my-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bed number (e.g. ICU-101) or patient name..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="all">All Wards</option>
            <option value="icu">ICU (Intensive Care)</option>
            <option value="semi-private">Semi-Private</option>
            <option value="general ward">General Ward</option>
            <option value="daycare">Daycare</option>
          </select>
        </div>
      </div>

      {/* Bed Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
          <p className="text-sm">Fetching ward statuses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((bed) => (
            <div
              key={bed.id}
              className={`card p-5 border transition-all ${
                bed.is_occupied
                  ? "bg-amber-50/30 border-amber-200"
                  : "bg-white border-border hover:border-emerald-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-base font-bold text-foreground font-mono">
                    {bed.bed_number}
                  </span>
                  <span className="text-xs text-muted block">{bed.floor}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {bed.has_oxygen && (
                    <span
                      className="p-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold flex items-center gap-1"
                      title="Central Oxygen Supported"
                    >
                      <Wind className="w-3 h-3" />
                      <span>O2</span>
                    </span>
                  )}
                  {bed.is_occupied ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      OCCUPIED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      VACANT / AVAILABLE
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted">Ward Type:</span>
                  <strong className="text-slate-800">{bed.ward_type}</strong>
                </div>

                {bed.is_occupied ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">Inpatient:</span>
                      <strong className="text-slate-900">{bed.patient_name}</strong>
                    </div>
                    {bed.doctor_name && (
                      <div className="flex justify-between">
                        <span className="text-muted">Attending MD:</span>
                        <span className="text-teal-800 font-semibold">{bed.doctor_name}</span>
                      </div>
                    )}
                    {bed.admitted_at && (
                      <div className="flex justify-between">
                        <span className="text-muted">Admitted:</span>
                        <span>{new Date(bed.admitted_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-emerald-700 font-medium text-[11px] pt-1">
                    ✓ Sanitized and prepped for admission
                  </div>
                )}
              </div>

              {/* Staff Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                {bed.is_occupied ? (
                  <button
                    type="button"
                    onClick={() => handleDischarge(bed.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Discharge Inpatient</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdmitBedId(bed.id)}
                    className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Admit Patient to Bed</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admit Modal */}
      {admitBedId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-border">
            <h3 className="text-base font-bold text-foreground mb-1">
              Admit Inpatient to Bed
            </h3>
            <p className="text-xs text-muted mb-4">
              Enter patient full name to reserve this hospital bed.
            </p>

            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={patientNameInput}
                  onChange={(e) => setPatientNameInput(e.target.value)}
                  placeholder="E.g. Ramesh Kumar"
                  className="w-full text-xs p-2.5 border border-border rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdmitBedId(null)}
                  className="px-4 py-2 border border-border text-muted hover:text-foreground text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitting}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {admitting ? "Admitting..." : "Confirm Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
