"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Stethoscope,
  User,
  KeyRound,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from "lucide-react";

type Popup = {
  type: "success" | "error";
  title: string;
  message: string;
};

export default function LoginPage() {
  const router = useRouter();

  // Login Mode: "standard" (Patient & Admin) or "doctor_key" (Clinician Key)
  const [loginMode, setLoginMode] = useState<"standard" | "doctor_key">("standard");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [doctorKey, setDoctorKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 1. Standard Login (Patient or Admin)
  const handleStandardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPopup(null);

    try {
      const response = await fetch(`${API_URL}/users/user_login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.auth_success) {
        setPopup({
          type: "error",
          title: "Sign in failed",
          message: data.msg || data.detail || "Invalid username or password.",
        });
        return;
      }

      // Save JWT access token
      localStorage.setItem("access_token", data.access_token);
      window.dispatchEvent(new Event("sanjeevni-session-change"));

      const userRole = data.user?.role || "patient";

      setPopup({
        type: "success",
        title: "Authenticated Successfully",
        message: `Welcome to Sanjeevni Clinic, ${data.user.username}!`,
      });

      window.setTimeout(() => {
        if (userRole === "admin") {
          router.push("/admin");
        } else if (userRole === "doctor") {
          router.push("/doctor-portal");
        } else {
          router.push("/dashboard");
        }
      }, 600);
    } catch {
      setPopup({
        type: "error",
        title: "Connection Error",
        message: "Unable to reach the Sanjeevni Clinic server. Please verify backend service.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Doctor Key Login
  const handleDoctorKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!doctorKey.trim()) return;

    setLoading(true);
    setPopup(null);

    try {
      const response = await fetch(`${API_URL}/users/doctor_key_login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ doctor_key: doctorKey.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok || !data.auth_success) {
        setPopup({
          type: "error",
          title: "Doctor Key Invalid",
          message: data.detail || "The provided Doctor Access Key is not recognized. Contact clinic administration.",
        });
        return;
      }

      // Save JWT access token
      localStorage.setItem("access_token", data.access_token);
      window.dispatchEvent(new Event("sanjeevni-session-change"));

      setPopup({
        type: "success",
        title: "Clinician Verified",
        message: `Welcome, ${data.user.username}! Opening Doctor Workstation...`,
      });

      window.setTimeout(() => {
        router.push("/doctor-portal");
      }, 600);
    } catch {
      setPopup({
        type: "error",
        title: "Connection Error",
        message: "Unable to connect to the clinic authorization server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#4B5563] flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-black text-xl shadow-sm">
              ✚
            </span>
            <span className="text-left">
              <span className="block text-lg font-black text-[#1E3A8A] tracking-tight leading-none">SANJEEVNI CLINIC</span>
              <span className="block text-[10px] font-mono text-[#0D9488] tracking-wider font-bold">SUPER-SPECIALTY HEALTHCARE</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-[#1E3A8A] tracking-tight">
            Sign In to Clinical Portal
          </h1>
          <p className="text-xs text-[#4B5563]">
            Secure, role-based access for Patients, Clinicians &amp; Administration.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-gray-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setLoginMode("standard")}
            className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              loginMode === "standard"
                ? "bg-[#1E3A8A] text-white shadow-sm"
                : "text-[#4B5563] hover:text-[#1E3A8A]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient / Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginMode("doctor_key")}
            className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              loginMode === "doctor_key"
                ? "bg-[#0D9488] text-white shadow-sm"
                : "text-[#4B5563] hover:text-[#0D9488]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Doctor Key Login</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
          {loginMode === "standard" ? (
            /* 1. Standard Form (Patient / Admin) */
            <form onSubmit={handleStandardSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E3A8A] flex items-center justify-between">
                  <span>Username or Email:</span>
                  <span className="text-[10px] text-gray-500 font-mono">Patient / Admin</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username (e.g. lochan or your account)"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 text-gray-900 text-xs outline-none transition"
                  />
                  <User className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E3A8A] flex items-center justify-between">
                  <span>Password:</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 text-gray-900 text-xs outline-none transition"
                  />
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{loading ? "Verifying Credentials..." : "Sign In to Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* 2. Doctor Access Key Form */
            <form onSubmit={handleDoctorKeySubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-[#0F766E] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#0F766E]">
                  <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                  <span>Authorized Doctor Chamber Access</span>
                </div>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  Enter the unique Clinician Access Key issued by Sanjeevni administration upon your appointment.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E3A8A]">
                  Doctor Access Key:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={doctorKey}
                    onChange={(e) => setDoctorKey(e.target.value)}
                    placeholder="e.g. DOC-SHARMA-101"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 text-gray-900 font-mono text-sm uppercase tracking-wider outline-none transition"
                    autoFocus
                  />
                  <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-[#0D9488] pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{loading ? "Authenticating Clinician..." : "Enter Doctor Chamber Cockpit"}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </form>
          )}

          {/* Registration link for free patients */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-[#4B5563] space-y-2">
            <div>
              New patient to Sanjeevni Clinic?{" "}
              <Link href="/registration" className="font-bold text-[#0D9488] hover:underline">
                Create Free Patient Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Notification */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-gray-200 p-6 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto my-auto">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              popup.type === "success" ? "bg-teal-50 text-[#0D9488]" : "bg-red-50 text-red-600"
            }`}>
              {popup.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1E3A8A]">{popup.title}</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">{popup.message}</p>
            </div>

            <button
              type="button"
              onClick={() => setPopup(null)}
              className="w-full py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </main>
  );
}