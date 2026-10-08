"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Stethoscope, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck, 
  ArrowRight, 
  Activity, 
  Clock, 
  Info,
  PhoneCall,
  Sparkles
} from "lucide-react";

interface TriageResult {
  urgency_level: string;
  is_emergency: boolean;
  emergency_reasons: string[];
  specialty_recommended: string;
  suspected_conditions: string[];
  triage_guidance: string;
  recommended_doctor: {
    id: number;
    name: string;
    fees: number;
    category_name: string;
    qualification?: string;
    experience_years?: number;
  } | null;
  prefilled_notes: string;
}

const commonSymptoms = [
  "Chest Pain / Tightness",
  "Palpitations / Rapid Heartbeat",
  "Shortness of Breath",
  "High Fever & Chills",
  "Severe Skin Rash / Itching",
  "Acne / Pimples / Spots",
  "Chronic Migraine / Headache",
  "Dizziness / Vertigo",
  "Joint Pain / Knee Swelling",
  "Back Pain / Stiffness",
  "Childhood Fever / Cough",
  "Abdominal Stomach Ache",
  "Persistent Fatigue",
  "High Blood Pressure Spikes"
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SymptomCheckerPage() {
  const router = useRouter();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState(2);
  const [ageYears, setAgeYears] = useState(32);
  const [hasChestPain, setHasChestPain] = useState(false);
  const [hasShortBreath, setHasShortBreath] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleSymptom(sym: string) {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
      if (sym.toLowerCase().includes("chest pain")) setHasChestPain(true);
      if (sym.toLowerCase().includes("shortness of breath")) setHasShortBreath(true);
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !description.trim()) {
      setError("Please select at least one symptom or describe how you are feeling.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/clinical/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ["General symptoms"],
          description,
          duration_days: durationDays,
          age_years: ageYears,
          has_chest_pain: hasChestPain,
          has_shortness_of_breath: hasShortBreath,
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to complete clinical triage evaluation. Please try again.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error assessing symptoms.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-accent">CLINICAL AI ENGINE</span>
              <span className="text-xs text-muted">Evidence-Based Medical Triage</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Intelligent Symptom Checker &amp; Care Navigator
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Describe your symptoms to receive an instant clinical urgency triage rating, evidence-based specialty recommendation, and direct connection to the right Sanjeevni specialist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 bg-white shadow-sm border border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground mb-4">
              <Activity className="w-5 h-5 text-teal-700" />
              1. Select What You Are Experiencing
            </h2>

            <div className="flex flex-wrap gap-2 mb-6">
              {commonSymptoms.map((sym) => {
                const active = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? "bg-teal-700 text-white shadow-sm ring-2 ring-teal-600/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {sym}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Detailed Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Feeling intermittent throbbing on right side of head, worsens under bright light, started 2 days ago..."
                  rows={3}
                  className="w-full text-sm p-3 rounded-lg border border-border focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Duration: {durationDays} {durationDays === 1 ? "day" : "days"}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full accent-teal-700"
                  />
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>1 day</span>
                    <span>15 days</span>
                    <span>30+ days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Patient Age: {ageYears} Years
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={110}
                    value={ageYears}
                    onChange={(e) => setAgeYears(Number(e.target.value))}
                    className="w-full text-sm p-2 rounded-lg border border-border"
                  />
                </div>
              </div>

              {/* Red Flag Warning Box */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Red Flag Emergency Screening
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasChestPain}
                    onChange={(e) => setHasChestPain(e.target.checked)}
                    className="rounded text-teal-700"
                  />
                  <span>Experiencing crushing chest pain, pressure, or tightness radiating to left arm/jaw</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasShortBreath}
                    onChange={(e) => setHasShortBreath(e.target.checked)}
                    className="rounded text-teal-700"
                  />
                  <span>Severe breathing difficulty, wheezing, or unable to speak full sentences</span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Evaluating Clinical Matrix...</span>
                ) : (
                  <>
                    <span>Run Clinical Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Result Column */}
        <div className="lg:col-span-5 space-y-6">
          {!result ? (
            <div className="card p-8 bg-slate-50/80 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1">
                Awaiting Symptom Data
              </h3>
              <p className="text-xs text-muted max-w-xs mb-4">
                Select your symptoms on the left to receive an immediate triage categorization, department guidance, and specialist recommendation.
              </p>
              <div className="text-[11px] text-muted flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-border">
                <Info className="w-3.5 h-3.5 text-teal-600" />
                Complies with clinical outpatient triage protocols
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Emergency Banner */}
              {result.is_emergency ? (
                <div className="card p-6 bg-red-600 text-white border-none shadow-lg animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldAlert className="w-8 h-8 text-white" />
                    <div>
                      <span className="text-xs uppercase tracking-wider font-black bg-white/20 px-2 py-0.5 rounded">
                        CRITICAL ALERT
                      </span>
                      <h3 className="text-xl font-bold">EMERGENCY TRIAGE FLAG</h3>
                    </div>
                  </div>
                  <p className="text-sm text-red-100 mb-4">
                    Your symptoms indicate a possible medical emergency requiring immediate in-person evaluation. Do not wait for a routine outpatient slot.
                  </p>
                  <div className="bg-red-800/60 p-3 rounded-lg text-xs space-y-1 mb-4">
                    {result.emergency_reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="tel:+919999108108"
                    className="w-full py-3 bg-white text-red-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-all text-sm shadow"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call Ambulance Helpline Now (+91 9999-108-108)
                  </a>
                </div>
              ) : (
                <div className="card p-5 bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Triage Urgency: {result.urgency_level}
                  </div>
                  <p className="text-xs text-emerald-900">{result.triage_guidance}</p>
                </div>
              )}

              {/* Assessment Breakdown Card */}
              <div className="card p-6 bg-white shadow-sm border border-border space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase text-muted tracking-wider">
                    Recommended Specialty
                  </span>
                  <div className="text-xl font-bold text-teal-900 mt-0.5 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-700" />
                    {result.specialty_recommended}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-muted tracking-wider">
                    Suspected Clinical Conditions
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {result.suspected_conditions.map((c, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended Doctor */}
                {result.recommended_doctor && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-muted tracking-wider block mb-2">
                      Accredited Specialist on Duty
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-base text-foreground">
                          {result.recommended_doctor.name}
                        </h4>
                        <p className="text-xs text-muted">
                          {result.recommended_doctor.qualification || "Consultant Specialist"}
                        </p>
                        <p className="text-xs font-semibold text-teal-700 mt-1">
                          Consultation Fee: ₹{result.recommended_doctor.fees}
                        </p>
                      </div>
                      <span className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                        {result.recommended_doctor.name.split(" ")[1]?.[0] || "D"}
                      </span>
                    </div>

                    <Link
                      href={`/doctors/${result.recommended_doctor.id}`}
                      className="mt-4 w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Book Slot with {result.recommended_doctor.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
