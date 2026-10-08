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
      <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-3" />
        <p className="text-xs text-gray-400">Fetching verified laboratory analysis...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto p-6 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl">
          {error || "Report not found."}
          <div className="mt-4">
            <Link href="/lab-reports" className="text-xs font-bold text-[#0D9488] hover:underline">
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
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top action controls (hidden on print) */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            href="/lab-reports"
            className="text-xs font-bold text-[#1E3A8A] hover:text-[#0D9488] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Lab Reports</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Official Slip</span>
            </button>
          </div>
        </div>

        {/* Official Diagnostic Clinical Slip Container */}
        <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-3xl printable-slip">
          {/* Slip Header */}
          <div className="border-b-2 border-[#1E3A8A] pb-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-lg">
                    +
                  </span>
                  <span className="text-xl font-bold tracking-tight text-[#1E3A8A] uppercase">
                    SANJEEVNI PATHOLOGY &amp; DIAGNOSTIC LABS
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  NABH &amp; NABL Accredited Central Laboratory · Certificate #NABL-MC-2024
                </p>
                <p className="text-[11px] text-gray-400">
                  Plot 42, Healthcare Boulevard, Metro Sector 18, New Delhi · Ph: +91 11-4820-9900
                </p>
              </div>

              <div className="text-right sm:border-l sm:pl-5 border-gray-200">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
                  LAB SPECIMEN ID
                </span>
                <strong className="text-sm font-mono text-[#1E3A8A] font-bold">
                  SJ-LAB-{report.id.toString().padStart(6, "0")}
                </strong>
                <div className="mt-1 text-[11px] text-gray-400">
                  Collected: {new Date(report.conducted_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Patient Demographics Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs mb-6">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Patient Name</span>
              <strong className="text-[#1E3A8A] text-sm font-bold">{report.patient_name}</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Referred By</span>
              <strong className="text-[#1E3A8A] text-sm font-bold">{report.doctor_name || "Self-Referred"}</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Investigation</span>
              <strong className="text-[#1E3A8A] text-sm font-bold">{report.test_name}</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Specialty</span>
              <strong className="text-[#0D9488] text-sm font-bold">{report.category}</strong>
            </div>
          </div>

          {/* Overall Status Banner */}
          <div className={`mb-6 flex items-center justify-between p-3.5 rounded-2xl border text-xs font-medium ${
            report.is_abnormal
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-teal-50 border-teal-200 text-[#0D9488]"
          }`}>
            <div className="flex items-center gap-2">
              {report.is_abnormal ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
              )}
              <span>
                <strong>Clinical Summary:</strong> {report.result_summary}
              </span>
            </div>
            <span className={`text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
              report.is_abnormal
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-teal-100 text-[#0D9488] border-teal-200"
            }`}>
              {report.is_abnormal ? "Values Flagged" : "Within Normal Limits"}
            </span>
          </div>

          {/* Diagnostic Parameters Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50 text-[#1E3A8A]">
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Test Parameter</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Observed Value</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Units</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Biological Reference Interval</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider text-right">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      No specific sub-parameter breakdown available.
                    </td>
                  </tr>
                ) : (
                  items.map((param, idx) => (
                    <tr key={idx} className={param.is_flagged ? "bg-amber-50/50" : ""}>
                      <td className="py-2.5 px-3 font-bold text-[#1E3A8A]">
                        {param.parameter}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#1E3A8A]">
                        {param.measured_value}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 font-mono">
                        {param.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[#4B5563]">
                        {param.reference_range}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {param.is_flagged ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ELEVATED / HIGH
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
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
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs mb-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A] block mb-1">
                Pathologist &amp; Clinician Remarks
              </span>
              <p className="text-[#4B5563] leading-relaxed">{report.clinical_notes}</p>
            </div>
          )}

          {/* Verification and Signatures Footer */}
          <div className="pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-gray-500">
            <div>
              <div className="flex items-center gap-1.5 text-[#0D9488] font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>NABL Digitally Verified</span>
              </div>
              <p className="text-[10px] text-gray-400">
                This report is electronically verified and does not require a physical ink signature.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Consultant Bio-Chemist</span>
              <strong className="text-[#1E3A8A]">Dr. K. N. Sen, MD (Path)</strong>
              <span className="block text-[10px] text-gray-400">Registration #DMC-44910</span>
            </div>

            <div className="text-right">
              <div className="w-24 h-10 border border-dashed border-gray-300 rounded-xl inline-flex items-center justify-center text-[10px] text-gray-400 font-mono mb-1">
                [QR VERIFIED]
              </div>
              <span className="block text-[10px] text-gray-400">Sanjeevni Central LIMS v3.2</span>
            </div>
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
        <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-2" />
          <p className="text-xs text-gray-400">Loading laboratory analysis...</p>
        </div>
      }
    >
      <LabReportDetailContent />
    </Suspense>
  );
}
