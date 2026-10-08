"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Code2, Edit3, Heart, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { getStoredHospitalName, setStoredHospitalName } from "../lib/hospital";

export default function HospitalFooter() {
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newNameInput, setNewNameInput] = useState("");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleNameChange = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleNameChange);
    return () => window.removeEventListener("hospital-name-change", handleNameChange);
  }, []);

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (newNameInput.trim()) {
      setStoredHospitalName(newNameInput.trim());
      setHospitalName(newNameInput.trim());
      setShowRenameModal(false);
    }
  }

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white no-print">
      {/* Upper Hospital Facility Bar */}
      <div className="bg-slate-900 text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              ✚
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {hospitalName}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setNewNameInput(hospitalName);
                    setShowRenameModal(true);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Rename hospital in demo"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Rename</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Digital Outpatient, Inpatient &amp; Diagnostic Healthcare Management Ecosystem
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/doctors" className="text-slate-300 hover:text-white transition">
              Find Doctors
            </Link>
            <Link href="/appointments" className="text-slate-300 hover:text-white transition">
              Appointments
            </Link>
            <Link href="/opd-queue" className="text-slate-300 hover:text-white transition">
              OPD TV Signage
            </Link>
            <Link href="/beds" className="text-slate-300 hover:text-white transition">
              Bed Census
            </Link>
            <Link href="/billing" className="text-slate-300 hover:text-white transition">
              Billing &amp; Receipts
            </Link>
            <Link href="/prescriptions" className="text-slate-300 hover:text-white transition">
              Prescriptions
            </Link>
          </div>
        </div>
      </div>

      {/* DEVELOPER CREDIT & BACK TO PRODUCT SELLING PORTAL STRIP (AS REQUESTED) */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-t border-emerald-500/20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
          {/* Developer Identity */}
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
              <Code2 className="w-3 h-3" />
              <span>Full System Architect &amp; Software Engineer</span>
            </div>
            <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
              Architected &amp; Built by <span className="text-emerald-400">Lochan Jangid</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Healthcare Software Engineer. Providing reliable patient, doctor, and admin hospital systems with custom branding, annual licensing with software escrow, and local deployment for hospitals &amp; clinics.
            </p>
          </div>

          {/* Action to Return to Lochan's Product Sales Portal */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lochan&apos;s Product Sales &amp; Licensing Portal</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setNewNameInput(hospitalName);
                setShowRenameModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs border border-white/10 transition"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Change Hospital Name</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 Lochan Jangid. Commercial Hospital Operating System. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ready for Commercial Deployment</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rename Hospital Modal */}
      {showRenameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
          onClick={() => setShowRenameModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                🏥
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  White-Label Hospital Rebranding
                </h3>
                <p className="text-xs text-slate-500">
                  Change the active hospital name across the entire operating system
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveName} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Hospital or Clinic Name:
                </label>
                <input
                  type="text"
                  required
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  placeholder="e.g. Apollo Multi-Specialty Clinic"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50"
                  autoFocus
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Apollo Health City",
                    "Max Super-Specialty Hospital",
                    "Fortis Care Clinic",
                    "LifeLine Nursing Home",
                    "City Multi-Specialty Center",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewNameInput(preset)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition"
                >
                  Apply &amp; Rebrand System →
                </button>
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
