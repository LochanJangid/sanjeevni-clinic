"use client";

import Link from "next/link";
import {
  Building2,
  Code2,
  ExternalLink,
  HeartHandshake,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Tv,
  CreditCard,
  Layers,
  ArrowRight
} from "lucide-react";
import { openDemoModal } from "./LaunchLiveDemoModal";

export default function SellingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-xs selection:bg-emerald-500 selection:text-white">
      {/* 1. CALL TO ACTION STRIP: LAUNCH LIVE DEMO */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-900/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Instant Preview</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Test This Operating System Under Your Hospital Brand
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Experience the live clinical workflows, real-time OPD waiting TV, PhonePe dynamic QR payments, and inpatient ward census with zero setup friction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => openDemoModal("admin")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/50 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Building2 className="w-5 h-5 text-slate-950" />
              <span>Launch Live Demo with Your Hospital Name</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/hospital-plans"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT COLUMNS */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Column 1: Lochan Jangid Developer Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-md">
              LJ
            </div>
            <div>
              <h4 className="text-base font-black text-white tracking-tight">Lochan Jangid</h4>
              <p className="text-[11px] text-emerald-400 font-semibold">Healthcare Software Engineer</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Specializing in high-performance hospital operating systems, clinic management SaaS, and digital healthcare automation. Architecting turnkey software for hospitals, diagnostic labs, and medical chains worldwide.
          </p>
          <div className="pt-2 flex flex-col gap-2 text-slate-300">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-semibold">Inquiries:</span>
              <a href="mailto:lochan.jangid@healthcare-tech.dev" className="hover:text-white underline">
                lochan.jangid@healthcare-tech.dev
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-teal-400 font-semibold">Deployment:</span>
              <span>Available for On-Premise &amp; Cloud Setup</span>
            </div>
          </div>
        </div>

        {/* Column 2: System Capabilities */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">System Modules</h5>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("admin")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Executive Hospital ERP &amp; Analytics
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("doctor")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Doctor OPD Workstation &amp; Rx
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("patient")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Patient Portal &amp; PhonePe Payments
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("admin")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Live OPD TV Signage Display
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("admin")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Inpatient IPD Bed Census Matrix
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("doctor")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Pathology &amp; Diagnostic Lab Reports
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openDemoModal("patient")}
                className="hover:text-emerald-300 transition text-left"
              >
                • Smart Dispensary &amp; Pharmacy
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Commercial & Licensing */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">Commercial Licensing</h5>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link href="/hospital-plans" className="hover:text-emerald-300 transition">
                • 4 Tier Commercial Pricing
              </Link>
            </li>
            <li>
              <Link href="/hospital-plans" className="hover:text-emerald-300 transition">
                • 36-Feature Comparison Matrix
              </Link>
            </li>
            <li>
              <Link href="/hospital-plans" className="hover:text-emerald-300 transition">
                • Interactive Hospital ROI Calculator
              </Link>
            </li>
            <li>
              <span className="text-slate-400">• Annual License with Data Export &amp; Escrow</span>
            </li>
            <li>
              <span className="text-slate-400">• White-Label Rebranding for Your Clinic</span>
            </li>
            <li>
              <span className="text-slate-400">• On-Premises Local Server Installation</span>
            </li>
            <li>
              <span className="text-slate-400">• Thermal Printer &amp; POS Integration</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Technology & Compliance */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">Architecture &amp; Security</h5>
          <div className="space-y-2 text-slate-400">
            <p>
              Built with Next.js 16 App Router, FastAPI Python 3.12, and PostgreSQL with robust connection pooling.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Next.js 16", "FastAPI", "PostgreSQL", "WebRTC", "UPI PhonePe", "Tailwind CSS", "TypeScript"].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-2 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero Vendor Lock-In • Self-Hostable</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 text-[11px]">
          <div>
            © 2026 <strong className="text-slate-300">Lochan Jangid</strong>. All rights reserved. Hospital Operating System Commercial Software Suite.
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openDemoModal("admin")}
              className="text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              Launch Live Demo 🚀
            </button>
            <span>•</span>
            <Link href="/hospital-plans" className="hover:text-slate-300 transition">
              Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
