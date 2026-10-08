"use client";

import { useEffect, useState } from "react";
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
  Sparkles 
} from "lucide-react";
import { getAuthToken } from "../../lib/auth";

interface Appointment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  category_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function TeleconsultationHubPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      const token = getAuthToken();
      try {
        const res = await fetch(`${API_URL}/appointments/my_appointments/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  return (
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-blue-100 text-blue-800 rounded-xl">
              <Video className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">TELEHEALTH &amp; E-CONSULT</span>
                <span className="text-xs text-muted">HD WebRTC Video Suite</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Virtual Teleconsultation Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-900 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>End-to-End Encrypted Medical Stream</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Connect securely with Sanjeevni specialists from the comfort of your home. Consult via high-definition video, share clinical symptoms in real time, and receive an instant digital Rx.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="card p-4 bg-white border border-border flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
            <Wifi className="w-5 h-5" />
          </span>
          <div>
            <strong className="text-xs font-bold text-foreground block">Zero App Download</strong>
            <span className="text-[11px] text-muted">Runs directly in Chrome, Safari &amp; Edge</span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-border flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Headphones className="w-5 h-5" />
          </span>
          <div>
            <strong className="text-xs font-bold text-foreground block">Crystal Audio &amp; Video</strong>
            <span className="text-[11px] text-muted">Adaptive bitrate for low bandwidths</span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-border flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <strong className="text-xs font-bold text-foreground block">Live Rx &amp; Vitals Panel</strong>
            <span className="text-[11px] text-muted">Doctor reviews vitals during the call</span>
          </div>
        </div>
      </div>

      {/* Teleconsult List */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Your Teleconsultation Appointments
        </h2>

        {loading ? (
          <div className="p-8 text-center text-muted">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
            <p className="text-xs">Checking virtual appointment queue...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="card p-10 text-center bg-white border border-dashed border-slate-300">
            <Video className="w-10 h-10 text-muted mx-auto mb-3 opacity-60" />
            <h3 className="font-semibold text-foreground text-sm">No scheduled teleconsultations</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
              Book a consultation with any of our accredited doctors to initiate your teleconsultation.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/doctors" className="button button-primary text-xs">
                Browse Doctors &amp; Slots
              </Link>
              <Link href="/teleconsult/demo" className="button button-quiet text-xs">
                Test Virtual Room Demo →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="card p-5 bg-white border border-border hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {appt.category_name || "Specialist Care"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {appt.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground">
                    {appt.doctor_name}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.appointment_time} (30 mins slot)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/teleconsult/${appt.id}`}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Video Consultation Room</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
