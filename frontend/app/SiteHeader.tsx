"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  parseTokenClaims, 
  clearAuthSession, 
  TokenClaims 
} from "../lib/auth";
import { 
  getStoredLanguage, 
  setStoredLanguage, 
  translations, 
  Language 
} from "../lib/i18n";
import { 
  PhoneCall, 
  Stethoscope, 
  Sparkles, 
  FlaskConical, 
  Video, 
  Bed, 
  Pill, 
  Tv, 
  Syringe, 
  Activity, 
  ChevronDown, 
  Menu, 
  X,
  Globe,
  MessageSquare,
  Building2,
  Calendar,
  UserCheck,
  CreditCard
} from "lucide-react";
import { getStoredHospitalBranding, HospitalBranding } from "../lib/hospital";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [claims, setClaims] = useState<TokenClaims | null>(null);
  const [lang, setLang] = useState<Language>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branding, setBranding] = useState<HospitalBranding>({
    name: "Sanjeevni Hospital",
    city: "Jaipur",
    logo: "✚",
    logoType: "icon",
    regNumber: "CEA-RJ-2024-8842",
  });
  const hospitalName = branding.name;

  useEffect(() => {
    setBranding(getStoredHospitalBranding());
    const handleBranding = (e: any) => {
      if (e.detail) setBranding(e.detail);
    };
    window.addEventListener("hospital-branding-change", handleBranding);
    return () => window.removeEventListener("hospital-branding-change", handleBranding);
  }, []);

  useEffect(() => {
    function updateSession() {
      const token = localStorage.getItem("access_token");
      setClaims(token ? parseTokenClaims(token) : null);
    }
    updateSession();
    window.addEventListener("storage", updateSession);
    window.addEventListener("sanjeevni-session-change", updateSession);
    return () => {
      window.removeEventListener("storage", updateSession);
      window.removeEventListener("sanjeevni-session-change", updateSession);
    };
  }, []);

  useEffect(() => {
    setLang(getStoredLanguage());
    const handleLang = () => setLang(getStoredLanguage());
    window.addEventListener("sanjeevni-lang-change", handleLang);
    return () => window.removeEventListener("sanjeevni-lang-change", handleLang);
  }, []);

  const t = translations[lang];
  const username = claims?.username || "";
  const role = claims?.role || "";

  function toggleLanguage() {
    const nextLang: Language = lang === "en" ? "hi" : "en";
    setStoredLanguage(nextLang);
    setLang(nextLang);
  }

  function signOut() {
    clearAuthSession();
    router.push("/login");
  }

  return (
    <>
      {/* Top Emergency & Dispatch Strip */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white text-xs py-1.5 px-4 font-semibold">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>24x7 Ambulance &amp; Trauma Dispatch:</span>
            <a href="tel:+919999108108" className="underline font-bold tracking-wider hover:text-red-100">
              +91 9999-108-108
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/emergency" className="hidden sm:inline-block bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded text-[11px] transition-colors">
              Emergency Trauma Bay →
            </Link>
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[11px] transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === "en" ? "हिन्दी (HI)" : "English (EN)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header - Navy Blue (#1E3A8A) Secondary Authority Theme */}
      <header className="site-header sticky top-0 z-50 bg-[#1E3A8A] border-b border-blue-950/60 shadow-md">
        <div className="site-header-inner max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link className="brand flex items-center gap-2.5" href="/" aria-label="Sanjeevni Clinic">
            <span className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              ✚
            </span>
            <span>
              <span className="block text-base font-black text-white tracking-tight leading-none">SANJEEVNI CLINIC</span>
              <span className="block text-[10px] font-mono text-teal-200 tracking-wider font-semibold">SUPER-SPECIALTY PAVILION</span>
            </span>
          </Link>

          {/* Desktop Navigation - Role-Isolated */}
          <nav className="primary-nav hidden lg:flex items-center gap-1 text-xs" aria-label="Main navigation">
            {/* If ADMIN */}
            {role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/admin" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Hospital ERP Console
                </Link>
                <Link
                  href="/beds"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/beds" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Bed Census
                </Link>
                <Link
                  href="/billing"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/billing" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Billing Ledger
                </Link>
                <Link
                  href="/pharmacy"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/pharmacy" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Pharmacy Stock
                </Link>
                <Link
                  href="/opd-queue"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/opd-queue" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  OPD Queue TV
                </Link>
              </>
            ) : role === "doctor" ? (
              /* If DOCTOR */
              <>
                <Link
                  href="/doctor-portal"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/doctor-portal" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Doctor Chamber Cockpit
                </Link>
                <Link
                  href="/opd-queue"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/opd-queue" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Live OPD Waiting TV
                </Link>
                <Link
                  href="/prescriptions"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/prescriptions") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Prescriptions
                </Link>
                <Link
                  href="/teleconsult"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/teleconsult") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Video Teleconsult
                </Link>
                <Link
                  href="/lab-reports"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/lab-reports") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Lab Reports
                </Link>
              </>
            ) : role === "patient" ? (
              /* If PATIENT */
              <>
                <Link
                  href="/doctors"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/doctors") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Book Doctor
                </Link>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/dashboard" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  My Portal
                </Link>
                <Link
                  href="/appointments"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/appointments" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Visits
                </Link>
                <Link
                  href="/prescriptions"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/prescriptions") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Prescriptions (Rx)
                </Link>
                <Link
                  href="/lab-reports"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/lab-reports") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Lab Reports
                </Link>
                <Link
                  href="/vitals"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/vitals" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Vitals
                </Link>
                <Link
                  href="/chat"
                  className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    pathname === "/chat" ? "bg-blue-900/90 text-teal-200 border-b-2 border-[#0D9488]" : "text-teal-200 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>AI Health Chat</span>
                </Link>
                <Link
                  href="/billing"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/billing" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Bills
                </Link>
              </>
            ) : (
              /* If GUEST (Not Logged In) */
              <>
                <Link
                  href="/doctors"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname.startsWith("/doctors") ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Find Care &amp; Doctors
                </Link>
                <Link
                  href="/chat"
                  className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    pathname === "/chat" ? "bg-blue-900/90 text-teal-200 border-b-2 border-[#0D9488]" : "text-teal-200 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>AI Health Assistant</span>
                </Link>
                <Link
                  href="/opd-queue"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/opd-queue" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  OPD Status
                </Link>
                <Link
                  href="/beds"
                  className={`px-3 py-2 rounded-xl font-bold transition ${
                    pathname === "/beds" ? "bg-blue-900/90 text-white border-b-2 border-[#0D9488]" : "text-blue-100 hover:text-white hover:bg-blue-900/50"
                  }`}
                >
                  Hospital Beds
                </Link>
              </>
            )}
          </nav>

          {/* User Controls & Session Actions */}
          <div className="header-actions flex items-center gap-2.5">
            <Link
              href="/emergency"
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>SOS</span>
            </Link>

            {username ? (
              <div className="flex items-center gap-2">
                <Link
                  href={role === "admin" ? "/admin" : role === "doctor" ? "/doctor-portal" : "/dashboard"}
                  className="px-3 py-1.5 rounded-xl bg-blue-900/70 border border-blue-400/30 hover:bg-blue-900 text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                    role === "admin" ? "bg-blue-800 text-teal-300" : role === "doctor" ? "bg-teal-800 text-teal-200" : "bg-blue-800 text-white"
                  }`}>
                    {role}
                  </span>
                  <span className="truncate max-w-[120px]">{username}</span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-950 text-blue-200 hover:text-white text-xs font-semibold border border-blue-900 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-white font-bold text-xs border border-blue-400/30 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/registration"
                  className="px-3 py-1.5 rounded-xl border border-blue-300/40 hover:bg-blue-900/50 text-white font-bold text-xs transition hidden sm:inline-block"
                >
                  Register
                </Link>
                <Link
                  href="/doctors"
                  className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition hidden sm:inline-block"
                >
                  Book Visit
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-blue-200 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1E3A8A] border-t border-blue-900 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {role === "admin" ? (
                <>
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-white rounded-xl font-bold border border-blue-800">
                    👑 Admin Console
                  </Link>
                  <Link href="/beds" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    🛏️ Bed Census
                  </Link>
                  <Link href="/billing" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    💳 Billing Ledger
                  </Link>
                  <Link href="/pharmacy" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    💊 Pharmacy
                  </Link>
                </>
              ) : role === "doctor" ? (
                <>
                  <Link href="/doctor-portal" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-white rounded-xl font-bold border border-blue-800">
                    🩺 Doctor Chamber
                  </Link>
                  <Link href="/opd-queue" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    ⏱️ OPD Queue TV
                  </Link>
                  <Link href="/prescriptions" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    📝 Prescriptions
                  </Link>
                  <Link href="/teleconsult" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    📹 Teleconsult
                  </Link>
                </>
              ) : role === "patient" ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-white rounded-xl font-bold border border-blue-800">
                    👤 My Portal
                  </Link>
                  <Link href="/doctors" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    🩺 Find Doctor
                  </Link>
                  <Link href="/appointments" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    📅 Appointments
                  </Link>
                  <Link href="/prescriptions" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    📝 Prescriptions
                  </Link>
                  <Link href="/lab-reports" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    🔬 Lab Reports
                  </Link>
                  <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-teal-300 rounded-xl font-bold border border-blue-800">
                    ⚡ AI Health Chat
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/doctors" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-white rounded-xl font-bold border border-blue-800">
                    🩺 Book Doctor
                  </Link>
                  <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-teal-300 rounded-xl font-bold border border-blue-800">
                    ⚡ AI Health Chat
                  </Link>
                  <Link href="/opd-queue" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    ⏱️ OPD Status
                  </Link>
                  <Link href="/beds" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-900 text-blue-100 rounded-xl font-bold border border-blue-800">
                    🛏️ Hospital Beds
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-blue-950 text-white rounded-xl font-bold border border-blue-800">
                    🔑 Sign In
                  </Link>
                  <Link href="/registration" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-[#0D9488] text-white rounded-xl font-bold">
                    📝 Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
