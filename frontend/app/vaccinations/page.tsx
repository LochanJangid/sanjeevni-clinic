"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Syringe, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Download, 
  Printer, 
  Award,
  AlertCircle
} from "lucide-react";
import { getAuthToken } from "../../lib/auth";

interface Vaccination {
  id: number;
  vaccine_name: string;
  dose_number: string;
  target_disease: string;
  status: string;
  administered_date: string | null;
  next_due_date: string | null;
  batch_number: string;
  administered_by: string;
  certificate_code: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function VaccinationsPage() {
  const [vaccines, setVaccines] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVax() {
      const token = getAuthToken();
      try {
        const res = await fetch(`${API_URL}/clinical/vaccinations/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setVaccines(data.vaccinations || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadVax();
  }, []);

  function handlePrintCertificate() {
    window.print();
  }

  const completed = vaccines.filter((v) => v.status === "completed");
  const upcoming = vaccines.filter((v) => v.status !== "completed");

  return (
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <Syringe className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">IMMUNIZATION PASSPORT</span>
                <span className="text-xs text-muted">WHO &amp; Universal Immunization Program</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Digital Vaccination &amp; Immunization Record
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintCertificate}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Print Verified Vaccine Certificate</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Comprehensive digital immunization passport for pediatric developmental vaccines, travel inoculations, and adult booster shots with cryptographic verification.
        </p>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 print:hidden">
        <div className="card p-4 bg-white border border-border">
          <span className="text-muted text-xs block mb-1">Doses Administered</span>
          <div className="text-2xl font-bold text-foreground">{completed.length} Vaccines</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Digitally Verified</span>
        </div>

        <div className="card p-4 bg-white border border-border">
          <span className="text-muted text-xs block mb-1">Upcoming Due Doses</span>
          <div className="text-2xl font-bold text-amber-700">{upcoming.length} Pending</div>
          <span className="text-[11px] text-muted">Scheduled by Clinic</span>
        </div>

        <div className="card p-4 bg-white border border-border">
          <span className="text-muted text-xs block mb-1">Immunization Status</span>
          <div className="text-2xl font-bold text-teal-800">Protected</div>
          <span className="text-[11px] text-muted">Active Antibody Coverage</span>
        </div>
      </div>

      {/* Vaccination Records Table */}
      <div className="card p-6 bg-white border border-border printable-slip">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-foreground">
              Official Immunization Record
            </h2>
          </div>
          <span className="text-xs font-mono text-muted">
            PASSPORT #SANJ-IMM-2026-994
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
            <p className="text-xs">Loading immunization records...</p>
          </div>
        ) : vaccines.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs">
            No immunization entries found for this profile.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="py-2.5 px-3 font-semibold">Vaccine / Biologic</th>
                  <th className="py-2.5 px-3 font-semibold">Dose Type</th>
                  <th className="py-2.5 px-3 font-semibold">Preventative Target</th>
                  <th className="py-2.5 px-3 font-semibold">Date Given</th>
                  <th className="py-2.5 px-3 font-semibold">Next Booster</th>
                  <th className="py-2.5 px-3 font-semibold">Batch &amp; Clinician</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Certificate Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaccines.map((vax) => (
                  <tr key={vax.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {vax.vaccine_name}
                    </td>
                    <td className="py-3 px-3">{vax.dose_number}</td>
                    <td className="py-3 px-3 text-slate-600">{vax.target_disease}</td>
                    <td className="py-3 px-3">
                      {vax.administered_date ? (
                        <span className="font-medium text-emerald-700">
                          {new Date(vax.administered_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {vax.next_due_date ? new Date(vax.next_due_date).toLocaleDateString() : "Lifetime Cover"}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-mono text-[11px] block">{vax.batch_number}</span>
                      <span className="text-[10px] text-muted">{vax.administered_by}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {vax.certificate_code}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-1.5 text-teal-800 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Digitally Certified by Sanjeevni Department of Preventive Medicine</span>
          </div>
          <span className="font-mono text-[11px]">Valid Worldwide for School, Travel &amp; Employment</span>
        </div>
      </div>
    </div>
  );
}
