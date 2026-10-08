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
  Activity
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
    <div className="portal-page-container">
      {/* Top Critical Emergency Banner */}
      <div className="card p-8 bg-gradient-to-r from-red-600 to-rose-700 text-white border-none shadow-2xl rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <span className="text-xs uppercase tracking-widest font-black bg-white/20 px-2.5 py-0.5 rounded-full">
                24x7 TRAUMA &amp; AMBULANCE DISPATCH
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Emergency Response Command Center
            </h1>
            <p className="mt-2 text-sm text-red-100 max-w-xl">
              For acute medical emergencies, sudden cardiac symptoms, stroke, severe trauma, or breathing distress—our rapid ambulance response is available immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+919999108108"
              className="px-6 py-4 bg-white text-red-700 font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:bg-red-50 transition-all hover:scale-105"
            >
              <PhoneCall className="w-6 h-6 animate-pulse" />
              <span>Call Hotline: +91 9999-108-108</span>
            </a>
          </div>
        </div>
      </div>

      {/* Fleet & Trauma Readiness Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        <div className="card p-5 bg-white border border-border">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <Truck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Ambulances Standby</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data?.ambulances_available || 3} Advanced Life Support Units
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            ✓ Equipped with Ventilators &amp; Defibrillators
          </span>
        </div>

        <div className="card p-5 bg-white border border-border">
          <div className="flex items-center gap-2 text-teal-700 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Average Dispatch ETA</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            ~{data?.average_dispatch_eta_mins || 8} Minutes
          </div>
          <span className="text-[11px] text-muted block mt-1">
            Within 10 km Metro Sector Radius
          </span>
        </div>

        <div className="card p-5 bg-white border border-border">
          <div className="flex items-center gap-2 text-indigo-700 mb-1">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Trauma Facility</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            Level 1 Trauma
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            {data?.trauma_center_status || "Operational 24x7"}
          </span>
        </div>

        <div className="card p-5 bg-white border border-border">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Chief Triage Officer</span>
          </div>
          <div className="text-sm font-bold text-foreground mt-1">
            {data?.on_duty_triage_officer || "Senior Resident MD"}
          </div>
          <span className="text-[11px] text-muted block mt-1">
            On Emergency Floor Duty
          </span>
        </div>
      </div>

      {/* Emergency First-Aid Quick Protocols */}
      <div className="card p-6 bg-white border border-border my-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-red-600" />
          <span>Immediate Clinical First-Aid Guidance (While Help Arrives)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-sm font-bold text-slate-900 block">
              1. Acute Chest Pain / Heart Attack
            </strong>
            <p className="text-slate-700">
              Keep the patient seated calmly in an upright position. Loosen tight clothing. If conscious and not allergic, administer 300mg Dispirin/Aspirin chewed. Do not allow exertion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-sm font-bold text-slate-900 block">
              2. Stroke Screening (FAST Protocol)
            </strong>
            <p className="text-slate-700">
              <strong>F</strong>ace drooping, <strong>A</strong>rm weakness, <strong>S</strong>peech slurred, <strong>T</strong>ime to call ambulance. Note exact time symptoms began for thrombolysis window.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-sm font-bold text-slate-900 block">
              3. Severe Breathing Distress
            </strong>
            <p className="text-slate-700">
              Sit patient upright leaning slightly forward. Open windows for fresh ventilation. If asthmatic, administer rescue Salbutamol inhaler with spacer (2 to 4 puffs).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-sm font-bold text-slate-900 block">
              4. Choking &amp; Airway Blockage
            </strong>
            <p className="text-slate-700">
              Deliver 5 firm back blows between shoulder blades. If still blocked, perform abdominal thrusts (Heimlich maneuver) pulling inward and upward above the navel.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-sm font-bold text-slate-900 block">
              5. Severe Bleeding &amp; Wounds
            </strong>
            <p className="text-slate-700">
              Apply continuous direct pressure using sterile gauze or clean cloth. Elevate injured limb above heart level. Do not remove embedded objects.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-sm font-bold text-slate-900 block">
              6. Burns &amp; Scalds
            </strong>
            <p className="text-slate-700">
              Immediately cool burn with running cold tap water for at least 20 minutes. Do not apply ice, butter, or paste. Cover loosely with clean cling wrap.
            </p>
          </div>
        </div>
      </div>

      {/* Clinic Location & Coordinates */}
      <div className="card p-6 bg-slate-900 text-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase mb-1">
            <MapPin className="w-4 h-4" />
            <span>Emergency Receiving Bay</span>
          </div>
          <strong className="text-white text-base block">
            {data?.clinic_location.name || "Sanjeevni Super-Specialty Medical Pavilion"}
          </strong>
          <span className="text-xs text-slate-400">
            {data?.clinic_location.address || "Plot 42, Healthcare Boulevard, Metro Sector 18, New Delhi"}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 font-mono block">GPS Dispatch Coordinates</span>
          <span className="text-sm font-mono text-teal-300 font-bold">
            {data?.clinic_location.gps_coordinates || "28.5355° N, 77.3910° E"}
          </span>
        </div>
      </div>
    </div>
  );
}
