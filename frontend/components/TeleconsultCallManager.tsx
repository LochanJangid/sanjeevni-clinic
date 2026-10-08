"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Video, Phone, PhoneOff, Check, X, ShieldCheck } from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Gentle clinical phone ring chime using Web Audio API
function playRingtone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Play dual-tone ring cadence
    [440, 480].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    });
  } catch (e) {
    // Audio context may be restricted by autoplay policy
  }
}

interface IncomingCallData {
  id: number;
  appointment_id: number;
  caller_role: string;
  caller_name: string;
  recipient_role: string;
  doctor_id: number;
  patient_id: number;
  status: string;
  doctor_name?: string;
}

export default function TeleconsultCallManager() {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [answering, setAnswering] = useState(false);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkCall() {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/clinical/teleconsult/check-incoming-call`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.has_incoming_call && data.call) {
              setIncomingCall(data.call);
            } else {
              setIncomingCall(null);
            }
          }
        }
      } catch (e) {
        // Quiet network check
      }
    }

    // Check every 3.5 seconds
    const interval = setInterval(checkCall, 3500);
    checkCall();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Ring tone loop while call is incoming
  useEffect(() => {
    if (incomingCall) {
      playRingtone();
      ringIntervalRef.current = setInterval(playRingtone, 2400);
    } else {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    }

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [incomingCall]);

  async function handleRespond(action: "accept" | "decline") {
    if (!incomingCall) return;
    setAnswering(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/teleconsult/respond-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          call_id: incomingCall.id,
          action,
        }),
      });

      if (res.ok) {
        const apptId = incomingCall.appointment_id;
        setIncomingCall(null);
        if (action === "accept") {
          router.push(`/teleconsult/${apptId}?call_id=${incomingCall.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnswering(false);
    }
  }

  if (!incomingCall) return null;

  const isCallerDoctor = incomingCall.caller_role === "doctor";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#0D9488] overflow-y-auto max-h-[90vh] my-auto p-6 sm:p-8 text-center space-y-6">
        {/* Pulsing Call Avatar */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#0D9488]/20 animate-ping" />
          <span className="absolute inset-1 rounded-full bg-[#0D9488]/30 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white">
            <Video className="w-9 h-9 text-teal-300 animate-bounce" />
          </div>
        </div>

        {/* Title and Caller Information */}
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-block">
            INCOMING TELECONSULTATION CALL
          </span>
          <h2 className="text-xl font-black text-[#1E3A8A]">
            {isCallerDoctor ? `Dr. ${incomingCall.caller_name}` : incomingCall.caller_name}
          </h2>
          <p className="text-xs text-[#4B5563]">
            {isCallerDoctor
              ? "Your attending physician is calling you for your scheduled teleconsultation."
              : "Patient is requesting to connect to your virtual chamber."}
          </p>
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Encrypted WebRTC Chamber · Appointment #{incomingCall.appointment_id}</span>
          </div>
        </div>

        {/* Action Buttons: Answer or Decline */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={answering}
            onClick={() => handleRespond("decline")}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <PhoneOff className="w-4 h-4 text-rose-600" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            disabled={answering}
            onClick={() => handleRespond("accept")}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 animate-pulse"
          >
            <Phone className="w-4 h-4 text-white" />
            <span>{answering ? "Connecting…" : "Answer Call"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
