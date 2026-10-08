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
  Sparkles
} from "lucide-react";
import { getAuthToken } from "../../lib/auth";

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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function LabReportsPage() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
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
    fetchReports();
  }, []);

  const filtered = reports.filter((r) => {
    const matchesCat = categoryFilter === "all" || r.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesSearch = r.test_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.result_summary.toLowerCase().includes(search.toLowerCase());
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
                  SYNCED VIA BARCODE MESH
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <FlaskConical className="w-7 h-7" />
                </span>
                <span>Diagnostic Lab Tests &amp; Pathology Reports</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Review clinical laboratory investigations, pathology markers, blood test profiles, and physician differential notes. Download accredited diagnostic slips for second opinions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 flex items-center gap-2 text-xs font-medium text-[#4B5563]">
                <Activity className="w-4 h-4 text-[#0D9488]" />
                <span>LAB TURNAROUND: <strong className="text-[#0D9488]">&lt; 4 HOURS</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search test name (e.g. Lipid, CBC, HbA1c, Thyroid)..."
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
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
            >
              <span>Consult a Doctor to Order Tests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
    </div>
  );
}
