"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PhoneCall, 
  ShieldAlert, 
  Truck, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  HeartPulse, 
  Flame, 
  HelpCircle,
  Activity,
  Radio,
  Siren,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface EmergencyData {
  emergency_hotline: string;
  toll_free: string;
  trauma_center_status: string;
  on_duty_triage_officer: string;
  ambulances_available: number;
  average_dispatch_eta_mins: number;
  clinic_location: {
    name: string;
    address: string;
    gps_coordinates: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function EmergencyPage() {
  const [data, setData] = useState<EmergencyData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${API_URL}/clinical/emergency/status`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Critical Emergency Command Radar Banner */}
        <div className="p-6 sm:p-10 rounded-3xl border border-rose-200 bg-rose-50 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  24x7 TRAUMA &amp; AMBULANCE RADAR
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-amber-700" />
                  PRIORITY LEVEL 1 RESPONSE
                </span>
                <span className="text-xs font-semibold text-rose-700">
                  CRITICAL DISPATCH DESK
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-rose-600 text-white shadow-md">
                  <Siren className="w-8 h-8" />
                </span>
                <span>Emergency Response Command Center</span>
              </h1>

              <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl leading-relaxed">
                Rapid mobilization for acute cardiac crises, stroke symptoms, acute trauma, or sudden breathing distress. Our GPS-linked Advanced Life Support (ALS) fleet is operational 24 hours a day.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="tel:+919999108108"
                className="px-8 py-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-lg rounded-2xl shadow-md flex items-center justify-center gap-3.5 transition-all hover:scale-105"
              >
                <PhoneCall className="w-6 h-6 animate-bounce" />
                <span>Call Hotline: +91 9999-108-108</span>
              </a>
              <div className="text-center font-mono text-xs text-rose-700 font-semibold">
                TOLL-FREE CLINICAL TRIAGE • 24x7 IMMEDIATE CONNECTION
              </div>
            </div>
          </div>
        </div>

        {/* Fleet & Readiness Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition">
            <div className="flex items-center justify-between text-xs font-medium text-rose-700 mb-2">
              <span>AMBULANCES STANDBY</span>
              <Truck className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
              {data?.ambulances_available || 3} Units Ready
            </div>
            <div className="mt-2 text-[11px] text-[#0D9488] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              Equipped with Ventilators &amp; Defibrillators
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488]/40 transition">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
              <span>AVG DISPATCH ETA</span>
              <Clock className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
              ~{data?.average_dispatch_eta_mins || 8} Mins
            </div>
            <div className="mt-2 text-[11px] text-gray-400 font-medium">
              Within 10 km Metro Sector Radius
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488]/40 transition">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
              <span>TRAUMA CENTER STATUS</span>
              <ShieldAlert className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0D9488] font-mono tracking-tight">
              Level 1
            </div>
            <div className="mt-2 text-[11px] text-[#0D9488] font-medium">
              {data?.trauma_center_status || "Operational 24x7 with OT"}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
              <span>CHIEF TRIAGE OFFICER</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-[#1E3A8A] tracking-tight mt-1">
              {data?.on_duty_triage_officer || "Senior Resident MD"}
            </div>
            <div className="mt-2 text-[11px] text-amber-600 font-medium">
              On Trauma Floor Duty
            </div>
          </div>
        </div>

        {/* Immediate Clinical First-Aid Protocols */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-1 inline-flex">
                TRIAGE PROTOCOLS
              </span>
              <h2 className="text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <span>Immediate Clinical First-Aid Guidance (While Dispatch Arrives)</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-gray-300 transition">
              <strong className="text-sm font-bold text-rose-700 block font-mono">
                01. Acute Chest Pain / Heart Attack
              </strong>
              <p className="text-[#4B5563] leading-relaxed">
                Keep the patient seated calmly in an upright position. Loosen tight clothing. If conscious and not allergic, administer 300mg Aspirin/Dispirin chewed. Do not allow physical exertion.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-gray-300 transition">
              <strong className="text-sm font-bold text-[#1E3A8A] block font-mono">
                02. Stroke Screening (FAST Protocol)
              </strong>
              <p className="text-[#4B5563] leading-relaxed">
                <strong className="text-[#1E3A8A]">F</strong>ace drooping, <strong className="text-[#1E3A8A]">A</strong>rm weakness, <strong className="text-[#1E3A8A]">S</strong>peech slurred, <strong className="text-[#1E3A8A]">T</strong>ime to call ambulance. Note exact time symptoms began for thrombolysis window.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-gray-300 transition">
              <strong className="text-sm font-bold text-[#0D9488] block font-mono">
                03. Severe Breathing Distress
              </strong>
              <p className="text-[#4B5563] leading-relaxed">
                Sit patient upright leaning slightly forward. Open windows for fresh ventilation. If asthmatic, administer rescue Salbutamol inhaler with spacer (2 to 4 puffs).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-gray-300 transition">
              <strong className="text-sm font-bold text-amber-700 block font-mono">
                04. Choking &amp; Airway Blockage
              </strong>
              <p className="text-[#4B5563] leading-relaxed">
                Deliver 5 firm back blows between shoulder blades. If still blocked, perform abdominal thrusts (Heimlich maneuver) pulling inward and upward above the navel.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-gray-300 transition">
              <strong className="text-sm font-bold text-indigo-700 block font-mono">
                05. Severe Bleeding &amp; Hemorrhage
              </strong>
              <p className="text-[#4B5563] leading-relaxed">
                Apply continuous direct pressure using sterile gauze or clean cloth. Elevate injured limb above heart level. Do not remove embedded penetrating objects.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-gray-300 transition">
              <strong className="text-sm font-bold text-[#0D9488] block font-mono">
                06. Burns &amp; Thermal Scalds
              </strong>
              <p className="text-[#4B5563] leading-relaxed">
                Immediately cool burn with running cold tap water for at least 20 minutes. Do not apply ice, butter, or paste. Cover loosely with clean sterile wrap.
              </p>
            </div>
          </div>
        </section>

        {/* Clinic Location & Coordinates Bay */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0D9488] font-bold text-xs uppercase">
              <MapPin className="w-4 h-4 text-[#0D9488]" />
              <span>EMERGENCY RECEIVING BAY</span>
            </div>
            <strong className="text-[#1E3A8A] text-base sm:text-lg block font-bold">
              {data?.clinic_location.name || "Sanjeevni Super-Specialty Medical Pavilion"}
            </strong>
            <p className="text-xs text-[#4B5563] max-w-xl">
              {data?.clinic_location.address || "Plot 42, Healthcare Boulevard, Metro Sector 18, New Delhi"}
            </p>
          </div>

          <div className="text-left sm:text-right p-4 rounded-2xl bg-slate-50 border border-gray-200">
            <span className="text-[11px] text-gray-400 font-semibold block">GPS DISPATCH COORDINATES</span>
            <span className="text-base font-mono text-[#0D9488] font-bold">
              {data?.clinic_location.gps_coordinates || "28.5355° N, 77.3910° E"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
