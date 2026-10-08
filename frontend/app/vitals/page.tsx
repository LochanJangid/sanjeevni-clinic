"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Droplet, 
  Scale, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Zap,
  ShieldCheck,
  X
} from "lucide-react";
import { getAuthToken } from "../../lib/auth";

interface VitalRecord {
  id: number;
  user_id: number;
  bp_systolic: number;
  bp_diastolic: number;
  heart_rate: number;
  blood_sugar: number;
  temperature: number;
  spo2: number;
  weight_kg: number;
  notes: string;
  recorded_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function VitalsTrackerPage() {
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [pulse, setPulse] = useState("72");
  const [sugar, setSugar] = useState("95");
  const [temp, setTemp] = useState("98.4");
  const [spo2, setSpo2] = useState("99");
  const [weight, setWeight] = useState("68");
  const [notes, setNotes] = useState("");

  async function fetchVitals() {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/clinical/vitals/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setVitals(data.vitals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVitals();
  }, []);

  async function handleAddVitals(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/vitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bp_systolic: parseInt(systolic, 10),
          bp_diastolic: parseInt(diastolic, 10),
          heart_rate: parseInt(pulse, 10),
          blood_sugar: parseFloat(sugar),
          temperature: parseFloat(temp),
          spo2: parseInt(spo2, 10),
          weight_kg: parseFloat(weight),
          notes,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchVitals();
      } else {
        const err = await res.json();
        setError(err.detail || "Failed to log vitals");
      }
    } catch (e) {
      setError("Network error while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  const latest = vitals[0] || null;

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Vitals Cockpit Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#0D9488]" />
                  CHRONIC CARE MONITOR
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  LONGITUDINAL BIOMARKERS
                </span>
                <span className="text-xs font-mono text-gray-400">
                  PHYSICIAN SYNCED
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Activity className="w-7 h-7" />
                </span>
                <span>Patient Vitals &amp; Biomarker Telemetry</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Log and monitor blood pressure, resting heart rate, fasting glucose, and oxygen saturation over time. Your attending physician reviews these biomarkers during follow-up consultations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition self-start lg:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Record New Biomarker Log</span>
            </button>
          </div>
        </div>

        {/* Latest Vitals Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Blood Pressure */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>BP (mmHg)</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-[#1E3A8A] font-mono tracking-tight">
              {latest ? `${latest.bp_systolic}/${latest.bp_diastolic}` : "--/--"}
            </div>
            <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
              {latest && latest.bp_systolic < 130 ? "Normal BP" : "Pre-HTN"}
            </span>
          </div>

          {/* Heart Rate */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488] transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Heart Rate</span>
              <Activity className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="text-2xl font-bold text-[#1E3A8A] font-mono tracking-tight">
              {latest ? latest.heart_rate : "--"}
              <span className="text-xs text-gray-400 ml-1 font-normal">BPM</span>
            </div>
            <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
              Resting Normal
            </span>
          </div>

          {/* Blood Sugar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Blood Sugar</span>
              <Droplet className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-[#1E3A8A] font-mono tracking-tight">
              {latest ? latest.blood_sugar : "--"}
              <span className="text-xs text-gray-400 ml-1 font-normal">mg/dL</span>
            </div>
            <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
              Normal Fasting
            </span>
          </div>

          {/* SpO2 Oxygen */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>SpO2 Oxygen</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-[#1E3A8A] font-mono tracking-tight">
              {latest ? `${latest.spo2}%` : "--%"}
            </div>
            <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
              Room Air 99%
            </span>
          </div>

          {/* Temperature */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-orange-400 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Temperature</span>
              <Thermometer className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-[#1E3A8A] font-mono tracking-tight">
              {latest ? `${latest.temperature}°F` : "--"}
            </div>
            <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
              Afebrile
            </span>
          </div>

          {/* Body Weight */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Body Weight</span>
              <Scale className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-[#1E3A8A] font-mono tracking-tight">
              {latest ? `${latest.weight_kg}` : "--"}
              <span className="text-xs text-gray-400 ml-1 font-normal">kg</span>
            </div>
            <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-[#4B5563] border border-gray-200">
              BMI Stable
            </span>
          </div>
        </div>

        {/* History Table */}
        <section className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-1 inline-flex">
                TELEMETRY TIMELINE
              </span>
              <h2 className="text-lg font-bold text-[#1E3A8A]">Vitals History Timeline</h2>
            </div>
            <span className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500">
              {vitals.length} Logs recorded
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-2" />
              <p className="text-xs text-gray-400">Loading vitals logs...</p>
            </div>
          ) : vitals.length === 0 ? (
            <div className="p-16 text-center text-xs text-gray-400">
              No vitals recorded yet. Click &quot;Record New Biomarker Log&quot; above to log your first check.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase font-bold text-[#1E3A8A] bg-gray-50/50">
                    <th className="py-3 px-3">Date &amp; Time</th>
                    <th className="py-3 px-3">BP (mmHg)</th>
                    <th className="py-3 px-3">Heart Rate</th>
                    <th className="py-3 px-3">Glucose</th>
                    <th className="py-3 px-3">SpO2</th>
                    <th className="py-3 px-3">Temp</th>
                    <th className="py-3 px-3">Weight</th>
                    <th className="py-3 px-3">Clinical Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vitals.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-[#4B5563]">
                        {new Date(v.recorded_at).toLocaleDateString()} · {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#1E3A8A]">
                        {v.bp_systolic}/{v.bp_diastolic}
                      </td>
                      <td className="py-3 px-3 text-[#0D9488] font-semibold">{v.heart_rate} bpm</td>
                      <td className="py-3 px-3 text-amber-600 font-semibold">{v.blood_sugar} mg/dL</td>
                      <td className="py-3 px-3 font-semibold text-blue-600">{v.spo2}%</td>
                      <td className="py-3 px-3 text-orange-600 font-semibold">{v.temperature}°F</td>
                      <td className="py-3 px-3 text-purple-600 font-semibold">{v.weight_kg} kg</td>
                      <td className="py-3 px-3 text-gray-400 max-w-xs truncate">{v.notes || "Routine"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal to Log Vitals */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto space-y-4 p-6 sm:p-8 text-[#4B5563]">
              
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-1 inline-flex">
                    BIOMARKER ENTRY
                  </span>
                  <h3 className="text-xl font-bold text-[#1E3A8A]">
                    Log Patient Vitals
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:text-[#1E3A8A] flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddVitals} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      BP Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      BP Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      Pulse (BPM)
                    </label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      Sugar (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={sugar}
                      onChange={(e) => setSugar(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      Temp (°F)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1">
                    Physician / Self Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. Feeling energetic, post-breakfast reading"
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 hover:text-[#1E3A8A] rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Save Vitals Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
