"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  parseTokenClaims, 
  clearAuthSession, 
  loginAsDemoRole, 
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
  ArrowLeft
} from "lucide-react";
import { getStoredHospitalName } from "../lib/hospital";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [claims, setClaims] = useState<TokenClaims | null>(null);
  const [switching, setSwitching] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleHospital = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleHospital);
    return () => window.removeEventListener("hospital-name-change", handleHospital);
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

  async function handleDemoSwitch(targetRole: "patient" | "doctor" | "admin") {
    setSwitching(true);
    try {
      const ok = await loginAsDemoRole(targetRole);
      if (ok) {
        if (targetRole === "admin") router.push("/admin");
        else if (targetRole === "doctor") router.push("/doctor-portal");
        else router.push("/dashboard");
      }
    } finally {
      setSwitching(false);
    }
  }

  // Quick modules menu
  const clinicalModules = [
    { href: "/symptom-checker", label: "AI Symptom Triage", icon: Sparkles, desc: "Evidence-based triage" },
    { href: "/lab-reports", label: "Diagnostic Lab Reports", icon: FlaskConical, desc: "Pathology & blood tests" },
    { href: "/teleconsult", label: "Video Teleconsultation", icon: Video, desc: "Virtual doctor visits" },
    { href: "/vitals", label: "Patient Vitals & EHR", icon: Activity, desc: "BP, pulse & biomarkers" },
    { href: "/beds", label: "Hospital Bed Occupancy", icon: Bed, desc: "Inpatient IPD wards" },
    { href: "/pharmacy", label: "Clinic Pharmacy", icon: Pill, desc: "Dispensary & orders" },
    { href: "/opd-queue", label: "OPD Waiting Room TV", icon: Tv, desc: "Live token display" },
    { href: "/vaccinations", label: "Vaccine Passport", icon: Syringe, desc: "Immunization records" },
  ];

  return (
    <>
      {/* Top Emergency SOS Strip */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white text-xs py-1.5 px-4 font-semibold">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>24x7 Ambulance &amp; Trauma Hotline:</span>
            <a href="tel:+919999108108" className="underline font-bold tracking-wider hover:text-red-100">
              +91 9999-108-108
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/emergency" className="hidden sm:inline-block bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[11px] transition-colors">
              Emergency Command Center →
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

      {/* SaaS Demo Role Bar */}
      <div className="saas-demo-bar">
        <div className="saas-demo-bar-inner">
          <div className="saas-badge-group">
            <span className="saas-pulse-dot" />
            <span className="saas-platform-label">{hospitalName.toUpperCase()} OS</span>
          </div>
          <div className="saas-switcher flex items-center gap-2">
            <span className="switcher-text">{t.selectRole}:</span>
            <button
              type="button"
              disabled={switching}
              onClick={() => handleDemoSwitch("patient")}
              className={`switcher-pill ${role === "patient" ? "active" : ""}`}
            >
              {t.patient} Portal
            </button>
            <button
              type="button"
              disabled={switching}
              onClick={() => handleDemoSwitch("doctor")}
              className={`switcher-pill ${role === "doctor" ? "active" : ""}`}
            >
              {t.doctor} Workspace
            </button>
            <button
              type="button"
              disabled={switching}
              onClick={() => handleDemoSwitch("admin")}
              className={`switcher-pill ${role === "admin" ? "active" : ""}`}
            >
              Hospital {t.adminRole}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/dashboard" aria-label="Hospital home">
            <span className="brand-mark" aria-hidden="true">+</span>
            <span>
              <span className="brand-name">{hospitalName}</span>
              <span className="brand-caption">CLINIC OS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="primary-nav hidden lg:flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/doctors"
              className={`nav-link ${pathname.startsWith("/doctors") ? "active" : ""}`}
            >
              {t.findCare}
            </Link>

            {/* Clinical OS Modules Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                className="nav-link flex items-center gap-1 focus:outline-none"
              >
                <span>Clinical Modules</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform" />
              </button>

              <div className="absolute left-0 top-full pt-2 w-72 hidden group-hover:block z-50">
                <div className="card p-2 bg-white rounded-2xl shadow-xl border border-border grid grid-cols-1 gap-1">
                  {clinicalModules.map((m) => {
                    const Icon = m.icon;
                    return (
                      <Link
                        key={m.href}
                        href={m.href}
                        className="p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-3 transition-colors text-xs"
                      >
                        <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <strong className="block text-slate-900 font-semibold">{m.label}</strong>
                          <span className="text-[11px] text-muted">{m.desc}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {role === "admin" ? (
              <Link href="/admin" className={`nav-link ${pathname === "/admin" ? "active" : ""}`}>
                {t.admin}
              </Link>
            ) : role === "doctor" ? (
              <Link href="/doctor-portal" className={`nav-link ${pathname === "/doctor-portal" ? "active" : ""}`}>
                {t.doctorPortal}
              </Link>
            ) : (
              <Link href="/dashboard" className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}>
                {t.myDashboard}
              </Link>
            )}

            <Link href="/prescriptions" className={`nav-link ${pathname.startsWith("/prescriptions") ? "active" : ""}`}>
              {t.records}
            </Link>

            <Link href="/billing" className={`nav-link ${pathname === "/billing" ? "active" : ""}`}>
              Billing &amp; Invoices
            </Link>
          </nav>

          {/* User Controls & Actions */}
          <div className="header-actions flex items-center gap-3">
            <Link
              href="/emergency"
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>SOS</span>
            </Link>

            {username ? (
              <div className="session-status flex items-center gap-2">
                <Link
                  href={role === "admin" ? "/admin" : role === "doctor" ? "/doctor-portal" : "/dashboard"}
                  className="user-pill text-xs"
                >
                  <span className="role-tag uppercase">{role}</span>
                  <span className="username font-semibold">{username}</span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="button button-quiet text-xs py-1.5 px-2.5"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="login-actions flex items-center gap-2">
                <Link href="/login" className="button button-quiet text-xs py-1.5 px-3">
                  {t.login}
                </Link>
                <Link href="/doctors" className="button button-primary text-xs py-1.5 px-3 hidden sm:inline-flex">
                  {t.bookNow}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-black focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/doctors" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                🩺 Find Care
              </Link>
              <Link href="/symptom-checker" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                ⚡ AI Triage
              </Link>
              <Link href="/lab-reports" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                🔬 Lab Reports
              </Link>
              <Link href="/teleconsult" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                📹 Teleconsult
              </Link>
              <Link href="/vitals" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                📈 Vitals Tracker
              </Link>
              <Link href="/beds" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                🛏️ Hospital Beds
              </Link>
              <Link href="/pharmacy" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                💊 Pharmacy
              </Link>
              <Link href="/opd-queue" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                ⏱️ OPD Queue TV
              </Link>
              <Link href="/vaccinations" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                💉 Vaccines
              </Link>
              <Link href="/billing" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg font-medium">
                💳 Billing &amp; Invoices
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
