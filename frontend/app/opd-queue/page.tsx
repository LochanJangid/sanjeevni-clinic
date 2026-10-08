"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Tv, 
  Clock, 
  Volume2, 
  Maximize2, 
  Minimize2, 
  Users, 
  Sparkles, 
  Stethoscope, 
  ArrowRight,
  BellRing
} from "lucide-react";
import { getAuthToken } from "../../lib/auth";
import { getStoredHospitalName } from "../../lib/hospital";

interface DoctorDuty {
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  room: string;
  current_token: number | null;
  waiting_tokens: number[];
  completed_count: number;
}

interface QueueData {
  date: string;
  total_active: number;
  doctors_on_duty: DoctorDuty[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function OpdQueueScreenPage() {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [callingDocId, setCallingDocId] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleName = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleName);
    return () => window.removeEventListener("hospital-name-change", handleName);
  }, []);

  async function fetchQueue() {
    try {
      const res = await fetch(`${API_URL}/clinical/opd-queue/live`);
      if (res.ok) {
        const data = await res.json();
        setQueueData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 6000); // Poll every 6 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  async function handleCallNext(doctor_id: number, docName: string) {
    setCallingDocId(doctor_id);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/opd-queue/call-next/${doctor_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setAnnouncement(`🔔 Token #${data.token.token_number} please proceed to ${docName}'s Cabin`);
          setTimeout(() => setAnnouncement(null), 8000);
        } else {
          setAnnouncement(`ℹ️ ${data.msg || "No waiting patients in queue"}`);
          setTimeout(() => setAnnouncement(null), 5000);
        }
        await fetchQueue();
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn("Call next returned non-ok:", err);
      }
    } catch (e) {
      console.error("Failed to call next token:", e);
    } finally {
      setCallingDocId(null);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 ${isFullscreen ? "p-8" : "p-4 md:p-8"}`}>
      {/* Top TV Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            +
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
                {hospitalName.toUpperCase()} OPD CENTRAL QUEUE DISPLAY
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {hospitalName} Reception TV Kiosk
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {announcement && (
            <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>{announcement}</span>
            </div>
          )}

          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
              CLINIC CLOCK
            </span>
            <span className="text-xl font-mono font-bold text-teal-300">
              {currentTime}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="Toggle TV Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Cabin Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-3" />
            <p className="text-sm">Connecting to OPD Token Dispatch...</p>
          </div>
        ) : !queueData || queueData.doctors_on_duty.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            No active doctor queues today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queueData.doctors_on_duty.map((doc) => (
              <div
                key={doc.doctor_id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-teal-400 font-bold bg-teal-950/70 border border-teal-800/60 px-2.5 py-1 rounded-md">
                        {doc.specialty}
                      </span>
                      <h2 className="text-lg font-bold text-white mt-2">
                        {doc.doctor_name}
                      </h2>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {doc.room}
                      </span>
                    </div>

                    <span className="w-10 h-10 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Now Serving Highlight Box */}
                  <div className="my-5 p-5 bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-teal-500/40 rounded-xl text-center shadow-inner">
                    <span className="text-[11px] uppercase tracking-widest text-slate-400 block font-bold mb-1">
                      NOW CONSULTING
                    </span>
                    {doc.current_token ? (
                      <div className="text-5xl font-mono font-black text-emerald-400 tracking-wider">
                        #{doc.current_token}
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-slate-500 py-3">
                        Ready for Patient
                      </div>
                    )}
                  </div>

                  {/* Waiting Queue */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Next In Line:</span>
                      <span className="font-bold text-slate-300">
                        {doc.waiting_tokens.length} waiting
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.waiting_tokens.length === 0 ? (
                        <span className="text-slate-600 text-xs italic">
                          No patients in queue
                        </span>
                      ) : (
                        doc.waiting_tokens.slice(0, 6).map((tok) => (
                          <span
                            key={tok}
                            className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-md font-mono text-xs font-bold"
                          >
                            #{tok}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Staff Dispatch Action */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={callingDocId === doc.doctor_id}
                    onClick={() => handleCallNext(doc.doctor_id, doc.doctor_name)}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {callingDocId === doc.doctor_id ? "Calling..." : "Call Next Patient (Chime)"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Footer */}
      <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Central OPD Synchronization Active · Audio Chime Enabled</span>
        </div>
        <Link href="/" className="text-teal-400 hover:text-teal-300">
          ← Return to Sanjeevni Portal
        </Link>
      </div>
    </div>
  );
}
