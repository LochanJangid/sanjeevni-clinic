"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Wifi,
  Headphones,
  Sparkles,
  Stethoscope,
  FileText,
  Activity,
  Plus,
  Phone,
  PhoneOff,
  X,
  AlertCircle
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";

interface TeleconsultAppointment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  patient_name?: string;
  patient_mobile?: string;
  category_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function TeleconsultationHubPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<TeleconsultAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [userName, setUserName] = useState("");

  // Outgoing call modal state
  const [outgoingCall, setOutgoingCall] = useState<{
    callId: number;
    appointmentId: number;
    recipientName: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const claims = parseTokenClaims(token);
      const role = (claims?.role as "patient" | "doctor" | "admin") || "patient";
      setUserRole(role);
      setUserName(claims?.username || "");

      try {
        if (role === "doctor") {
          // Fetch doctor's roster of teleconsultations
          const docId = claims?.doctor_id || 1;
          const res = await fetch(`${API_URL}/admin/appointments?doctor_id=${docId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
          }
        } else {
          // Fetch patient's upcoming teleconsultations
          const res = await fetch(`${API_URL}/appointments/user/${claims?.sub}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  // Poll outgoing call status
  useEffect(() => {
    if (!outgoingCall || outgoingCall.status !== "calling") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/clinical/teleconsult/call-status/${outgoingCall.callId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "accepted") {
            const destAppt = outgoingCall.appointmentId;
            const destCallId = outgoingCall.callId;
            setOutgoingCall(null);
            router.push(`/teleconsult/${destAppt}?call_id=${destCallId}`);
          } else if (data.status === "declined") {
            setOutgoingCall((prev) => (prev ? { ...prev, status: "declined" } : null));
          }
        }
      } catch (e) {
        console.error("Call status poll error:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [outgoingCall, router]);

  async function handleInitiateCall(appt: TeleconsultAppointment) {
    const token = getAuthToken();
    if (!token) return;

    const recipientName = isDoctor ? (appt.patient_name || "Patient") : appt.doctor_name;

    try {
      const res = await fetch(`${API_URL}/clinical/teleconsult/initiate-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_id: appt.id,
          doctor_id: appt.doctor_id,
          caller_role: isDoctor ? "doctor" : "patient",
          caller_name: userName || (isDoctor ? "Doctor" : "Patient"),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutgoingCall({
          callId: data.call.id,
          appointmentId: appt.id,
          recipientName,
          status: "calling",
        });
      }
    } catch (e) {
      console.error("Failed to initiate call:", e);
    }
  }

  async function handleCancelCall() {
    if (outgoingCall) {
      try {
        await fetch(`${API_URL}/clinical/teleconsult/end-call/${outgoingCall.callId}`, { method: "POST" });
      } catch (e) {}
      setOutgoingCall(null);
    }
  }

  const isDoctor = userRole === "doctor" || userRole === "admin";

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header - Perspective tailored */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-teal-50 text-[#0D9488] border border-teal-200 rounded-2xl shadow-sm">
                {isDoctor ? <Stethoscope className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200">
                    {isDoctor ? "PHYSICIAN TELECONSULTATION DESK" : "PATIENT TELEHEALTH & E-CONSULT"}
                  </span>
                  <span className="text-xs text-gray-400">HD WebRTC Video Suite</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E3A8A] mt-1">
                  {isDoctor 
                    ? `Doctor Virtual Chamber (${userName || "Attending Clinician"})` 
                    : "Virtual Teleconsultation Center"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3.5 py-2 rounded-xl text-[#1E3A8A] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span>End-to-End Encrypted Medical Stream</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#4B5563] max-w-2xl leading-relaxed">
            {isDoctor
              ? "Conduct scheduled high-definition video consultations with patients. Access patient EHR vitals, write electronic medical notes, and issue digital prescriptions during the video call."
              : "Connect securely with Sanjeevni specialists from the comfort of your home. Consult via high-definition video, share clinical symptoms in real time, and receive an instant digital Rx."}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488]">
              <Wifi className="w-5 h-5" />
            </span>
            <div>
              <strong className="text-xs font-bold text-[#1E3A8A] block">Zero App Download</strong>
              <span className="text-[11px] text-[#4B5563]">Runs directly in browser with WebRTC P2P</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#1E3A8A]">
              <Headphones className="w-5 h-5" />
            </span>
            <div>
              <strong className="text-xs font-bold text-[#1E3A8A] block">Crystal Audio &amp; Video</strong>
              <span className="text-[11px] text-[#4B5563]">Adaptive bitrate for low bandwidths</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <strong className="text-xs font-bold text-[#1E3A8A] block">
                {isDoctor ? "Instant Digital Rx Generation" : "Live Rx & Vitals Sync"}
              </strong>
              <span className="text-[11px] text-[#4B5563]">
                {isDoctor ? "Issue dosage plans during consultation" : "Doctor reviews vitals during the call"}
              </span>
            </div>
          </div>
        </div>

        {/* Teleconsult Appointments List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E3A8A]">
              {isDoctor ? "Patient Teleconsultation Queue" : "Your Teleconsultation Appointments"}
            </h2>

            {!isDoctor && (
              <Link
                href="/doctors"
                className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book New Teleconsultation</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-2" />
              <p className="text-xs">Checking virtual consultation room queue...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white p-12 text-center border border-dashed border-gray-200 rounded-3xl shadow-sm space-y-3">
              <Video className="w-10 h-10 text-gray-400 mx-auto opacity-60" />
              <h3 className="font-bold text-[#1E3A8A] text-sm">
                {isDoctor ? "No patient video visits scheduled right now" : "No scheduled teleconsultations"}
              </h3>
              <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
                {isDoctor
                  ? "When patients book video consultations with you, they will appear here ready to connect."
                  : "Book a consultation with any of our accredited doctors to initiate your teleconsultation."}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                {isDoctor ? (
                  <Link
                    href="/doctor-portal"
                    className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition"
                  >
                    Go to Doctor Portal Cockpit
                  </Link>
                ) : (
                  <Link
                    href="/doctors"
                    className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm transition"
                  >
                    Browse Doctors &amp; Slots
                  </Link>
                )}
                <Link 
                  href="/teleconsult/1" 
                  className="px-5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#1E3A8A] font-semibold text-xs border border-gray-200 transition"
                >
                  Open Virtual Chamber Suite →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        {isDoctor ? `Patient Ref #${appt.id}` : (appt.category_name || "Specialist Care")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {appt.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#1E3A8A]">
                      {isDoctor ? (appt.patient_name || "Consultation Patient") : appt.doctor_name}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-[#4B5563]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{appt.appointment_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{appt.appointment_time} (30 mins slot)</span>
                      </div>
                      {isDoctor && appt.patient_mobile && (
                        <div className="text-[11px] text-gray-500 font-mono">
                          Mobile: {appt.patient_mobile}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dual Action: Live Ring Call or Direct Enter */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleInitiateCall(appt)}
                      className="flex-1 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <Phone className="w-4 h-4 text-white animate-pulse" />
                      <span>{isDoctor ? "Call Patient 📞" : "Call Doctor 📞"}</span>
                    </button>

                    <Link
                      href={`/teleconsult/${appt.id}`}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#1E3A8A] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Video className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>Chamber</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outgoing Calling Modal */}
      {outgoingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-y-auto max-h-[90vh] my-auto p-6 sm:p-8 text-center space-y-6">
            {/* Radar Ringing Animation */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              {outgoingCall.status === "calling" ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-[#0D9488]/20 animate-ping" />
                  <span className="absolute inset-2 rounded-full bg-[#0D9488]/30 animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white">
                    <Phone className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </>
              ) : (
                <div className="relative w-20 h-20 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-rose-200">
                  <PhoneOff className="w-8 h-8 text-rose-600" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-block">
                {outgoingCall.status === "calling" ? "OUTGOING TELECONSULTATION CALL" : "CALL NOT ANSWERED"}
              </span>
              <h2 className="text-xl font-black text-[#1E3A8A]">
                {outgoingCall.recipientName}
              </h2>
              <p className="text-xs text-[#4B5563]">
                {outgoingCall.status === "calling"
                  ? "Ringing teleconsultation chamber… Waiting for the other party to answer."
                  : "The recipient is currently unavailable or declined the call."}
              </p>
            </div>

            <div className="pt-2">
              {outgoingCall.status === "calling" ? (
                <button
                  type="button"
                  onClick={handleCancelCall}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <PhoneOff className="w-4 h-4 text-white" />
                  <span>Cancel Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOutgoingCall(null)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
