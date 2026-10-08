"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Tv,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  Sparkles,
  Stethoscope,
  ArrowRight,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Radio,
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

// Pure Web Audio API authentic hospital two-tone chime (E5 -> C5)
function playHospitalChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First Bell Tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Second Bell Tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, now + 0.32); // C5
    gain2.gain.setValueAtTime(0.35, now + 0.32);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.32);
    osc2.stop(now + 1.5);
  } catch (err) {
    console.warn("Browser prevented WebAudio chime:", err);
  }
}

export default function OpdQueueScreenPage() {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [callingDocId, setCallingDocId] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Track latest announced token to chime on updates
  const lastAnnouncedTokenRef = useRef<number | null>(null);

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
        const data: QueueData = await res.json();
        setQueueData(data);

        // Check if any doctor just called a new token
        for (const doc of data.doctors_on_duty) {
          if (
            doc.current_token &&
            lastAnnouncedTokenRef.current !== null &&
            doc.current_token !== lastAnnouncedTokenRef.current
          ) {
            if (audioEnabled) playHospitalChime();
            setAnnouncement(`🔔 Token #${doc.current_token} → Please proceed to ${doc.room} (${doc.doctor_name})`);
            setTimeout(() => setAnnouncement(null), 9000);
            lastAnnouncedTokenRef.current = doc.current_token;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [audioEnabled]);

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
      setCurrentDateFormatted(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  async function handleCallNext(doctor_id: number, docName: string, room: string) {
    setCallingDocId(doctor_id);
    const token = getAuthToken();

    try {
      if (audioEnabled) playHospitalChime();

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
          lastAnnouncedTokenRef.current = data.token.token_number;
          setAnnouncement(`🔔 Token #${data.token.token_number} → Please proceed to ${room} (${docName})`);
          setTimeout(() => setAnnouncement(null), 9000);
        } else {
          setAnnouncement(`ℹ️ ${data.msg || "No waiting patients in queue"}`);
          setTimeout(() => setAnnouncement(null), 4000);
        }
        await fetchQueue();
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
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white ${
        isFullscreen ? "p-8" : "p-4 md:p-8"
      }`}
    >
      <div>
        {/* Top TV Screen Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-emerald-950/60">
              ✚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold">
                  {hospitalName.toUpperCase()} · OPD CENTRAL QUEUE DISPLAY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                Waiting Hall Digital Reception Display
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Audio chime toggle & test */}
            <button
              type="button"
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                if (next) playHospitalChime();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                audioEnabled
                  ? "bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
              }`}
              title="Toggle or test audio arrival chime"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioEnabled ? "Audio Chime ON" : "Chime Muted"}</span>
            </button>

            {/* Clinic Clock & Date */}
            <div className="px-5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-right shadow-inner">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                {currentDateFormatted || "LIVE CLOCK"}
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
                {currentTime}
              </span>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-2xl transition shadow-md"
              title="Toggle TV Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* High-Visibility Announcement Marquee Banner */}
        {announcement && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-slate-950 font-black text-base sm:text-lg flex items-center justify-between shadow-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <BellRing className="w-6 h-6 animate-bounce shrink-0" />
              <span>{announcement}</span>
            </div>
            <span className="text-xs bg-slate-950/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Token Announcement
            </span>
          </div>
        )}

        {/* Main Cabin & Doctor Token Cards Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="p-20 text-center text-slate-500 space-y-3">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-2" />
              <p className="text-sm font-semibold">Connecting to OPD Central Token Dispatch…</p>
            </div>
          ) : !queueData || queueData.doctors_on_duty.length === 0 ? (
            <div className="p-16 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
              <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No active doctor OPD queues today</h3>
              <p className="text-xs text-slate-500 mt-1">
                Doctor consultations open daily at 09:00 AM. Tokens will appear automatically once checked in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queueData.doctors_on_duty.map((doc) => (
                <div
                  key={doc.doctor_id}
                  className="bg-slate-900/90 border-2 border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header: Specialty & Cabin */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
                          {doc.specialty}
                        </span>
                        <h2 className="text-xl font-black text-white mt-2">
                          {doc.doctor_name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{doc.room}</span>
                        </div>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                    </div>

                    {/* NOW CONSULTING GIANT TOKEN BOX */}
                    <div className="my-5 p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl text-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                        <span>NOW CALLING</span>
                      </div>
                      <div className="pt-3">
                        {doc.current_token ? (
                          <div className="text-6xl sm:text-7xl font-mono font-black text-emerald-400 tracking-wider">
                            #{doc.current_token}
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-slate-500 py-4">
                            Ready for Next
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-1">
                        Report directly to {doc.room}
                      </span>
                    </div>

                    {/* Waiting Tokens Line */}
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex justify-between text-slate-400 font-medium">
                        <span>Upcoming in Queue:</span>
                        <span className="font-bold text-slate-200">
                          {doc.waiting_tokens.length} waiting
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {doc.waiting_tokens.length === 0 ? (
                          <span className="text-slate-600 text-xs italic">
                            Queue clear · No waiting patients
                          </span>
                        ) : (
                          doc.waiting_tokens.slice(0, 5).map((tok) => (
                            <span
                              key={tok}
                              className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-mono text-xs font-bold shadow-sm"
                            >
                              #{tok}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Staff Dispatch Action (Chime simulation) */}
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={callingDocId === doc.doctor_id}
                      onClick={() => handleCallNext(doc.doctor_id, doc.doctor_name, doc.room)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/60 disabled:opacity-50"
                    >
                      <Volume2 className="w-4 h-4 text-slate-950" />
                      <span>
                        {callingDocId === doc.doctor_id
                          ? "Calling Next Patient…"
                          : "Call Next Patient (Chime 🔔)"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screen Footer & Scrolling Bilingual Ticker */}
      <div className="mt-12 space-y-4">
        {/* Bilingual Public Guidance Ticker */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase shrink-0">
              PATIENT GUIDELINE
            </span>
            <span className="truncate text-slate-300">
              कृपया टोकन नंबर स्क्रीन पर प्रदर्शित होने पर संबंधित डॉक्टर केबिन में प्रवेश करें · Please carry your previous medical prescriptions &amp; report to reception if in pain.
            </span>
          </div>
          <span className="text-slate-500 text-[11px] font-mono shrink-0 hidden sm:inline-block">
            Auto-Sync 5s
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Central Hospital Audio TV Signage · DPDP Compliant Token Security</span>
          </div>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            ← Return to Hospital Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
