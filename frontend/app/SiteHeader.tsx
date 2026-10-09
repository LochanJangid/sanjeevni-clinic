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
  CreditCard,
  Bell,
  LogOut
} from "lucide-react";
import { getStoredHospitalBranding, HospitalBranding } from "../lib/hospital";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RoleNotification {
  id: number;
  recipient_role: string;
  recipient_id: number | null;
  title: string;
  message: string;
  category: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [claims, setClaims] = useState<TokenClaims | null>(null);
  const [lang, setLang] = useState<Language>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [branding, setBranding] = useState<HospitalBranding>({
    name: "Sanjeevni",
    city: "chumantar gali jaipur",
    logo: "✚",
    logoType: "icon",
    regNumber: "CEA-RJ-2024-8842",
  });
  const hospitalName = branding.name;

  async function fetchNotifications() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/clinical/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [claims]);

  async function markNotificationAsRead(id: number, link?: string | null) {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch(`${API_URL}/clinical/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotificationsOpen(false);
    if (link) {
      router.push(link);
    }
  }

  async function markAllNotificationsRead() {
    const token = localStorage.getItem("access_token");
    if (token) {
      await fetch(`${API_URL}/clinical/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

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
        <div className="site-header-inner max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-2">
          <Link className="brand flex items-center gap-2 sm:gap-2.5 shrink-0" href="/" aria-label="Sanjeevni Clinic">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
              ✚
            </span>
            <span className="shrink-0">
              <span className="block text-sm sm:text-base font-black text-white tracking-tight leading-none">SANJEEVNI CLINIC</span>
              <span className="hidden sm:block text-[10px] font-mono text-teal-200 tracking-wider font-semibold">SUPER-SPECIALTY PAVILION</span>
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
          <div className="header-actions flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              href="/emergency"
              className="px-2 sm:px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shrink-0"
              title="24x7 Ambulance & Trauma Dispatch"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="text-[11px] sm:text-xs">SOS</span>
            </Link>

            {/* Notification Bell (Only if logged in) */}
            {username && (
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 sm:p-2 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-blue-200 hover:text-white relative transition shrink-0 border border-blue-400/20"
                aria-label="Clinical notifications"
                title={`${unreadCount} Unread Notifications for ${role}`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] font-bold px-1 rounded-full min-w-[15px] h-3.5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {username ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <Link
                  href={role === "admin" ? "/admin" : role === "doctor" ? "/doctor-portal" : "/dashboard"}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-blue-900/70 border border-blue-400/30 hover:bg-blue-900 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  title={`Logged in as ${username} (${role})`}
                >
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                    role === "admin" ? "bg-blue-800 text-teal-300" : role === "doctor" ? "bg-teal-800 text-teal-200" : "bg-blue-800 text-white"
                  }`}>
                    {role}
                  </span>
                  <span className="truncate max-w-[55px] xs:max-w-[85px] sm:max-w-[120px]">{username}</span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-950 text-blue-200 hover:text-white text-xs font-semibold border border-blue-900 transition flex items-center gap-1 shrink-0"
                  title="Sign Out of Sanjeevni Clinic"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <Link
                  href="/login"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-white font-bold text-xs border border-blue-400/30 transition shrink-0"
                >
                  Sign In
                </Link>
                <Link
                  href="/registration"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-300/40 hover:bg-blue-900/50 text-white font-bold text-xs transition hidden sm:inline-block shrink-0"
                >
                  Register
                </Link>
                <Link
                  href="/doctors"
                  className="px-3 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition hidden sm:inline-block shrink-0"
                >
                  Book Visit
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-blue-200 hover:text-white focus:outline-none shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Role-Isolated Notifications Popover */}
        {notificationsOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:absolute sm:right-4 sm:top-16 z-50 flex items-start justify-center sm:justify-end p-3 sm:p-0">
            <div 
              className="fixed inset-0 bg-black/40 sm:hidden" 
              onClick={() => setNotificationsOpen(false)} 
            />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full sm:w-96 max-h-[85vh] flex flex-col overflow-hidden text-[#4B5563] z-10">
              <div className="px-4 py-3 bg-[#1E3A8A] text-white flex items-center justify-between border-b border-blue-950 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-300" />
                  <span className="font-bold text-xs sm:text-sm capitalize">
                    {role ? `${role} Notifications` : "Hospital Alerts"}
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500 text-white">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-teal-200 hover:text-white underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 hover:bg-blue-900 rounded-lg text-blue-200 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[70vh] divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto opacity-50" />
                    <p className="font-semibold text-gray-600">No Notifications</p>
                    <p>You have no pending alerts or updates for your role.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id, n.link)}
                      className={`p-3.5 transition cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                        !n.is_read ? "bg-teal-50/50" : "bg-white"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#0D9488]" style={{ opacity: n.is_read ? 0 : 1 }} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#1E3A8A] leading-tight">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">
                          {n.message}
                        </p>
                        {n.link && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0D9488] hover:underline pt-0.5">
                            Open Details →
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1E3A8A] border-t border-blue-900 p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            {username && (
              <div className="p-3 bg-blue-950/80 rounded-2xl border border-blue-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                    role === "admin" ? "bg-blue-800 text-teal-300" : role === "doctor" ? "bg-teal-800 text-teal-200" : "bg-blue-800 text-white"
                  }`}>
                    {role}
                  </span>
                  <span className="text-white font-bold text-xs truncate">{username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

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
