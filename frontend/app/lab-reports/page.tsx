"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FlaskConical, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Download, 
  Search, 
  Filter, 
  ArrowRight,
  ShieldCheck, 
  Activity, 
  Sparkles,
  Plus,
  X
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";

interface LabReport {
  id: number;
  test_name: string;
  category: string;
  result_summary: string;
  status: string;
  is_abnormal: boolean;
  clinical_notes: string;
  conducted_at: string;
  doctor_name: string;
  patient_name?: string;
}

interface PatientOption {
  id: number;
  username: string;
  email: string;
  mobile?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const PRESET_TESTS = [
  {
    name: "Complete Blood Count (CBC) with Platelets",
    category: "Hematology",
    ref: "Hb: 13.0-17.0 g/dL, Platelets: 1.5-4.5 L/mcL",
    defaultSummary: "Hb: 13.8 g/dL, TLC: 7,200 /mcL, Platelets: 2.8 Lakh /mcL within physiological limits.",
  },
  {
    name: "Lipid Profile Comprehensive",
    category: "Biochemistry",
    ref: "Total Chol: <200 mg/dL, Triglycerides: <150 mg/dL",
    defaultSummary: "Total Chol: 182 mg/dL, Triglycerides: 135 mg/dL, HDL: 48 mg/dL, LDL: 107 mg/dL.",
  },
  {
    name: "HbA1c Glycated Hemoglobin",
    category: "Diabetology",
    ref: "Normal: <5.7%, Pre-diabetic: 5.7-6.4%, Diabetic: >=6.5%",
    defaultSummary: "HbA1c: 5.8% (Borderline optimal glycemic control).",
  },
  {
    name: "Thyroid Profile (TSH, Free T3, Free T4)",
    category: "Endocrinology",
    ref: "TSH: 0.35-4.94 uIU/mL",
    defaultSummary: "TSH: 2.45 uIU/mL (Euthyroid state).",
  },
  {
    name: "Comprehensive Liver Function Test (LFT)",
    category: "Biochemistry",
    ref: "SGOT: <40 U/L, SGPT: <45 U/L, Bilirubin: <1.2 mg/dL",
    defaultSummary: "Bilirubin: 0.8 mg/dL, SGOT: 28 U/L, SGPT: 32 U/L.",
  },
  {
    name: "Renal Function Panel (KFT)",
    category: "Biochemistry",
    ref: "Serum Creatinine: 0.7-1.3 mg/dL, Urea: 15-45 mg/dL",
    defaultSummary: "Creatinine: 0.95 mg/dL, Blood Urea: 24 mg/dL.",
  },
];

export default function LabReportsPage() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState("patient");
  const [patients, setPatients] = useState<PatientOption[]>([]);

  // Doctor Fill Report Modal State
  const [showFillModal, setShowFillModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | "">("");
  const [testName, setTestName] = useState(PRESET_TESTS[0].name);
  const [category, setCategory] = useState(PRESET_TESTS[0].category);
  const [resultSummary, setResultSummary] = useState(PRESET_TESTS[0].defaultSummary);
  const [referenceRange, setReferenceRange] = useState(PRESET_TESTS[0].ref);
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("Sample analyzed under automated NABL calibration. Correlate with clinical symptoms.");
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  async function fetchReports() {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/clinical/lab-reports/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const claims = parseTokenClaims(token);
      if (claims?.role) setUserRole(claims.role);

      // If doctor or admin, fetch patients list for dropdown
      if (claims?.role === "doctor" || claims?.role === "admin") {
        fetch(`${API_URL}/clinical/patients-list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.patients && data.patients.length > 0) {
              setPatients(data.patients);
              setSelectedPatientId(data.patients[0].id);
            }
          })
          .catch(() => {});
      }
    }
    fetchReports();
  }, []);

  function handlePresetChange(name: string) {
    const preset = PRESET_TESTS.find((p) => p.name === name);
    if (preset) {
      setTestName(preset.name);
      setCategory(preset.category);
      setResultSummary(preset.defaultSummary);
      setReferenceRange(preset.ref);
    } else {
      setTestName(name);
    }
  }

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) {
      alert("Please select a patient.");
      return;
    }
    setSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/lab-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: Number(selectedPatientId),
          test_name: testName,
          category,
          result_summary: resultSummary,
          is_abnormal: isAbnormal,
          clinical_notes: `${clinicalNotes} (Ref Range: ${referenceRange})`,
          report_data: [
            { parameter: "Measured Value", result: resultSummary, reference_range: referenceRange, abnormal: isAbnormal }
          ],
        }),
      });

      if (res.ok) {
        setSuccessBanner(`✓ Certified Lab Report for "${testName}" successfully saved and issued.`);
        setTimeout(() => setSuccessBanner(null), 7000);
        setShowFillModal(false);
        await fetchReports();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create lab report.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error creating lab report.");
    } finally {
      setSubmitting(false);
    }
  }

  const isDoctorOrAdmin = userRole === "doctor" || userRole === "admin";

  const filtered = reports.filter((r) => {
    const matchesCat = categoryFilter === "all" || r.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesSearch = r.test_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.result_summary.toLowerCase().includes(search.toLowerCase()) ||
                          (r.patient_name && r.patient_name.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Diagnostics Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <FlaskConical className="w-3 h-3 text-[#0D9488]" />
                  EHR DIAGNOSTICS REPOSITORY
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#1E3A8A]" />
                  NABL &amp; ISO 15189 CERTIFIED
                </span>
                <span className="text-xs font-mono text-gray-400">
                  AUTOMATED PATHOLOGY MESH
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <FlaskConical className="w-7 h-7" />
                </span>
                <span>Diagnostic Lab Tests &amp; Pathology Reports</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Review clinical laboratory investigations, pathology markers, blood test profiles, and physician differential notes. Verified results directly synced to electronic medical records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isDoctorOrAdmin && (
                <button
                  type="button"
                  onClick={() => setShowFillModal(true)}
                  className="px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>+ Fill &amp; Issue Lab Report</span>
                </button>
              )}

              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 flex items-center gap-2 text-xs font-medium text-[#4B5563]">
                <Activity className="w-4 h-4 text-[#0D9488]" />
                <span>LAB TURNAROUND: <strong className="text-[#0D9488]">&lt; 4 HOURS</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#0D9488] flex items-center justify-between">
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className="p-1 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search test name or patient (e.g. Lipid, CBC, HbA1c, Thyroid)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-[#1E3A8A] focus:outline-none focus:border-[#0D9488]"
            >
              <option value="all">All Specialties</option>
              <option value="biochemistry">Biochemistry</option>
              <option value="hematology">Hematology</option>
              <option value="diabetology">Diabetology</option>
              <option value="endocrinology">Endocrinology</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mb-3" />
            <p className="text-sm font-medium text-gray-500">LOADING VERIFIED LABORATORY RECORDS...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center space-y-3 shadow-sm">
            <FlaskConical className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-[#1E3A8A] text-base">No Lab Reports Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No diagnostic tests match your current filter or no tests have been ordered yet for this profile.
            </p>
            {isDoctorOrAdmin ? (
              <button
                type="button"
                onClick={() => setShowFillModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
              >
                <span>+ Fill &amp; Issue First Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/doctors"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
              >
                <span>Consult a Doctor to Order Tests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((report) => (
              <div
                key={report.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#0D9488]/40 hover:shadow-md transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                      {report.category}
                    </span>
                    {report.is_abnormal ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>ATTENTION ADVISED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0D9488] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[#0D9488]" />
                        <span>NORMAL RANGE</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#1E3A8A] leading-snug">
                    {report.test_name}
                  </h3>

                  {report.patient_name && (
                    <div className="mt-1 text-[11px] font-semibold text-[#0D9488]">
                      Patient: {report.patient_name}
                    </div>
                  )}

                  <p className="text-xs text-[#4B5563] mt-1.5 line-clamp-2">
                    {report.result_summary}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>MD: {report.doctor_name || "Clinic Pathologist"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Conducted: {new Date(report.conducted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/lab-reports/${report.id}`}
                    className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1 transition"
                  >
                    <span>View Biomarkers &amp; Slips</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/lab-reports/${report.id}`}
                    className="p-2 text-gray-400 hover:text-[#1E3A8A] rounded-xl hover:bg-slate-100 transition"
                    title="Download accredited report"
                  >
                    <Download className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Doctor Fill Lab Report Modal */}
      {showFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-[#1E3A8A] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowFillModal(false)}
                className="absolute right-4 top-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] tracking-widest uppercase font-bold text-teal-200 block">
                PATHOLOGY CLINICAL ENTRY STATION
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">
                Fill &amp; Issue Certified Lab Diagnostic Report
              </h2>
            </div>

            <form onSubmit={handleCreateReport} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Patient Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Patient:
                </label>
                {patients.length > 0 ? (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.username} ({p.email} · {p.mobile || "No Mobile"}) - ID #{p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="Enter Patient User ID (e.g. 1)"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                  />
                )}
              </div>

              {/* Preset Test Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Test Template:
                  </label>
                  <select
                    value={testName}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                  >
                    {PRESET_TESTS.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category:
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              {/* Measured Result Value */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Measured Result Summary &amp; Values:
                </label>
                <textarea
                  rows={3}
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  required
                  placeholder="e.g. Total Cholesterol: 182 mg/dL, HDL: 48 mg/dL"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              {/* Reference Range */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reference Range:
                </label>
                <input
                  type="text"
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  placeholder="e.g. 13.0 - 17.0 g/dL"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              {/* Abnormal Flag */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="abnormalCheckbox"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="w-4 h-4 text-[#0D9488] rounded"
                />
                <label htmlFor="abnormalCheckbox" className="font-semibold text-slate-700 cursor-pointer">
                  Flag as Abnormal / Requires Clinical Attention (Highlights in amber for patient)
                </label>
              </div>

              {/* Doctor Clinical Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Attending Doctor Clinical Notes:
                </label>
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Clinical assessment or differential diagnosis notes"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFillModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Certifying Report…" : "Submit & Certify Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
