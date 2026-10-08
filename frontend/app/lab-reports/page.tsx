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
  ShieldCheck
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
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
              <FlaskConical className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">EHR DIAGNOSTICS</span>
                <span className="text-xs text-muted">NABL &amp; ISO 15189 Certified Lab</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Diagnostic Lab Tests &amp; Pathology Reports
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-muted block">Direct Lab Desk</span>
              <span className="text-xs text-teal-700 font-bold">Reports Sync Within 4h</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Review your official clinical laboratory investigations, pathology markers, blood tests, and doctor notes. Download accredited diagnostic slips for second opinions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 my-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test name (e.g. Lipid, CBC, HbA1c)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
        <div className="p-12 text-center text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-3" />
          <p className="text-sm">Loading verified laboratory records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center bg-white border border-dashed border-slate-300">
          <FlaskConical className="w-12 h-12 text-muted mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold text-foreground text-base">No lab reports found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
            No diagnostic tests match your current filter or no tests have been ordered yet for this profile.
          </p>
          <Link href="/doctors" className="button button-quiet text-xs inline-flex">
            Consult a Doctor to Order Tests
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="card p-5 bg-white border border-border hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
                    {report.category}
                  </span>
                  {report.is_abnormal ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      Attention Advised
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Normal Range
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-foreground leading-snug">
                  {report.test_name}
                </h3>
                <p className="text-xs text-muted mt-1.5 line-clamp-2">
                  {report.result_summary}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted" />
                    <span>Prescribed by: {report.doctor_name || "Clinic Pathologist"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <span>Conducted: {new Date(report.conducted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/lab-reports/${report.id}`}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>View Details &amp; Values</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/lab-reports/${report.id}`}
                  className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors"
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
  );
}
