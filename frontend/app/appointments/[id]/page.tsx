"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, FileText, QrCode, ShieldCheck, Video } from "lucide-react";
import { getAuthToken } from "../../../lib/auth";
import { generateIcsCalendar } from "../../../lib/calendar";
import PhonePePaymentModal from "../../../components/PhonePePaymentModal";
import MedicalPaymentReceipt, { PaymentReceiptData } from "../../../components/MedicalPaymentReceipt";

interface AppointmentDetail {
  id: number;
  user_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  doctor_name: string;
  fees: number;
  category_name: string;
  clinic_address: string;
  qualification: string;
  patient_name: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
  transaction_id: string;
  paid_at: string;
  has_prescription: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function AppointmentDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const appointmentId = Number(params?.id);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPhonePeModal, setShowPhonePeModal] = useState(false);
  const [showReceiptSection, setShowReceiptSection] = useState(false);

  useEffect(() => {
    if (searchParams.get("pay") === "phonepe" || searchParams.get("pay") === "1") {
      setShowPhonePeModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadAppointment() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        setError("Please sign in to view appointment details.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unable to retrieve appointment record.");
        const data = await response.json();
        setAppointment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Appointment details unavailable.");
      } finally {
        setLoading(false);
      }
    }

    if (appointmentId) loadAppointment();
  }, [appointmentId]);

  if (loading) {
    return (
      <main className="page-shell">
        <div className="card directory-state">Loading appointment record…</div>
      </main>
    );
  }

  if (error || !appointment) {
    return (
      <main className="page-shell">
        <div className="card directory-state directory-error">
          <h2>Appointment Unavailable</h2>
          <p>{error || "Your appointment record could not be found."}</p>
          <Link href="/appointments" className="button button-quiet">
            Return to appointments
          </Link>
        </div>
      </main>
    );
  }

  const isPaid = appointment.payment_status === "paid";

  const receiptData: PaymentReceiptData = {
    appointment_id: appointment.id,
    receipt_number: `SJ-REC-${appointment.id.toString().padStart(5, "0")}`,
    doctor_name: appointment.doctor_name,
    specialty: appointment.category_name,
    patient_name: appointment.patient_name,
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    clinic_address: appointment.clinic_address,
    amount: appointment.fees,
    payment_method: appointment.payment_method || "phonepe",
    transaction_id: appointment.transaction_id || `PP-TXN-SJ${appointment.id}`,
    paid_at: appointment.paid_at,
  };

  function handlePaymentSuccess(receipt: PaymentReceiptData) {
    setAppointment((prev) =>
      prev
        ? {
            ...prev,
            payment_status: "paid",
            status: "confirmed",
            transaction_id: receipt.transaction_id || prev.transaction_id,
            payment_method: receipt.payment_method || "phonepe",
            paid_at: receipt.paid_at || new Date().toISOString(),
          }
        : null
    );
    setShowReceiptSection(true);
  }

  return (
    <main className="page-shell">
      <div className="doctor-detail-shell space-y-6">
        <div className="rx-action-bar no-print">
          <Link href="/appointments" className="back-link">
            ← Back to appointments
          </Link>
          <div className="flex items-center gap-2">
            {isPaid ? (
              <button
                type="button"
                onClick={() => setShowReceiptSection((prev) => !prev)}
                className="button button-quiet text-emerald-800 border-emerald-300 bg-emerald-50/50"
              >
                <FileText className="w-4 h-4 inline mr-1 text-emerald-600" />
                {showReceiptSection ? "Hide Official Receipt" : "View Official Receipt"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhonePeModal(true)}
                className="button button-primary bg-[#5f259f] hover:bg-[#4d1d82] text-white flex items-center gap-1.5 shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan &amp; Pay via PhonePe (₹{appointment.fees})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="button button-quiet"
            >
              🖨️ Print Slip
            </button>
          </div>
        </div>

        {/* Highlighted PhonePe Payment Callout for Unpaid Visits */}
        {!isPaid && appointment.status !== "cancelled" && (
          <div className="no-print p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50/80 border-2 border-purple-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-bold text-xs">
                  पे
                </span>
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  PhonePe Instant Doctor Payment
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                  Zero Fees
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Consultation Fee Pending: ₹{appointment.fees}
              </h2>
              <p className="text-xs text-slate-600 max-w-xl">
                Scan the doctor&apos;s verified PhonePe QR code on your mobile device to pay directly to {appointment.doctor_name}. An official verified clinic receipt will be generated automatically.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowPhonePeModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5f259f] text-white font-bold text-xs hover:bg-[#4d1d82] transition shadow-md"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan PhonePe QR Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Official Medical Receipt (When paid or toggled) */}
        {(showReceiptSection || isPaid) && (
          <div className="no-print mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Official Digital Tax Receipt &amp; Voucher</span>
              </div>
            </div>
            <MedicalPaymentReceipt
              data={receiptData}
              isEmbedded={true}
            />
          </div>
        )}

        {/* Main Appointment Details Card */}
        <div className="card appointment-detail-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CONFIRMED CONSULTATION</p>
              <h1 className="page-title text-2xl">{appointment.doctor_name}</h1>
              <p className="text-sm text-muted">
                {appointment.category_name} Specialist · {appointment.qualification}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`status-pill ${
                  appointment.status === "completed"
                    ? "status-completed"
                    : appointment.status === "cancelled"
                    ? "status-cancelled"
                    : "status-booked"
                }`}
              >
                {appointment.status.toUpperCase()}
              </span>
              <span
                className={`status-pill ${
                  isPaid ? "status-completed" : "status-pending"
                }`}
              >
                {isPaid ? "PAID ✓" : "UNPAID"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="detail-meta-box">
              <span className="label">Appointment Date</span>
              <strong>{appointment.appointment_date}</strong>
            </div>
            <div className="detail-meta-box">
              <span className="label">Appointment Time</span>
              <strong>{appointment.appointment_time} (30 mins)</strong>
            </div>
            <div className="detail-meta-box">
              <span className="label">Consultation Fee</span>
              <strong>₹{appointment.fees}</strong>
            </div>
            <div className="detail-meta-box">
              <span className="label">Clinic Location</span>
              <span>{appointment.clinic_address || "Sanjeevni Central Clinic"}</span>
            </div>
            <div className="detail-meta-box">
              <span className="label">Payment Status</span>
              <span>
                {isPaid
                  ? `Cleared via PhonePe UPI (${appointment.transaction_id || "VERIFIED"})`
                  : "Pending payment (PhonePe QR available)"}
              </span>
            </div>
            <div className="detail-meta-box">
              <span className="label">Patient Name</span>
              <strong>{appointment.patient_name}</strong>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-3 items-center justify-between no-print">
            <div className="flex flex-wrap gap-3">
              {appointment.has_prescription && (
                <Link
                  href={`/prescriptions/${appointment.id}`}
                  className="button button-primary"
                >
                  View Digital Prescription (Rx) ℞
                </Link>
              )}
              {appointment.status !== "cancelled" && (
                <Link
                  href={`/teleconsult/${appointment.id}`}
                  className="button button-primary bg-blue-700 hover:bg-blue-800"
                >
                  Enter Video Teleconsult Room 📹
                </Link>
              )}
              {!isPaid && appointment.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => setShowPhonePeModal(true)}
                  className="button button-primary bg-[#5f259f] hover:bg-[#4d1d82] text-white flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pay ₹{appointment.fees} via PhonePe QR ↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  generateIcsCalendar(
                    appointment.doctor_name,
                    appointment.category_name,
                    appointment.appointment_date,
                    appointment.appointment_time,
                    appointment.clinic_address
                  )
                }
                className="button button-quiet flex items-center gap-1.5"
              >
                <span>📅 Add to Google / Apple Calendar (.ics)</span>
              </button>
            </div>

            <div className="flex gap-2">
              <Link href="/doctors" className="button button-quiet">
                Book Another Visit
              </Link>
            </div>
          </div>

          {/* Automated Notification & WhatsApp Preview */}
          <div className="mt-8 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-emerald-900 font-bold flex items-center gap-1.5">
                <span>💬 Automated Patient WhatsApp &amp; SMS Dispatch</span>
              </strong>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Delivered
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-slate-800 font-mono text-[11px] leading-relaxed">
              &ldquo;Hello {appointment.patient_name || "Patient"}, your medical consultation with {appointment.doctor_name} ({appointment.category_name}) is confirmed for {appointment.appointment_date} at {appointment.appointment_time}. {isPaid ? "Payment of ₹" + appointment.fees + " has been received via PhonePe. Receipt: " + receiptData.receipt_number + "." : "Consultation fee: ₹" + appointment.fees + " via PhonePe QR."} Please arrive 10 minutes prior at {appointment.clinic_address || "chumantar gali jaipur"}. For assistance, call +91 9999-108-108.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* PhonePe Payment Modal */}
      <PhonePePaymentModal
        appointmentId={appointment.id}
        isOpen={showPhonePeModal}
        onClose={() => setShowPhonePeModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  );
}

export default function AppointmentDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card directory-state">Loading appointment...</div>
        </main>
      }
    >
      <AppointmentDetailContent />
    </Suspense>
  );
}
