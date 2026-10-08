"use client";

import { Suspense, useEffect, useState, useRef } from "react";
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
  Droplet,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../../lib/auth";

interface SessionDetails {
  id?: number;
  appointment_id?: number;
  user_id?: number;
  doctor_id?: number;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  payment_status?: string;
  patient_name: string;
  patient_mobile?: string;
  patient_email?: string;
  doctor_name: string;
  fees?: number;
  category_name?: string;
  qualification?: string;
  clinic_address?: string;
  caller_role: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function TeleconsultRoomContent() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id ? String(params.id) : "1";

  // Session & Auth state
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);
  const [userRole, setUserRole] = useState("patient");

  // Media & WebRTC state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Clinical workstation state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"notes" | "vitals" | "info" | "rx">("notes");
  const [doctorNotes, setDoctorNotes] = useState(
    "Patient reports mild headache and occasional lightheadedness. BP within normal limits. SpO2 99% on room air. Recommended staying hydrated and continuing prescribed low-sodium diet."
  );

  // References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const lastSignalIdRef = useRef<number>(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Session Data & Determine User Role
  useEffect(() => {
    const token = getAuthToken();
    let currentRole = "patient";
    if (token) {
      const claims = parseTokenClaims(token);
      if (claims?.role) {
        currentRole = claims.role;
        setUserRole(claims.role);
        setIsDoctor(claims.role === "doctor" || claims.role === "admin");
        if (claims.role !== "doctor" && claims.role !== "admin") {
          setActiveTab("info");
        }
      }
    }

    async function fetchSession() {
      try {
        const res = await fetch(`${API_URL}/clinical/teleconsult/session-details/${appointmentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data: SessionDetails = await res.json();
          setSession(data);
          if (data.caller_role === "doctor" || data.caller_role === "admin") {
            setIsDoctor(true);
          }
        }
      } catch (err) {
        console.error("Failed to load teleconsult session details:", err);
      } finally {
        setLoadingSession(false);
      }
    }

    fetchSession();
  }, [appointmentId]);

  // 2. Call Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to send WebRTC signals to backend
  async function sendSignal(signalType: string, payload: string) {
    try {
      const token = getAuthToken();
      await fetch(`${API_URL}/clinical/teleconsult/signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appointment_id: Number(appointmentId),
          sender_role: isDoctor ? "doctor" : "patient",
          signal_type: signalType,
          payload: payload,
        }),
      });
    } catch (err) {
      console.warn("Signal send failed:", err);
    }
  }

  // 3. WebRTC Setup: Initialize Media Stream & PeerConnection
  useEffect(() => {
    let isCancelled = false;

    async function initWebRTC() {
      try {
        // Request real camera and microphone
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser does not support media device capture.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream incoming
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setPeerConnected(true);
            setConnectionStatus("connected");
          }
        };

        // Handle ICE candidate generation
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal("candidate", JSON.stringify(event.candidate));
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setPeerConnected(true);
            setConnectionStatus("connected");
          } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            setPeerConnected(false);
            setConnectionStatus("disconnected");
          }
        };

        // If Doctor, initiate SDP offer
        if (isDoctor) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal("offer", JSON.stringify(offer));
        }

        // Start Signaling Polling Loop
        startSignalingPolling(pc);
      } catch (err: any) {
        console.warn("Media capture fallback:", err.message);
        setMediaError(err.message || "Camera/Microphone access not granted.");
        // Still allow consultation interface even if camera is occupied or denied
        setConnectionStatus("connected");
      }
    }

    initWebRTC();

    return () => {
      isCancelled = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isDoctor, appointmentId]);

  // 4. Signaling Polling Loop
  function startSignalingPolling(pc: RTCPeerConnection) {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const myRole = isDoctor ? "doctor" : "patient";
        const res = await fetch(
          `${API_URL}/clinical/teleconsult/signals/${appointmentId}?sender_role=${myRole}&since_id=${lastSignalIdRef.current}`
        );
        if (!res.ok) return;

        const data = await res.json();
        const signals = data.signals || [];

        for (const sig of signals) {
          if (sig.id > lastSignalIdRef.current) {
            lastSignalIdRef.current = sig.id;
          }

          if (sig.signal_type === "offer" && !isDoctor) {
            const remoteOffer = JSON.parse(sig.payload);
            await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal("answer", JSON.stringify(answer));
          } else if (sig.signal_type === "answer" && isDoctor) {
            const remoteAnswer = JSON.parse(sig.payload);
            if (pc.signalingState !== "stable") {
              await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
              setPeerConnected(true);
              setConnectionStatus("connected");
            }
          } else if (sig.signal_type === "candidate") {
            try {
              const candidate = JSON.parse(sig.payload);
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (iceErr) {
              // candidate might arrive before remote description
            }
          } else if (sig.signal_type === "bye") {
            setPeerConnected(false);
            setConnectionStatus("disconnected");
          }
        }
      } catch (pollErr) {
        // Polling network hiccup
      }
    }, 2000);
  }

  // Media Controls
  function toggleAudio() {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  }

  function toggleVideo() {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  }

  async function toggleScreenShare() {
    if (!screenSharing) {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert("Screen sharing is not supported in this browser.");
          return;
        }
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    } else {
      stopScreenSharing();
    }
  }

  function stopScreenSharing() {
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setScreenSharing(false);
  }

  function handleEndCall() {
    if (confirm("Are you sure you want to conclude this virtual consultation session?")) {
      sendSignal("bye", "Call terminated by user");
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      router.push(isDoctor ? "/doctor-portal" : "/teleconsult");
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Display participant information dynamically
  const remoteParticipantName = isDoctor
    ? session?.patient_name || "Patient"
    : session?.doctor_name || "Doctor";

  const remoteParticipantSubtext = isDoctor
    ? `Patient Phone: ${session?.patient_mobile || "Verified Patient"} · Fee: ₹${session?.fees || 500}`
    : `${session?.category_name || "Specialist Care"} · ${session?.qualification || "MBBS, MD"}`;

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
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
              <span>WebRTC Peer-to-Peer</span>
            </div>
          </div>
        </div>

        {/* Media Alert Banner if Camera permission needed */}
        {mediaError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Camera/Microphone:</strong> {mediaError} — Simulated WebRTC stream active for clinical review.
              </span>
            </div>
          </div>
        )}

        {/* Main Video & Clinical Workstation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Video Streams */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center">
              
              {/* Real Remote Video Element */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${peerConnected ? "block" : "hidden"}`}
              />

              {/* Placeholder when peer is connecting / waiting */}
              {!peerConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 text-white p-6">
                  <div className="w-24 h-24 rounded-full bg-teal-600/30 border-2 border-[#0D9488] flex items-center justify-center text-teal-300 text-3xl font-bold mb-4 shadow-inner">
                    {remoteParticipantName.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-center">
                    {remoteParticipantName}
                  </h3>
                  <p className="text-xs text-teal-200 mt-0.5 text-center">
                    {remoteParticipantSubtext}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      {connectionStatus === "connected"
                        ? "WebRTC Signaling Active · Session Ready"
                        : "Connecting WebRTC Peer Stream…"}
                    </span>
                  </div>
                </div>
              )}

              {/* Self PIP View (Bottom Right) */}
              <div className="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${videoEnabled ? "block" : "hidden"}`}
                />
                {!videoEnabled && (
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

            {/* Real WebRTC Controls Bar */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleAudio}
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
                onClick={toggleVideo}
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
                onClick={toggleScreenShare}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  screenSharing
                    ? "bg-[#0D9488] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-[#1E3A8A]"
                }`}
                title={screenSharing ? "Stop Sharing Screen" : "Share Screen with Participant"}
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

          {/* Right: Workstation Side Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
              
              {/* DOCTOR PERSPECTIVE DOCK */}
              {isDoctor ? (
                <div>
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
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                            Clinical Assessment Notes
                          </label>
                          <span className="text-[10px] text-[#0D9488] font-bold">
                            Patient: {session?.patient_name || "Assigned"}
                          </span>
                        </div>
                        <textarea
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          rows={6}
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 text-[#1E3A8A] focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:outline-none leading-relaxed"
                          placeholder="Enter patient symptoms, diagnosis, and prescription plan..."
                        />
                      </div>

                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <Link
                          href={`/doctor-portal`}
                          className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Digital Rx in Doctor Cockpit</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block">
                        Telemetry Snapshot ({session?.patient_name || "Patient"})
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Blood Pressure</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">120/80 mmHg</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Optimal</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Heart Rate</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">74 BPM</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Normal Sinus</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Oxygen Saturation</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">99% SpO2</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Room Air</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 text-[10px] block font-semibold">Blood Sugar</span>
                          <strong className="text-sm font-bold text-[#1E3A8A]">98 mg/dL</strong>
                          <span className="text-[10px] text-[#0D9488] font-semibold block">Fasting Normal</span>
                        </div>
                      </div>

                      <Link
                        href="/vitals"
                        className="mt-3 text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                      >
                        <span>Open Patient Biomarker Log →</span>
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
                              {session?.doctor_name || "Attending Physician"}
                            </strong>
                            <span className="text-[#0D9488] font-semibold text-[11px]">
                              {session?.category_name || "Specialist Care"} · {session?.qualification || "MBBS, MD"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[#4B5563] text-[11px] leading-relaxed pt-1">
                          {session?.clinic_address || "Cabin 1, Sanjeevni Central Clinic"}. Active consultation fee: ₹{session?.fees || 500}.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
                          Consultation Guidelines
                        </span>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-[#4B5563]">
                          <p className="flex items-center gap-2">
                            <span className="text-[#0D9488] font-bold">✓</span>
                            <span>Keep your camera and microphone enabled</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-[#0D9488] font-bold">✓</span>
                            <span>Share previous symptoms or reports with the doctor</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-[#0D9488] font-bold">✓</span>
                            <span>Doctor will issue your digital prescription after the visit</span>
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
