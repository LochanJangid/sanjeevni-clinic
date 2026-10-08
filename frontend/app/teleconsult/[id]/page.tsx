"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Share2, 
  Clock, 
  Activity, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Stethoscope,
  User,
  Heart,
  Droplet
} from "lucide-react";
import { getAuthClaims } from "../../../lib/auth";

function TeleconsultRoomContent() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id || "1";

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(340); // 5m 40s in
  const [activeTab, setActiveTab] = useState<"notes" | "vitals" | "info" | "rx">("notes");
  const [doctorNotes, setDoctorNotes] = useState(
    "Patient reports mild headache and occasional lightheadedness. BP 122/80 mmHg within normal limits. SpO2 99% on room air. Recommended staying hydrated and continuing prescribed low-sodium diet."
  );

  const claims = getAuthClaims();
  const isDoctor = claims?.role === "doctor" || claims?.role === "admin";

  useEffect(() => {
    // Set default tab based on role
    if (!isDoctor) {
      setActiveTab("info");
    }
  }, [isDoctor]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function handleEndCall() {
    if (confirm("Are you sure you want to end this virtual consultation session?")) {
      router.push("/teleconsult");
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-teal-50 text-[#0D9488] border border-teal-200 rounded-xl">
              {isDoctor ? <Stethoscope className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  {isDoctor ? "DOCTOR TELECONSULTATION SESSION" : "PATIENT SECURE VIRTUAL VISIT"}
                </span>
                <span className="text-xs text-gray-400">· Consultation #{appointmentId}</span>
              </div>
              <h1 className="text-xl font-bold text-[#1E3A8A]">
                {isDoctor 
                  ? "Physician Teleconsultation & Electronic Medical Record" 
                  : "Encrypted Patient Teleconsultation Room"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-semibold text-[#1E3A8A]">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatTime(elapsedSeconds)} / 30:00</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#4B5563] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span>256-bit AES P2P Encrypted</span>
            </div>
          </div>
        </div>

        {/* Main Video & Clinical Workstation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Video Streams */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center">
              {/* Main Remote Video (Doctor or Patient) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 text-white p-6">
                <div className="w-24 h-24 rounded-full bg-teal-600/30 border-2 border-[#0D9488] flex items-center justify-center text-teal-300 text-3xl font-bold mb-4 shadow-inner">
                  {isDoctor ? "P" : "Dr"}
                </div>
                <h3 className="text-lg font-bold">
                  {isDoctor ? "Patient: Ramesh Kumar" : "Dr. Rajesh Sharma, MD (Cardiology)"}
                </h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  {isDoctor ? "Patient Connected · UHID-PAT-15" : "Consultant Cardiologist · Metro Suite 401"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1 rounded-full text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Microphone Active · 1080p WebRTC</span>
                </div>
              </div>

              {/* Self PIP View (Bottom Right) */}
              <div className="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl flex items-center justify-center">
                {videoEnabled ? (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-600 flex flex-col items-center justify-center text-white text-xs">
                    <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold mb-1">
                      {isDoctor ? "You (MD)" : "You"}
                    </span>
                    <span className="text-[10px] text-slate-300">Camera Active</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Camera Off</span>
                  </div>
                )}
                <span className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">
                  You ({audioEnabled ? "Unmuted" : "Muted"})
                </span>
              </div>
            </div>

            {/* Call Controls Bar */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  audioEnabled
                    ? "bg-gray-100 hover:bg-gray-200 text-[#1E3A8A]"
                    : "bg-rose-100 text-rose-700 ring-2 ring-rose-500/30"
                }`}
                title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  videoEnabled
                    ? "bg-gray-100 hover:bg-gray-200 text-[#1E3A8A]"
                    : "bg-rose-100 text-rose-700 ring-2 ring-rose-500/30"
                }`}
                title={videoEnabled ? "Turn Off Video" : "Turn On Video"}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setScreenSharing(!screenSharing)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  screenSharing
                    ? "bg-[#0D9488] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-[#1E3A8A]"
                }`}
                title="Share Screen or Diagnostic Report"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-sm transition-all ml-2 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{isDoctor ? "End Consultation" : "Leave Visit"}</span>
              </button>
            </div>
          </div>

          {/* Right: Workstation Side Panel - Perspective Tailored */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
              
              {/* DOCTOR PERSPECTIVE DOCK */}
              {isDoctor ? (
                <div>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 pb-3 mb-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("notes")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "notes"
                          ? "bg-[#1E3A8A] text-white shadow-sm"
                          : "text-[#4B5563] hover:bg-gray-50"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Doctor Notes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("vitals")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "vitals"
                          ? "bg-[#1E3A8A] text-white shadow-sm"
                          : "text-[#4B5563] hover:bg-gray-50"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Patient Vitals</span>
                    </button>
                  </div>

                  {activeTab === "notes" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-1">
                          Live Clinical Assessment Notes
                        </label>
                        <textarea
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          rows={6}
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 text-[#1E3A8A] focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:outline-none leading-relaxed"
                          placeholder="Enter patient symptoms, diagnosis, and plan..."
                        />
                      </div>

                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <Link
                          href="/doctor-portal"
                          className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Digital Rx (Prescription)</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block">
                        Patient Telemetry Snapshot (UHID-PAT-15)
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Blood Pressure</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">120/78 mmHg</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Optimal</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Heart Rate</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">72 BPM</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Normal Sinus</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Oxygen Saturation</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">99% SpO2</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Room Air</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Blood Sugar</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">94 mg/dL</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Fasting Normal</span>
                        </div>
                      </div>

                      <Link
                        href="/vitals"
                        className="mt-3 text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                      >
                        <span>Open Longitudinal Biomarker Telemetry →</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                /* PATIENT PERSPECTIVE DOCK */
                <div>
                  <div className="flex border-b border-gray-100 pb-3 mb-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("info")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "info"
                          ? "bg-[#1E3A8A] text-white shadow-sm"
                          : "text-[#4B5563] hover:bg-gray-50"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Doctor Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("rx")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "rx"
                          ? "bg-[#1E3A8A] text-white shadow-sm"
                          : "text-[#4B5563] hover:bg-gray-50"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>My Prescriptions</span>
                    </button>
                  </div>

                  {activeTab === "info" ? (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs">
                            MD
                          </span>
                          <div>
                            <strong className="text-sm font-bold text-[#1E3A8A] block">
                              Dr. Rajesh Sharma
                            </strong>
                            <span className="text-[#0D9488] font-semibold text-[11px]">
                              Cardiologist · MBBS, MD (Med), DM (Cardio)
                            </span>
                          </div>
                        </div>
                        <p className="text-[#4B5563] text-[11px] leading-relaxed pt-1">
                          Consultant Cardiologist at Sanjeevni Metro Pavilion. Over 14 years clinical experience in preventive cardiovascular health.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
                          Session Guidelines
                        </span>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-[#4B5563]">
                          <p className="flex items-center gap-2">
                            <span className="text-[#0D9488] font-bold">✓</span>
                            <span>Keep your camera and microphone enabled</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-[#0D9488] font-bold">✓</span>
                            <span>Share previous lab reports if requested</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-[#0D9488] font-bold">✓</span>
                            <span>Your doctor will issue digital Rx directly after call</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block">
                        Prescriptions &amp; Digital Slips
                      </span>
                      <p className="text-xs text-[#4B5563]">
                        Your attending physician generates accredited electronic prescriptions with dosage, refill, and pharmacy notes.
                      </p>
                      <Link
                        href="/prescriptions"
                        className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View My Digital Prescriptions (Rx)</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeleconsultRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-2" />
          <p className="text-xs text-gray-400">Connecting to secure medical stream...</p>
        </div>
      }
    >
      <TeleconsultRoomContent />
    </Suspense>
  );
}
