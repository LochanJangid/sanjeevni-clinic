"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FlaskConical, 
  Share2 
} from "lucide-react";
import { getAuthToken } from "../../../lib/auth";

interface ParameterItem {
  parameter: string;
  measured_value: string;
  unit: string;
  reference_range: string;
  is_flagged: boolean;
}

interface ReportDetail {
  id: number;
  test_name: string;
  category: string;
  result_summary: string;
  status: string;
  is_abnormal: boolean;
  report_data: ParameterItem[] | string;
  clinical_notes: string;
  conducted_at: string;
  patient_name: string;
  patient_email: string;
  doctor_name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function LabReportDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      const token = getAuthToken();
      try {
        const res = await fetch(`${API_URL}/clinical/lab-reports/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Could not load diagnostic lab report.");
        const data = await res.json();
        setReport(data.report);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading report.");
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="portal-page-container p-12 text-center text-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-3" />
        <p className="text-sm">Fetching verified laboratory analysis...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="portal-page-container p-8">
        <div className="card p-6 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error || "Report not found."}
          <div className="mt-4">
            <Link href="/lab-reports" className="button button-quiet text-xs">
              ← Return to Lab Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let items: ParameterItem[] = [];
  try {
    if (typeof report.report_data === "string") {
      items = JSON.parse(report.report_data);
    } else if (Array.isArray(report.report_data)) {
      items = report.report_data;
    }
  } catch {
    items = [];
  }

  return (
    <div className="portal-page-container">
      {/* Top action controls (hidden on print) */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          href="/lab-reports"
          className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Lab Reports</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save Official Slip</span>
          </button>
        </div>
      </div>

      {/* Official Diagnostic Clinical Slip Container */}
      <div className="card p-8 bg-white border border-border shadow-sm max-w-4xl mx-auto printable-slip">
        {/* Slip Header */}
        <div className="border-b-2 border-teal-800 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-lg">
                  +
                </span>
                <span className="text-xl font-bold tracking-tight text-teal-950 uppercase">
                  SANJEEVNI PATHOLOGY &amp; DIAGNOSTIC LABS
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                NABH &amp; NABL Accredited Central Laboratory · Certificate #NABL-MC-2024
              </p>
              <p className="text-[11px] text-muted">
                Plot 42, Healthcare Boulevard, Metro Sector 18, New Delhi · Ph: +91 11-4820-9900
              </p>
            </div>

            <div className="text-right sm:border-l sm:pl-5 border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted block">
                LAB SPECIMEN ID
              </span>
              <strong className="text-sm font-mono text-foreground font-bold">
                SJ-LAB-{report.id.toString().padStart(6, "0")}
              </strong>
              <div className="mt-1 text-[11px] text-muted">
                Collected: {new Date(report.conducted_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Demographics Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Patient Name</span>
            <strong className="text-foreground text-sm font-semibold">{report.patient_name}</strong>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Referred By</span>
            <strong className="text-foreground text-sm font-semibold">{report.doctor_name || "Self-Referred"}</strong>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Investigation</span>
            <strong className="text-foreground text-sm font-semibold">{report.test_name}</strong>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Specialty</span>
            <strong className="text-teal-800 text-sm font-semibold">{report.category}</strong>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className="mb-6 flex items-center justify-between p-3 rounded-lg border text-xs font-medium"
             style={{
               background: report.is_abnormal ? "#fffbeb" : "#f0fdf4",
               borderColor: report.is_abnormal ? "#fde68a" : "#bbf7d0"
             }}>
          <div className="flex items-center gap-2">
            {report.is_abnormal ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span className={report.is_abnormal ? "text-amber-900" : "text-emerald-900"}>
              <strong>Clinical Summary:</strong> {report.result_summary}
            </span>
          </div>
          <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: report.is_abnormal ? "#fef3c7" : "#dcfce7",
                  color: report.is_abnormal ? "#92400e" : "#166534"
                }}>
            {report.is_abnormal ? "Values Flagged" : "Within Normal Limits"}
          </span>
        </div>

        {/* Diagnostic Parameters Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100/70 text-slate-700">
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">Test Parameter</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">Observed Value</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">Units</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">Biological Reference Interval</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted">
                    No specific sub-parameter breakdown available.
                  </td>
                </tr>
              ) : (
                items.map((param, idx) => (
                  <tr key={idx} className={param.is_flagged ? "bg-amber-50/40" : ""}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {param.parameter}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {param.measured_value}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {param.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {param.reference_range}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {param.is_flagged ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ELEVATED / HIGH
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clinical Notes & Recommendations */}
        {report.clinical_notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-8">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              Pathologist &amp; Clinician Remarks
            </span>
            <p className="text-slate-800 leading-relaxed">{report.clinical_notes}</p>
          </div>
        )}

        {/* Verification and Signatures Footer */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-muted">
          <div>
            <div className="flex items-center gap-1.5 text-teal-800 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>NABL Digitally Verified</span>
            </div>
            <p className="text-[10px]">
              This report is electronically verified and does not require a physical ink signature.
            </p>
          </div>

          <div className="text-center sm:text-left">
            <span className="block text-[10px] uppercase font-bold">Consultant Bio-Chemist</span>
            <strong className="text-slate-800">Dr. K. N. Sen, MD (Path)</strong>
            <span className="block text-[10px]">Registration #DMC-44910</span>
          </div>

          <div className="text-right">
            <div className="w-24 h-10 border border-dashed border-slate-300 rounded inline-flex items-center justify-center text-[10px] text-slate-400 font-mono mb-1">
              [QR VERIFIED]
            </div>
            <span className="block text-[10px]">Sanjeevni Central LIMS v3.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LabReportDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-page-container p-12 text-center text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
          <p className="text-xs">Loading laboratory analysis...</p>
        </div>
      }
    >
      <LabReportDetailContent />
    </Suspense>
  );
}
