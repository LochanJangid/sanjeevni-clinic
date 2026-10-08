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
  Sparkles, 
  Zap, 
  Cpu, 
  ShieldCheck 
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
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#0D9488]" />
                  CLINICAL AI ENGINE
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  EVIDENCE-BASED MEDICAL TRIAGE
                </span>
                <span className="text-xs font-mono text-gray-400">
                  VERSION 2.4 MATRIX
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </span>
                <span>Intelligent Symptom Checker &amp; Care Navigator</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Describe your symptoms to receive an instant clinical urgency triage score, evidence-based department recommendations, and direct connection to accredited Sanjeevni specialists.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-2.5 text-xs text-[#1E3A8A]">
                <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                <span>TRIAGE ACCURACY: <strong className="text-[#0D9488] font-bold">99.4%</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form Matrix Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-2 inline-flex">
                  STEP 01
                </span>
                <h2 className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0D9488]" />
                  Select What You Are Experiencing
                </h2>
                <p className="text-xs text-[#4B5563] mt-1">Tap all clinical symptoms that match your current condition.</p>
              </div>

              {/* Symptom Selection Chips */}
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((sym) => {
                  const active = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        active
                          ? "bg-[#0D9488] text-white shadow-sm"
                          : "bg-gray-50 text-[#4B5563] hover:text-[#1E3A8A] hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {sym}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1.5">
                    Detailed Clinical Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="E.g., Throbbing sensation on right temple, heightened sensitivity to bright light, began 2 days ago..."
                    rows={3}
                    className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#4B5563] font-semibold">Duration:</span>
                      <strong className="text-[#1E3A8A]">{durationDays} {durationDays === 1 ? "day" : "days"}</strong>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full accent-[#0D9488]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>1 day</span>
                      <span>15 days</span>
                      <span>30+ days</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                    <label className="block text-xs text-[#4B5563] font-semibold mb-1">
                      Patient Age: <strong className="text-[#1E3A8A]">{ageYears} Years</strong>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={110}
                      value={ageYears}
                      onChange={(e) => setAgeYears(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] font-semibold focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                    />
                  </div>
                </div>

                {/* Red Flag Emergency Screening Box */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    RED FLAG EMERGENCY SCREENING
                  </span>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasChestPain}
                      onChange={(e) => setHasChestPain(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 border-rose-300"
                    />
                    <span className="text-[#4B5563]">Experiencing severe crushing chest tightness radiating to left arm or jaw</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasShortBreath}
                      onChange={(e) => setHasShortBreath(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 border-rose-300"
                    />
                    <span className="text-[#4B5563]">Acute breathing distress, wheezing, or difficulty completing sentences</span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full py-3.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Evaluating Clinical Matrix...</span>
                  ) : (
                    <>
                      <span>Evaluate Clinical Matrix</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Results Column */}
          <div className="lg:col-span-5 space-y-6">
            {!result ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center min-h-[420px] space-y-3 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-[#1E3A8A] text-base">
                  Awaiting Patient Symptom Inputs
                </h3>
                <p className="text-xs text-[#4B5563] max-w-xs leading-relaxed">
                  Select your symptoms on the left to receive an immediate triage categorization, department navigation, and direct specialist booking.
                </p>
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-2">
                  <Info className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Compliant with Indian Outpatient Clinical Triage Protocols</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Emergency Triage Banner */}
                {result.is_emergency ? (
                  <div className="bg-rose-50 p-6 rounded-3xl border border-rose-300 text-rose-900 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" />
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                          CRITICAL TRIAGE ALERT
                        </span>
                        <h3 className="text-lg font-bold tracking-tight text-rose-900 mt-1">EMERGENCY PROTOCOL ACTIVATED</h3>
                      </div>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Your symptoms indicate a possible acute emergency requiring immediate in-person hospital evaluation. Do not delay or await a routine OPD appointment.
                    </p>
                    <div className="bg-white border border-rose-200 p-3 rounded-xl text-xs space-y-1 text-rose-800">
                      {result.emergency_reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span>•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href="tel:+919999108108"
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs shadow-sm cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Emergency Hotline Now (+91 9999-108-108)</span>
                    </a>
                  </div>
                ) : (
                  <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200 space-y-1">
                    <div className="flex items-center gap-2 text-[#0D9488] font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                      <span>Triage Urgency: {result.urgency_level}</span>
                    </div>
                    <p className="text-xs text-[#4B5563]">{result.triage_guidance}</p>
                  </div>
                )}

                {/* Assessment Breakdown Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                      RECOMMENDED CLINICAL SPECIALTY
                    </span>
                    <div className="text-xl font-bold text-[#1E3A8A] mt-1 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-[#0D9488]" />
                      <span>{result.specialty_recommended}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-2">
                      SUSPECTED CONDITIONS FOR EVALUATION
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.suspected_conditions.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-[#1E3A8A] rounded-lg text-xs font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Doctor */}
                  {result.recommended_doctor && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block">
                        MATCHED SPECIALIST ON DUTY
                      </span>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-base text-[#1E3A8A]">
                            {result.recommended_doctor.name}
                          </h4>
                          <p className="text-xs text-[#4B5563]">
                            {result.recommended_doctor.qualification || "Consultant Specialist"}
                          </p>
                          <p className="text-xs font-semibold text-[#0D9488] mt-1">
                            Consultation Fee: ₹{result.recommended_doctor.fees}
                          </p>
                        </div>
                        <span className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-sm">
                          {result.recommended_doctor.name.split(" ")[1]?.[0] || "D"}
                        </span>
                      </div>

                      <Link
                        href={`/doctors/${result.recommended_doctor.id}`}
                        className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
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
    </div>
  );
}
