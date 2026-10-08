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
  AlertCircle,
  Sparkles,
  Zap
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
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Immunization Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Syringe className="w-3.5 h-3.5 text-[#0D9488]" />
                  IMMUNIZATION PASSPORT
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  WHO &amp; UIP COMPLIANT
                </span>
                <span className="text-xs font-mono text-gray-400">
                  CRYPTOGRAPHIC VERIFICATION
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Syringe className="w-7 h-7" />
                </span>
                <span>Digital Vaccination &amp; Immunization Record</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Comprehensive digital immunization passport for pediatric developmental vaccines, travel inoculations, and adult booster shots with cryptographic verification.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrintCertificate}
              className="px-5 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm flex items-center gap-2.5 transition self-start lg:self-auto print:hidden cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Verified Vaccine Certificate</span>
            </button>
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488] transition">
            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">DOSES ADMINISTERED</span>
            <div className="text-3xl font-bold text-[#1E3A8A] tracking-tight">
              {completed.length} Vaccines
            </div>
            <span className="text-[11px] text-[#0D9488] font-semibold block mt-1">
              ✓ Digitally Signed &amp; Recorded
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">UPCOMING BOOSTER DOSES</span>
            <div className="text-3xl font-bold text-[#1E3A8A] tracking-tight">
              {upcoming.length} Pending
            </div>
            <span className="text-[11px] text-amber-600 font-semibold block mt-1">
              Scheduled on Clinical Roster
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition">
            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">IMMUNIZATION STATUS</span>
            <div className="text-3xl font-bold text-[#0D9488] tracking-tight">
              Protected
            </div>
            <span className="text-[11px] text-[#4B5563] block mt-1">
              Active Antibody Coverage
            </span>
          </div>
        </div>

        {/* Vaccination Records Table */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 printable-slip">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0D9488]" />
              <h2 className="text-base font-bold text-[#1E3A8A]">
                Official Clinical Immunization Record
              </h2>
            </div>
            <span className="text-xs font-mono text-[#1E3A8A] bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl font-bold">
              PASSPORT #SANJ-IMM-2026-994
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-2" />
              <p className="text-xs text-gray-400">Loading immunization records...</p>
            </div>
          ) : vaccines.length === 0 ? (
            <div className="p-16 text-center text-xs text-gray-400">
              No immunization entries found for this profile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase font-bold text-[#1E3A8A] bg-gray-50/50">
                    <th className="py-3 px-3">Vaccine / Biologic</th>
                    <th className="py-3 px-3">Dose Type</th>
                    <th className="py-3 px-3">Preventative Target</th>
                    <th className="py-3 px-3">Date Given</th>
                    <th className="py-3 px-3">Next Booster</th>
                    <th className="py-3 px-3">Batch &amp; Clinician</th>
                    <th className="py-3 px-3 text-right">Certificate Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vaccines.map((vax) => (
                    <tr key={vax.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-3 font-bold text-[#1E3A8A] text-sm">
                        {vax.vaccine_name}
                      </td>
                      <td className="py-3.5 px-3 text-[#0D9488] font-semibold">{vax.dose_number}</td>
                      <td className="py-3.5 px-3 text-[#4B5563]">{vax.target_disease}</td>
                      <td className="py-3.5 px-3">
                        {vax.administered_date ? (
                          <span className="font-semibold text-emerald-600">
                            {new Date(vax.administered_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[#4B5563]">
                        {vax.next_due_date ? new Date(vax.next_due_date).toLocaleDateString() : "Lifetime Cover"}
                      </td>
                      <td className="py-3.5 px-3 text-[#4B5563]">
                        <span className="text-[#1E3A8A] font-medium block">{vax.batch_number}</span>
                        <span className="text-[10px] text-gray-400">{vax.administered_by}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-[#0D9488] font-mono text-[11px] font-bold">
                          {vax.certificate_code}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5563]">
            <div className="flex items-center gap-1.5 text-[#0D9488] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Digitally Certified by Sanjeevni Department of Preventive Medicine</span>
            </div>
            <span className="text-[11px] text-gray-400">Valid Worldwide for Travel, Schools &amp; Visa Registries</span>
          </div>
        </section>

      </div>
    </div>
  );
}
