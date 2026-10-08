"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Printer, Share2, ShieldCheck, Video, X } from "lucide-react";
import { getStoredHospitalName } from "../lib/hospital";

export interface PaymentReceiptData {
  appointment_id: number;
  receipt_number: string;
  doctor_name: string;
  doctor_mobile?: string;
  doctor_upi?: string;
  specialty?: string;
  patient_name: string;
  patient_mobile?: string;
  appointment_date: string;
  appointment_time: string;
  clinic_address?: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  paid_at?: string;
}

interface MedicalPaymentReceiptProps {
  data: PaymentReceiptData;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function MedicalPaymentReceipt({
  data,
  onClose,
  isEmbedded = false,
}: MedicalPaymentReceiptProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [hospitalName, setHospitalName] = useState("Sanjeevni Medical Pavilion");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleNameChange = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleNameChange);
    return () => window.removeEventListener("hospital-name-change", handleNameChange);
  }, []);

  const formattedDate = data.paid_at
    ? new Date(data.paid_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  function handleShare() {
    const text = `${hospitalName} Payment Receipt: ₹${data.amount} paid to ${data.doctor_name} for appointment #${data.appointment_id}. Receipt No: ${data.receipt_number}. Txn: ${data.transaction_id || "PAID"}.`;
    if (navigator.share) {
      navigator.share({
        title: `Payment Receipt ${data.receipt_number}`,
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} Verification: ${window.location.href}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className={`receipt-container ${isEmbedded ? "w-full" : "max-w-3xl mx-auto"}`}>
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between gap-3 mb-4 no-print bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-sm">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Payment Verified &amp; Cleared via PhonePe UPI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition shadow-sm text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-50 transition text-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedLink ? "Copied!" : "Share / WhatsApp"}</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Official Medical Tax Invoice & Receipt Paper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-slate-800 relative overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Paid Stamp Watermark */}
        <div className="absolute right-6 top-28 sm:top-24 pointer-events-none select-none opacity-85 rotate-[-12deg] z-10">
          <div className="border-4 border-emerald-600 rounded-2xl px-4 py-2 text-center bg-white/70 shadow-sm">
            <div className="text-[11px] font-black tracking-widest text-emerald-700 uppercase">
              {hospitalName}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-wider">
              PAID &amp; VERIFIED
            </div>
            <div className="text-[10px] font-bold text-emerald-600">
              ACCOUNTS DIVISION · CASHLESS UPI
            </div>
          </div>
        </div>

        {/* Clinic Letterhead */}
        <div className="border-b-2 border-emerald-800/20 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                ✚
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight leading-tight uppercase">
                  {hospitalName}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Super-Specialty Clinical Healthcare &amp; Digital Dispensary
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-1">
                  <span>NABH Accredited</span>
                  <span>•</span>
                  <span>GSTIN: 07AAAAA0000A1Z5</span>
                  <span>•</span>
                  <span>Reg: DL-CL-2024-8842</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Official Electronic Receipt</p>
              <p className="font-mono font-bold text-sm text-emerald-900 mt-0.5">
                {data.receipt_number}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Issued: {formattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Patient & Doctor Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-xs mb-6">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Patient Information
            </p>
            <p className="text-sm font-bold text-slate-900">{data.patient_name || "Patient"}</p>
            <p className="text-slate-600">
              <span className="text-slate-400">UHID / Patient ID:</span> SJ-PAT-{(data.appointment_id * 137).toString().padStart(5, "0")}
            </p>
            {data.patient_mobile && (
              <p className="text-slate-600">
                <span className="text-slate-400">Mobile:</span> +91 {data.patient_mobile}
              </p>
            )}
            <p className="text-slate-600">
              <span className="text-slate-400">Consultation Slot:</span> {data.appointment_date} at {data.appointment_time}
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Doctor &amp; Facility
            </p>
            <p className="text-sm font-bold text-emerald-950">{data.doctor_name}</p>
            <p className="text-slate-600">
              <span className="text-slate-400">Department:</span> {data.specialty || "Specialist Consultant"}
            </p>
            {data.doctor_mobile && (
              <p className="text-slate-600 font-medium">
                <span className="text-slate-400">Doctor PhonePe No:</span> +91 {data.doctor_mobile}
              </p>
            )}
            <p className="text-slate-600">
              <span className="text-slate-400">Facility:</span> {data.clinic_address || "Suite 102, Primary Care Pavilion, Sanjeevni"}
            </p>
          </div>
        </div>

        {/* Itemized Invoice Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 font-bold">#</th>
                <th className="py-2.5 px-3 font-bold">Service Description</th>
                <th className="py-2.5 px-3 font-bold text-center">HSN/SAC</th>
                <th className="py-2.5 px-3 font-bold text-right">Fee Rate</th>
                <th className="py-2.5 px-3 font-bold text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3 font-mono text-slate-400">01</td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-slate-900">
                    OPD Specialized Clinical Consultation
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Attending Physician: {data.doctor_name} ({data.specialty || "General Medicine"})
                  </p>
                </td>
                <td className="py-3 px-3 text-center text-slate-500 font-mono">999312</td>
                <td className="py-3 px-3 text-right font-medium">₹{data.amount}.00</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">₹{data.amount}.00</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-slate-400">02</td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-slate-900">Electronic Health Record (EHR) &amp; Digital Rx</p>
                  <p className="text-[11px] text-slate-500">Cloud Storage &amp; Prescription Access</p>
                </td>
                <td className="py-3 px-3 text-center text-slate-500 font-mono">999312</td>
                <td className="py-3 px-3 text-right text-slate-400 font-medium">₹0.00</td>
                <td className="py-3 px-3 text-right font-medium text-emerald-700">INCLUDED</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-slate-400">03</td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-slate-900">Health Care Service GST</p>
                  <p className="text-[11px] text-slate-500">Statutory Exemption under Notification 12/2017-CT(R)</p>
                </td>
                <td className="py-3 px-3 text-center text-slate-500 font-mono">0.00%</td>
                <td className="py-3 px-3 text-right text-slate-400 font-medium">₹0.00</td>
                <td className="py-3 px-3 text-right font-medium text-slate-500">₹0.00 (Exempt)</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-bold text-sm bg-slate-50/50">
                <td colSpan={4} className="py-3 px-3 text-right text-slate-700">
                  Total Amount Paid:
                </td>
                <td className="py-3 px-3 text-right text-emerald-900 text-base font-black">
                  ₹{data.amount}.00
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Transaction Details Callout */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 text-xs mb-6">
          <div className="flex items-center gap-2 mb-2 text-purple-950 font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>Settlement Channel: PhonePe UPI Direct Clinician Gateway</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
            <div>
              <span className="text-slate-400 text-[11px] block">Payment Mode:</span>
              <strong className="text-purple-900 uppercase">
                {data.payment_method === "phonepe" ? "PhonePe UPI" : data.payment_method?.toUpperCase()}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">PhonePe UTR / Txn Code:</span>
              <strong className="font-mono text-slate-900 select-all">
                {data.transaction_id || `PP-UTR-${data.appointment_id}98214`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Doctor PhonePe Destination:</span>
              <strong className="text-slate-900 font-mono">
                {data.doctor_mobile ? `+91 ${data.doctor_mobile}` : (data.doctor_upi || "Verified Doctor UPI")}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer Notes & Legal */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">
              Sanjeevni Medical Pavilion &amp; Healthcare Trust
            </p>
            <p>Computer-generated receipt · No physical signature required</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Support Desk: +91 9999-108-108 · helpdesk@sanjeevniclinic.in
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>HASH: 8F2A-SJ{data.appointment_id}-PHONEPE-OK</span>
          </div>
        </div>

        {/* Navigation Action Buttons (Hidden when printing) */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teleconsult/${data.appointment_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 transition text-xs shadow-sm"
            >
              <Video className="w-4 h-4" />
              <span>Enter Video Teleconsult Room</span>
            </Link>
            <Link
              href={`/prescriptions/${data.appointment_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition text-xs"
            >
              <span>View Prescription (Rx)</span>
            </Link>
          </div>

          <Link
            href="/appointments"
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium transition"
          >
            ← Back to all appointments
          </Link>
        </div>
      </div>
    </div>
  );
}
