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
  ArrowRight
} from "lucide-react";
import { getAuthClaims } from "../../../lib/auth";

function TeleconsultRoomContent() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id || "demo";

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(340); // 5m 40s in
  const [activeTab, setActiveTab] = useState<"notes" | "vitals">("notes");
  const [doctorNotes, setDoctorNotes] = useState(
    "Patient reports mild headache and occasional lightheadedness. BP 122/80 mmHg within normal limits. SpO2 99% on room air. Recommended staying hydrated and continuing prescribed low-sodium diet."
  );

  const claims = getAuthClaims();
  const isDoctor = claims?.role === "doctor";

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
    <div className="portal-page-container max-w-7xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <Video className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                SESSION LIVE
              </span>
              <span className="text-xs text-muted">· Consultation #{appointmentId}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Encrypted Teleconsultation Suite
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-semibold text-slate-700">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{formatTime(elapsedSeconds)} / 30:00</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted bg-white border border-border px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>256-bit AES P2P</span>
          </div>
        </div>
      </div>

      {/* Main Video & Clinical Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Video Streams */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center">
            {/* Main Remote Video (Doctor or Patient) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 text-white p-6">
              <div className="w-24 h-24 rounded-full bg-teal-600/30 border-2 border-teal-500/50 flex items-center justify-center text-teal-300 text-3xl font-bold mb-4 shadow-inner">
                {isDoctor ? "P" : "Dr"}
              </div>
              <h3 className="text-lg font-bold">
                {isDoctor ? "Patient: Ramesh Kumar" : "Dr. Rajesh Sharma, MD (Cardiology)"}
              </h3>
              <p className="text-xs text-teal-200 mt-0.5">
                {isDoctor ? "Patient Connected · High Quality Stream" : "Consultant Cardiologist · Metro Suite 401"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1 rounded-full text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Microphone Active · 1080p WebRTC</span>
              </div>
            </div>

            {/* Self PIP View (Bottom Right) */}
            <div className="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl flex items-center justify-center">
              {videoEnabled ? (
                <div className="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-600 flex flex-col items-center justify-center text-white text-xs">
                  <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold mb-1">
                    You
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
          <div className="p-4 bg-white border border-border rounded-2xl shadow-sm flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-3.5 rounded-full transition-all ${
                audioEnabled
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-red-100 text-red-700 ring-2 ring-red-500/30"
              }`}
              title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`p-3.5 rounded-full transition-all ${
                videoEnabled
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-red-100 text-red-700 ring-2 ring-red-500/30"
              }`}
              title={videoEnabled ? "Turn Off Video" : "Turn On Video"}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setScreenSharing(!screenSharing)}
              className={`p-3.5 rounded-full transition-all ${
                screenSharing
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="Share Screen or Diagnostic Report"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-md transition-all ml-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Visit</span>
            </button>
          </div>
        </div>

        {/* Right: Clinical Workstation Side Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-5 bg-white border border-border shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-border pb-3 mb-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "notes"
                    ? "bg-teal-800 text-white shadow-sm"
                    : "text-muted hover:bg-slate-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Doctor Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("vitals")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "vitals"
                    ? "bg-teal-800 text-white shadow-sm"
                    : "text-muted hover:bg-slate-100"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Patient Vitals</span>
              </button>
            </div>

            {activeTab === "notes" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted tracking-wider mb-1">
                    Live Clinical Assessment Notes
                  </label>
                  <textarea
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    rows={6}
                    className="w-full text-xs p-3 rounded-lg border border-border focus:ring-2 focus:ring-teal-600 focus:outline-none leading-relaxed"
                    placeholder="Enter patient symptoms, diagnosis, and plan..."
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href="/doctor-portal"
                    className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Digital Rx (Prescription)</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase text-muted tracking-wider block">
                  Latest Patient Vitals Snapshot
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-muted text-[10px] block">Blood Pressure</span>
                    <strong className="text-sm font-bold text-slate-800">120/78 mmHg</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block">Optimal</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-muted text-[10px] block">Heart Rate</span>
                    <strong className="text-sm font-bold text-slate-800">72 BPM</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block">Normal Sinus</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-muted text-[10px] block">Oxygen Saturation</span>
                    <strong className="text-sm font-bold text-slate-800">99% SpO2</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block">Normal Air</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-muted text-[10px] block">Blood Sugar</span>
                    <strong className="text-sm font-bold text-slate-800">94 mg/dL</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block">Fasting Normal</span>
                  </div>
                </div>

                <Link
                  href="/vitals"
                  className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>View Complete Vitals History →</span>
                </Link>
              </div>
            )}
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
        <div className="portal-page-container p-12 text-center text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
          <p className="text-xs">Connecting to secure medical stream...</p>
        </div>
      }
    >
      <TeleconsultRoomContent />
    </Suspense>
  );
}
