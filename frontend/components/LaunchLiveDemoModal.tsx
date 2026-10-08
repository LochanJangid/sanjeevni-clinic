"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Stethoscope,
  Users,
  Tv,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { 
  getStoredHospitalName, 
  setStoredHospitalName,
  getStoredHospitalLogo,
  setHospitalBranding,
  LOGO_PRESETS
} from "../lib/hospital";
import { loginAsDemoRole } from "../lib/auth";

interface LaunchLiveDemoModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultRole?: "admin" | "doctor" | "patient";
}

export function openDemoModal(role?: "admin" | "doctor" | "patient") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-demo-modal", { detail: { role } }));
  }
}

export default function LaunchLiveDemoModal({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  defaultRole = "admin",
}: LaunchLiveDemoModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hospitalInput, setHospitalInput] = useState("");
  const [selectedLogo, setSelectedLogo] = useState("✚");
  const [logoType, setLogoType] = useState<"icon" | "image">("icon");
  const [selectedRole, setSelectedRole] = useState<"admin" | "doctor" | "patient">("admin");
  const [targetDestination, setTargetDestination] = useState<"admin" | "doctor" | "patient" | "opd-queue">("admin");
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    if (propsIsOpen !== undefined) {
      setIsOpen(propsIsOpen);
    }
  }, [propsIsOpen]);

  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
      setTargetDestination(defaultRole);
    }
  }, [defaultRole]);

  useEffect(() => {
    function handleOpenEvent(e: any) {
      const preferredRole = e.detail?.role || "admin";
      setSelectedRole(preferredRole);
      setTargetDestination(preferredRole);
      setHospitalInput(getStoredHospitalName());
      setIsOpen(true);
    }

    window.addEventListener("open-demo-modal", handleOpenEvent);
    return () => window.removeEventListener("open-demo-modal", handleOpenEvent);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHospitalInput(getStoredHospitalName());
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
    if (propsOnClose) propsOnClose();
  }

  async function handleLaunch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsLaunching(true);

    const nameToSave = hospitalInput.trim() || "Apex Care Multi-Specialty Hospital";
    setHospitalBranding({
      name: nameToSave,
      logo: selectedLogo,
      logoType: logoType,
    });

    try {
      // Authenticate with selected demo role
      const roleToAuth = targetDestination === "opd-queue" ? "admin" : selectedRole;
      await loginAsDemoRole(roleToAuth);

      handleClose();

      // Navigate into the isolated hospital environment
      if (targetDestination === "admin") {
        router.push("/admin");
      } else if (targetDestination === "doctor") {
        router.push("/doctor-portal");
      } else if (targetDestination === "opd-queue") {
        router.push("/opd-queue");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsLaunching(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-emerald-950/40 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="relative bg-gradient-to-r from-emerald-900/60 via-slate-800 to-slate-900 p-6 border-b border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive White-Label System Demo</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Launch Operating System for Your Hospital
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Enter your hospital name and logo. The software will instantly rebrand all patient receipts, OPD TV displays, doctor pads, and admin portals for your facility.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLaunch} className="p-6 space-y-5">
          {/* Hospital Logo Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>1. Hospital Logo &amp; Emblem:</span>
              <span className="text-[10px] text-teal-400 font-semibold">Branded on TV &amp; Receipts</span>
            </label>
            <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              {/* Active Logo Preview */}
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-emerald-400/30 overflow-hidden">
                {logoType === "image" ? (
                  <img src={selectedLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedLogo}</span>
                )}
              </div>

              {/* Logo Presets & Upload */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {LOGO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedLogo(preset.icon);
                      setLogoType("icon");
                    }}
                    className={`px-2 py-1 rounded-lg border text-xs transition flex items-center gap-1 ${
                      selectedLogo === preset.icon && logoType === "icon"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span className="text-[10px] hidden sm:inline">{preset.label}</span>
                  </button>
                ))}

                <label className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-400" />
                  <span>Upload PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result as string;
                          if (result) {
                            setSelectedLogo(result);
                            setLogoType("image");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 2. Facility Name Input */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>2. Your Hospital / Clinic Name:</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Tier-2 Ready</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={hospitalInput}
                onChange={(e) => setHospitalInput(e.target.value)}
                placeholder="e.g. Apex Hospital Jaipur, Metro Care Jodhpur"
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 text-white placeholder-slate-500 outline-none transition"
                autoFocus
              />
              <Building2 className="absolute right-4 top-3 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>

            {/* Quick 1-Click Presets */}
            <div className="pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  "Apex Heart & General Hospital, Jaipur",
                  "Metro City Hospital, Jodhpur",
                  "Marudhar Multi-Specialty Clinic",
                  "Dr. Sharma Child & Family Pavilion",
                  "Apollo Care Hospital",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHospitalInput(preset)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium border border-slate-700 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Choose Entry Environment */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              Select Demo Environment to Enter:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setTargetDestination("admin");
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  targetDestination === "admin"
                    ? "bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 text-white"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                    👑
                  </span>
                  {targetDestination === "admin" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <strong className="block text-xs font-bold text-white">Hospital Admin ERP</strong>
                <span className="text-[10px] text-slate-400 mt-0.5">Bed census, revenue &amp; operations</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("doctor");
                  setTargetDestination("doctor");
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  targetDestination === "doctor"
                    ? "bg-teal-950/60 border-teal-500 ring-2 ring-teal-500/30 text-white"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold">
                    🩺
                  </span>
                  {targetDestination === "doctor" && (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  )}
                </div>
                <strong className="block text-xs font-bold text-white">Doctor Workstation</strong>
                <span className="text-[10px] text-slate-400 mt-0.5">OPD queue, digital Rx &amp; EHR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("patient");
                  setTargetDestination("patient");
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  targetDestination === "patient"
                    ? "bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30 text-white"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">
                    👤
                  </span>
                  {targetDestination === "patient" && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <strong className="block text-xs font-bold text-white">Patient Dashboard</strong>
                <span className="text-[10px] text-slate-400 mt-0.5">PhonePe UPI, tokens &amp; bills</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setTargetDestination("opd-queue");
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  targetDestination === "opd-queue"
                    ? "bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30 text-white"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                    📺
                  </span>
                  {targetDestination === "opd-queue" && (
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <strong className="block text-xs font-bold text-white">OPD Waiting Hall TV</strong>
                <span className="text-[10px] text-slate-400 mt-0.5">High-contrast token calling display</span>
              </button>
            </div>
          </div>

          {/* Guarantee / Isolation Note */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Once inside, the hospital system is fully white-labeled for{" "}
              <strong className="text-white font-semibold">{hospitalInput || "your hospital"}</strong>.
              You can return to Lochan&apos;s sales portal anytime from the button at the very bottom of the page.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLaunching}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span>{isLaunching ? "Rebranding & Launching..." : `Launch ${hospitalInput || "Hospital"} OS →`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
