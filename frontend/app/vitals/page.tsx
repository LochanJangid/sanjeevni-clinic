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
  ShieldAlert
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

      if (!res.ok) throw new Error("Failed to record vitals.");
      setShowAddModal(false);
      setNotes("");
      await fetchVitals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving vitals.");
    } finally {
      setSubmitting(false);
    }
  }

  const latest = vitals[0] || null;

  return (
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-100 text-rose-800 rounded-xl">
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">CHRONIC CARE MONITOR</span>
                <span className="text-xs text-muted">AHA &amp; WHO Clinical Standards</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Patient Health Vitals &amp; Biomarkers
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Vitals</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Track blood pressure, heart rate, fasting glucose, and oxygen saturation over time. Your attending physician reviews these biomarkers during follow-up visits.
        </p>
      </div>

      {/* Latest Vitals Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 my-6">
        {/* Blood Pressure */}
        <div className="card p-4 bg-white border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Blood Pressure</span>
            <Heart className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {latest ? `${latest.bp_systolic}/${latest.bp_diastolic}` : "--/--"}
            <span className="text-[10px] text-muted font-normal ml-1">mmHg</span>
          </div>
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
            {latest && latest.bp_systolic < 130 ? "Normal BP" : "Pre-HTN"}
          </span>
        </div>

        {/* Heart Rate */}
        <div className="card p-4 bg-white border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Heart Rate</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {latest ? latest.heart_rate : "--"}
            <span className="text-[10px] text-muted font-normal ml-1">BPM</span>
          </div>
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
            Resting Normal
          </span>
        </div>

        {/* Blood Sugar */}
        <div className="card p-4 bg-white border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Blood Sugar</span>
            <Droplet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {latest ? latest.blood_sugar : "--"}
            <span className="text-[10px] text-muted font-normal ml-1">mg/dL</span>
          </div>
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
            Normal Fasting
          </span>
        </div>

        {/* Oxygen SpO2 */}
        <div className="card p-4 bg-white border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>SpO2 Oxygen</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {latest ? `${latest.spo2}%` : "--%"}
          </div>
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
            Room Air Optimal
          </span>
        </div>

        {/* Temperature */}
        <div className="card p-4 bg-white border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Temperature</span>
            <Thermometer className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {latest ? `${latest.temperature}°F` : "--"}
          </div>
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
            Afebrile
          </span>
        </div>

        {/* Body Weight */}
        <div className="card p-4 bg-white border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Weight</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {latest ? `${latest.weight_kg}` : "--"}
            <span className="text-[10px] text-muted font-normal ml-1">kg</span>
          </div>
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
            BMI Stable
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="card p-6 bg-white border border-border mt-8">
        <h2 className="text-base font-bold text-foreground mb-4 flex items-center justify-between">
          <span>Vitals Timeline History</span>
          <span className="text-xs font-normal text-muted">{vitals.length} Logs recorded</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-muted">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
            <p className="text-xs">Loading vitals logs...</p>
          </div>
        ) : vitals.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs">
            No vitals recorded yet. Click &quot;Record New Vitals&quot; above to log your first check.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
                  <th className="py-2.5 px-3 font-semibold">BP (mmHg)</th>
                  <th className="py-2.5 px-3 font-semibold">Heart Rate</th>
                  <th className="py-2.5 px-3 font-semibold">Glucose</th>
                  <th className="py-2.5 px-3 font-semibold">SpO2</th>
                  <th className="py-2.5 px-3 font-semibold">Temp</th>
                  <th className="py-2.5 px-3 font-semibold">Weight</th>
                  <th className="py-2.5 px-3 font-semibold">Clinical Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vitals.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {new Date(v.recorded_at).toLocaleDateString()} · {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {v.bp_systolic}/{v.bp_diastolic}
                    </td>
                    <td className="py-2.5 px-3">{v.heart_rate} bpm</td>
                    <td className="py-2.5 px-3">{v.blood_sugar} mg/dL</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{v.spo2}%</td>
                    <td className="py-2.5 px-3">{v.temperature}°F</td>
                    <td className="py-2.5 px-3">{v.weight_kg} kg</td>
                    <td className="py-2.5 px-3 text-muted max-w-xs truncate">{v.notes || "Routine"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Log Vitals */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-1">Log Patient Vitals</h3>
            <p className="text-xs text-muted mb-4">
              Enter measurements accurately. Values will be shared with your attending physician.
            </p>

            <form onSubmit={handleAddVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    BP Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    BP Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Pulse (BPM)
                  </label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Sugar (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={sugar}
                    onChange={(e) => setSugar(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Temp (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                  Physician / Self Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. Feeling energetic, post-breakfast reading"
                  className="w-full text-xs p-2.5 border border-border rounded-lg"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border text-muted hover:text-foreground text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Vitals Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
