"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Code2,
  DollarSign,
  Menu,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Tv,
  X,
  CreditCard,
  Layers,
  ArrowRight
} from "lucide-react";
import LaunchLiveDemoModal, { openDemoModal } from "./LaunchLiveDemoModal";

export default function SellingHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Professional Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-slate-300 text-xs py-2 px-4 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-medium">Hospital &amp; Clinic Operating System:</span>
            <span className="text-emerald-300 font-bold">Complete Source Code, Deployment &amp; Licensing</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              Architect: <strong className="text-white">Lochan Jangid</strong>
            </span>
            <span className="hidden md:inline-block text-slate-600">•</span>
            <span className="hidden md:inline-flex items-center gap-1 text-teal-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Commercial Turnkey System</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Selling Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Bio Tag */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              LJ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  Lochan Jangid
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-wider border border-emerald-500/30">
                  HOSPITAL OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide">
                Enterprise Healthcare &amp; Medical Software Suite
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-300">
            <Link
              href="/#features"
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800 transition"
            >
              10 Core Features
            </Link>
            <Link
              href="/#opd-tv"
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Tv className="w-3.5 h-3.5 text-purple-400" />
              <span>OPD Waiting TV</span>
            </Link>
            <Link
              href="/#billing-flow"
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>PhonePe QR Billing</span>
            </Link>
            <Link
              href="/hospital-plans"
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                pathname === "/hospital-plans" || pathname === "/pricing"
                  ? "text-emerald-400 bg-emerald-950/60 border border-emerald-500/30"
                  : "hover:text-white hover:bg-slate-800"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pricing &amp; Plans</span>
            </Link>
            <Link
              href="/#developer"
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-teal-400" />
              <span>About Developer</span>
            </Link>
            <Link
              href="/#contact"
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800 transition"
            >
              Deployment &amp; Contact
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/hospital-plans"
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
            >
              View Plans
            </Link>

            {/* THE PRIMARY CONNECTING BUTTON: LAUNCH LIVE DEMO */}
            <button
              type="button"
              onClick={() => openDemoModal("admin")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Building2 className="w-4 h-4 text-slate-950" />
              <span>Launch Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => openDemoModal("admin")}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Demo 🚀
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-3">
            <div className="flex flex-col gap-1 text-sm">
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-300"
              >
                10 Core Hospital Features
              </Link>
              <Link
                href="/#opd-tv"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-300"
              >
                Live OPD Waiting Room TV
              </Link>
              <Link
                href="/#billing-flow"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-300"
              >
                PhonePe QR Invoicing
              </Link>
              <Link
                href="/hospital-plans"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 text-emerald-300 font-bold"
              >
                Commercial Pricing &amp; Plans
              </Link>
              <Link
                href="/#developer"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-300"
              >
                About Developer (Lochan Jangid)
              </Link>
              <Link
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-300"
              >
                Contact &amp; Deployment
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openDemoModal("admin");
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Building2 className="w-4 h-4 text-slate-950" />
                <span>Launch Live Demo with Your Hospital Name</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive Demo Modal */}
      <LaunchLiveDemoModal />
    </>
  );
}
