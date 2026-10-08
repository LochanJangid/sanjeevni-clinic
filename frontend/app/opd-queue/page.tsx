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
  Plus,
  X,
  UserPlus,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";
import { getStoredHospitalName } from "../../lib/hospital";

interface DoctorDuty {
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  room: string;
  current_token: number | null;
  called_at?: string | null;
  patient_arrived?: boolean;
  active_patient_name?: string | null;
  waiting_tokens: number[];
  completed_count: number;
}

interface RawToken {
  id: number;
  token_number: number;
  status: string;
  patient_name?: string;
  doctor_id: number;
}

interface QueueData {
  date: string;
  total_active: number;
  doctors_on_duty: DoctorDuty[];
  raw_tokens?: RawToken[];
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
  const [completingDocId, setCompletingDocId] = useState<number | null>(null);
  const [confirmingArrivalDocId, setConfirmingArrivalDocId] = useState<number | null>(null);
  const [requeueingDocId, setRequeueingDocId] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [userRole, setUserRole] = useState("patient");
  const [loggedInDoctorId, setLoggedInDoctorId] = useState<number | null>(null);

  // Check-In Modal State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInName, setCheckInName] = useState("");
  const [checkInDoctorId, setCheckInDoctorId] = useState<number>(1);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Track latest announced token to chime on updates
  const lastAnnouncedTokenRef = useRef<number | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const claims = parseTokenClaims(token);
      if (claims?.role) setUserRole(claims.role);
      if (claims?.doctor_id) {
        setLoggedInDoctorId(claims.doctor_id);
        setCheckInDoctorId(claims.doctor_id);
      }
    }
  }, []);

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

  async function handleCompleteCurrent(doctor_id: number, docName: string) {
    setCompletingDocId(doctor_id);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/opd-queue/complete-current/${doctor_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (audioEnabled) playHospitalChime();
          setAnnouncement(`✅ Session Completed: Token #${data.token_number} (${data.patient_name}). Notification sent to patient.`);
          setTimeout(() => setAnnouncement(null), 8000);
        } else {
          setAnnouncement(`ℹ️ ${data.msg || "No active patient in consultation"}`);
          setTimeout(() => setAnnouncement(null), 4000);
        }
        await fetchQueue();
      }
    } catch (e) {
      console.error("Failed to complete current session:", e);
    } finally {
      setCompletingDocId(null);
    }
  }

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

  async function handleConfirmArrival(doctor_id: number, docName: string, tokenNum: number) {
    setConfirmingArrivalDocId(doctor_id);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/clinical/opd-queue/confirm-arrival/${doctor_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (audioEnabled) playHospitalChime();
        setAnnouncement(`✓ Patient Arrived: Token #${tokenNum} entered cabin (${docName}). Consultation in session.`);
        setTimeout(() => setAnnouncement(null), 8000);
        await fetchQueue();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Could not confirm patient arrival.");
      }
    } catch (err) {
      console.error("Arrival confirm failed:", err);
    } finally {
      setConfirmingArrivalDocId(null);
    }
  }

  async function handlePushToEnd(doctor_id: number, docName: string, tokenNum: number) {
    if (!confirm(`Patient Token #${tokenNum} has not arrived within 1 minute. Move this token to the end of today's queue and call the next patient?`)) {
      return;
    }
    setRequeueingDocId(doctor_id);
    const token = getAuthToken();
    try {
      if (audioEnabled) playHospitalChime();
      const res = await fetch(`${API_URL}/clinical/opd-queue/push-to-end/${doctor_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAnnouncement(`⚠️ Patient Absent: Token #${tokenNum} moved to end of queue. ${data.msg}`);
        setTimeout(() => setAnnouncement(null), 9000);
        await fetchQueue();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Could not re-queue patient.");
      }
    } catch (err) {
      console.error("Push to end failed:", err);
    } finally {
      setRequeueingDocId(null);
    }
  }

  async function handleCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkInName.trim()) return;
    setSubmittingCheckIn(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/opd-queue/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctor_id: checkInDoctorId,
          patient_name: checkInName.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnnouncement(`✓ Patient ${checkInName} checked in. Assigned Token #${data.token.token_number}.`);
        setTimeout(() => setAnnouncement(null), 7000);
        setCheckInName("");
        setShowCheckInModal(false);
        await fetchQueue();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to check in patient.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error checking in patient.");
    } finally {
      setSubmittingCheckIn(false);
    }
  }

  async function handleRemoveToken(docId: number, tokenNum: number) {
    if (!confirm(`Are you sure you want to remove Token #${tokenNum} from the queue?`)) return;
    const token = getAuthToken();

    // Find the raw token id
    const found = queueData?.raw_tokens?.find(
      (t) => t.doctor_id === docId && t.token_number === tokenNum && t.status === "waiting"
    );
    const tokenIdToRemove = found ? found.id : tokenNum;

    try {
      const res = await fetch(`${API_URL}/clinical/opd-queue/remove-token/${tokenIdToRemove}`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setAnnouncement(`Token #${tokenNum} removed from queue.`);
        setTimeout(() => setAnnouncement(null), 4000);
        await fetchQueue();
      }
    } catch (e) {
      console.error("Failed to remove token:", e);
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

  const isDoctorOrAdmin = userRole === "doctor" || userRole === "admin";

  return (
    <div
      className={`min-h-screen bg-white text-[#4B5563] flex flex-col justify-between selection:bg-[#0D9488] selection:text-white ${
        isFullscreen ? "p-8" : "p-4 md:p-8"
      }`}
    >
      <div>
        {/* Top TV Screen Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] flex items-center justify-center font-black text-3xl text-white shadow-md">
              ✚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-[#0D9488] font-extrabold">
                  {hospitalName.toUpperCase()} · OPD CENTRAL QUEUE DISPLAY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E3A8A] mt-0.5">
                Waiting Hall Digital Reception Display
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Doctor / Staff Quick Check-In Button */}
            {isDoctorOrAdmin && (
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>+ Check-In Patient to Queue</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) playHospitalChime();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition shadow-sm ${
                audioEnabled
                  ? "bg-teal-50 border-teal-200 text-[#0D9488]"
                  : "bg-slate-50 border-gray-200 text-gray-500"
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-[#0D9488]" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioEnabled ? "Audio Chime ON" : "Chime Muted"}</span>
            </button>

            {/* Clinic Clock & Date */}
            <div className="px-5 py-2.5 bg-slate-50 border border-gray-200 rounded-2xl text-right shadow-sm">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
                {currentDateFormatted || "LIVE CLOCK"}
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-[#1E3A8A]">
                {currentTime}
              </span>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-[#4B5563] border border-gray-200 rounded-2xl transition shadow-sm"
              title="Toggle TV Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* High-Visibility Announcement Marquee Banner */}
        {announcement && (
          <div className="mt-6 p-4 rounded-2xl bg-[#1E3A8A] text-white font-bold text-base sm:text-lg flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <BellRing className="w-6 h-6 animate-bounce shrink-0 text-teal-300" />
              <span>{announcement}</span>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Token Announcement
            </span>
          </div>
        )}

        {/* Main Cabin & Doctor Token Cards Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="p-20 text-center text-gray-400 space-y-3">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mb-2" />
              <p className="text-sm font-semibold">Connecting to OPD Central Token Dispatch…</p>
            </div>
          ) : !queueData || queueData.doctors_on_duty.length === 0 ? (
            <div className="p-16 text-center text-gray-500 bg-slate-50 rounded-3xl border border-gray-200">
              <Tv className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#1E3A8A]">No active doctor OPD queues today</h3>
              <p className="text-xs text-gray-400 mt-1">
                Doctor consultations open daily at 09:00 AM. Tokens will appear automatically once checked in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queueData.doctors_on_duty.map((doc) => {
                const isMyCabin = userRole === "admin" || (userRole === "doctor" && loggedInDoctorId === doc.doctor_id);
                const elapsedSecs = doc.called_at 
                  ? Math.max(0, Math.floor((Date.now() - new Date(doc.called_at).getTime()) / 1000))
                  : 0;

                return (
                  <div
                    key={doc.doctor_id}
                    className={`bg-white border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                      isMyCabin ? "border-[#0D9488]/60 ring-2 ring-[#0D9488]/10" : "border-gray-200"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Chamber and Specialist Header */}
                      <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1E3A8A] font-mono text-[11px] font-bold uppercase tracking-wider border border-blue-200">
                              {doc.room}
                            </span>
                            {userRole === "doctor" && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  loggedInDoctorId === doc.doctor_id
                                    ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {loggedInDoctorId === doc.doctor_id ? "YOUR CABIN" : "OTHER CABIN"}
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-[#1E3A8A] mt-2">
                            {doc.doctor_name}
                          </h2>
                          <span className="text-xs text-[#4B5563] block mt-0.5">
                            {doc.specialty}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
                          <Stethoscope className="w-5 h-5 text-[#0D9488]" />
                        </div>
                      </div>

                      {/* Active Calling Token Display */}
                      <div className="p-5 rounded-2xl bg-teal-50/70 border-2 border-teal-200/90 text-center relative overflow-hidden">
                        <span className="text-[11px] uppercase tracking-widest text-[#0D9488] font-black block">
                          NOW CONSULTING IN CABIN
                        </span>
                        <div className="my-2">
                          {doc.current_token ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="text-5xl font-black font-mono tracking-tight text-[#1E3A8A]">
                                #{doc.current_token}
                              </span>
                              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                            </div>
                          ) : (
                            <span className="text-2xl font-bold font-mono text-gray-400 italic">
                              READY FOR NEXT
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#4B5563] font-medium block">
                          {doc.active_patient_name 
                            ? `Patient: ${doc.active_patient_name}` 
                            : `Report directly to ${doc.room}`}
                        </span>

                        {/* 1-Minute Absent & Arrival Status Box */}
                        {doc.current_token && (
                          <div className="mt-3 pt-3 border-t border-teal-200/70 text-left">
                            {!doc.patient_arrived ? (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                    <span>Arrival Countdown:</span>
                                  </div>
                                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                    elapsedSecs >= 60 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {elapsedSecs >= 60 ? `ABSENT (${elapsedSecs}s)` : `${elapsedSecs}s / 60s`}
                                  </span>
                                </div>

                                {elapsedSecs >= 60 ? (
                                  <p className="text-[11px] text-rose-700 font-semibold leading-tight">
                                    ⚠️ Patient has not arrived within 1 minute. Doctor can re-queue them to the end of the queue and call the next patient.
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-amber-700 leading-tight">
                                    Token called. Waiting for patient to enter cabin.
                                  </p>
                                )}

                                {isMyCabin && (
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={confirmingArrivalDocId === doc.doctor_id}
                                      onClick={() => handleConfirmArrival(doc.doctor_id, doc.doctor_name, doc.current_token!)}
                                      className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Arrived? (Yes)</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={requeueingDocId === doc.doctor_id}
                                      onClick={() => handlePushToEnd(doc.doctor_id, doc.doctor_name, doc.current_token!)}
                                      className="py-2 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                                    >
                                      <span>Absent (Move to End)</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 bg-teal-100/70 rounded-xl border border-teal-300 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-[#0D9488] font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                                  <span>Patient in Cabin · In Consultation</span>
                                </div>
                                <span className="text-[10px] bg-white text-[#0D9488] px-2 py-0.5 rounded-full font-mono font-bold shadow-xs">
                                  ACTIVE
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Waiting Tokens Line with Doctor Remove Control */}
                      <div className="space-y-2 text-xs pt-1">
                        <div className="flex justify-between text-gray-500 font-medium">
                          <span>Upcoming in Queue:</span>
                          <span className="font-bold text-[#1E3A8A]">
                            {doc.waiting_tokens.length} waiting
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {doc.waiting_tokens.length === 0 ? (
                            <span className="text-gray-400 text-xs italic">
                              Queue clear · No waiting patients
                            </span>
                          ) : (
                            doc.waiting_tokens.slice(0, 6).map((tok) => (
                              <span
                                key={tok}
                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-[#1E3A8A] border border-gray-200 rounded-xl font-mono text-xs font-bold shadow-sm"
                              >
                                <span>#{tok}</span>
                                {isMyCabin && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveToken(doc.doctor_id, tok)}
                                    title="Remove patient from queue"
                                    className="text-gray-400 hover:text-rose-600 transition p-0.5 rounded cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Dispatch Action & Session Completion */}
                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                      {isMyCabin ? (
                        <>
                          {doc.current_token && doc.patient_arrived && (
                            <button
                              type="button"
                              disabled={completingDocId === doc.doctor_id}
                              onClick={() => handleCompleteCurrent(doc.doctor_id, doc.doctor_name)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>
                                {completingDocId === doc.doctor_id
                                  ? "Concluding & Notifying Patient…"
                                  : `Conclude Session #${doc.current_token} (Yes ✓)`}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={callingDocId === doc.doctor_id}
                            onClick={() => handleCallNext(doc.doctor_id, doc.doctor_name, doc.room)}
                            className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4 text-white" />
                            <span>
                              {callingDocId === doc.doctor_id
                                ? "Calling Next Patient…"
                                : "Call Next Patient (Chime 🔔)"}
                            </span>
                          </button>
                        </>
                      ) : (
                        <div className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-400 font-medium italic">
                          Isolated to Dr. {doc.doctor_name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-[#1E3A8A] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="absolute right-4 top-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] tracking-widest uppercase font-bold text-teal-200 block">
                OPD RECEPTION DESK
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">
                Check In Patient to Live Waiting Queue
              </h2>
            </div>

            <form onSubmit={handleCheckInSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Patient Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar or Walk-in Patient"
                  value={checkInName}
                  onChange={(e) => setCheckInName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Assign Doctor Cabin:
                  </label>
                  {userRole === "doctor" && (
                    <span className="text-[10px] text-[#0D9488] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Locked to Your Cabin
                    </span>
                  )}
                </div>
                <select
                  value={checkInDoctorId}
                  disabled={userRole === "doctor" && !!loggedInDoctorId}
                  onChange={(e) => setCheckInDoctorId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#0D9488] disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {userRole === "doctor" && loggedInDoctorId ? (
                    queueData?.doctors_on_duty
                      .filter((d) => d.doctor_id === loggedInDoctorId)
                      .map((d) => (
                        <option key={d.doctor_id} value={d.doctor_id}>
                          {d.doctor_name} ({d.specialty} · {d.room})
                        </option>
                      ))
                  ) : (
                    queueData?.doctors_on_duty.map((d) => (
                      <option key={d.doctor_id} value={d.doctor_id}>
                        {d.doctor_name} ({d.specialty} · {d.room})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckIn}
                  className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold transition shadow-sm disabled:opacity-50"
                >
                  {submittingCheckIn ? "Checking In…" : "Issue Token & Place in Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Footer & Scrolling Bilingual Ticker */}
      <div className="mt-12 space-y-4">
        {/* Bilingual Public Guidance Ticker */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-[#4B5563] flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0D9488] text-[10px] font-bold uppercase shrink-0 border border-teal-200">
              PATIENT GUIDELINE
            </span>
            <span className="truncate text-[#4B5563]">
              कृपया टोकन नंबर स्क्रीन पर प्रदर्शित होने पर संबंधित डॉक्टर केबिन में प्रवेश करें · Please carry your previous medical prescriptions &amp; report to reception if in pain.
            </span>
          </div>
          <span className="text-gray-400 text-[11px] font-mono shrink-0 hidden sm:inline-block">
            Auto-Sync 5s
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            <span>Central Hospital Audio TV Signage · DPDP Compliant Token Security</span>
          </div>
          <Link href="/" className="text-[#0D9488] hover:underline font-semibold">
            ← Return to Hospital Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
