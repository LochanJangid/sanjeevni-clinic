"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import {
  Check,
  Copy,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { getAuthToken, getAuthClaims } from "../lib/auth";
import MedicalPaymentReceipt, { PaymentReceiptData } from "./MedicalPaymentReceipt";

interface PhonePePaymentModalProps {
  appointmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (receiptData: PaymentReceiptData) => void;
}

interface PhonePeDetailsResponse {
  appointment_id: number;
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  doctor_mobile: string;
  doctor_upi: string;
  amount: number;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  clinic_address: string;
  upi_intent_uri: string;
  phonepe_intent_uri: string;
  payment_status: string;
  payment_method?: string;
  transaction_id?: string;
  paid_at?: string;
  receipt_number: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PhonePePaymentModal({
  appointmentId,
  isOpen,
  onClose,
  onPaymentSuccess,
}: PhonePePaymentModalProps) {
  const [details, setDetails] = useState<PhonePeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);
  const [patientSubmittedMsg, setPatientSubmittedMsg] = useState<string | null>(null);

  const claims = getAuthClaims();
  const isAdmin = claims?.role === "admin";

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let isMounted = true;
    async function fetchPhonePeDetails() {
      setLoading(true);
      setError("");
      const token = getAuthToken();

      try {
        const response = await fetch(`${API_URL}/billing/phonepe-details/${appointmentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error("Unable to fetch PhonePe details for this appointment.");
        }

        const data: PhonePeDetailsResponse = await response.json();
        if (isMounted) {
          setDetails(data);
          // If already paid, prepopulate receipt
          if (data.payment_status === "paid") {
            setReceiptData({
              appointment_id: data.appointment_id,
              receipt_number: data.receipt_number,
              doctor_name: data.doctor_name,
              doctor_mobile: data.doctor_mobile,
              doctor_upi: data.doctor_upi,
              specialty: data.specialty,
              patient_name: data.patient_name,
              appointment_date: data.appointment_date,
              appointment_time: data.appointment_time,
              clinic_address: data.clinic_address,
              amount: data.amount,
              payment_method: data.payment_method || "phonepe",
              transaction_id: data.transaction_id || `PP-${data.appointment_id}-PAID`,
              paid_at: data.paid_at,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load payment info.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPhonePeDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  function copyToClipboard(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleVerifyPayment(transactionCode?: string, methodOverride: string = "phonepe") {
    if (!details) return;
    setVerifying(true);
    setError("");

    const token = getAuthToken();
    const txnToSubmit =
      transactionCode ||
      utrNumber.trim() ||
      (methodOverride === "cash"
        ? `CASH-REC-${Math.floor(100000 + Math.random() * 900000)}`
        : `PP-UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`);

    try {
      const response = await fetch(`${API_URL}/billing/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appointment_id: details.appointment_id,
          amount: details.amount,
          payment_method: methodOverride,
          phone_number: "HospitalBillingDesk",
          transaction_id: txnToSubmit,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Payment verification failed.");
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti failures
      }

      const newReceipt: PaymentReceiptData = {
        appointment_id: details.appointment_id,
        receipt_number: result.receipt_number || details.receipt_number,
        doctor_name: details.doctor_name,
        doctor_mobile: details.doctor_mobile,
        doctor_upi: details.doctor_upi,
        specialty: details.specialty,
        patient_name: details.patient_name,
        appointment_date: details.appointment_date,
        appointment_time: details.appointment_time,
        clinic_address: details.clinic_address,
        amount: details.amount,
        payment_method: "phonepe",
        transaction_id: result.transaction_id || txnToSubmit,
        paid_at: result.paid_at || new Date().toISOString(),
      };

      setReceiptData(newReceipt);
      onPaymentSuccess?.(newReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing error.");
    } finally {
      setVerifying(false);
    }
  }

  function handleQuickDemoPay() {
    const demoUtr = `PP${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setUtrNumber(demoUtr);
    handleVerifyPayment(demoUtr);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto no-print"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* If receipt is issued, show the official receipt */}
        {receiptData ? (
          <div className="p-6 overflow-y-auto max-h-[90vh]">
            <MedicalPaymentReceipt
              data={receiptData}
              onClose={onClose}
              isEmbedded={true}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* PhonePe Branded Header Banner */}
            <div className="bg-gradient-to-r from-[#5f259f] via-[#6d2ca8] to-[#4c167d] p-6 text-white relative shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-white text-[#5f259f] flex items-center justify-center font-black text-lg shadow-md">
                  पे
                </span>
                <div>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-purple-200 block">
                    Hospital Billing Desk &amp; Payment Gateway
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">
                    Collect Consultation Fee &amp; Issue Receipt
                  </h2>
                </div>
              </div>

              <p className="text-xs text-purple-100 max-w-lg mt-1">
                Official hospital collection desk. Collect via PhonePe Merchant Dynamic QR, Reception Cash Counter, or POS Card with instant Payment Receipt generation.
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 overflow-y-auto">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Generating dynamic hospital payment gateway QR…</p>
              </div>
            ) : error && !details ? (
              <div className="p-8 text-center text-rose-600 overflow-y-auto">
                <p className="text-sm font-semibold mb-3">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : details ? (
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Hospital Recipient & Consultation Fee Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Hospital Accounts &amp; Merchant Gateway</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Attending Consultant: {details.doctor_name}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {details.specialty} · Appointment Ref #{details.appointment_id}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {/* Merchant VPA */}
                      <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-slate-700 text-[11px] shadow-xs">
                        <span className="text-slate-400">Admin UPI:</span>
                        <span className="font-semibold">{details.doctor_upi || "7240499165-2@ybl"}</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-slate-700 text-[11px] shadow-xs">
                        <span className="text-slate-400">Admin Phone:</span>
                        <span className="font-semibold">+91 7240499165</span>
                      </div>

                      {/* GST Exemption status tag */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        GST: 0% Exempt (Entry 74)
                      </span>
                    </div>
                  </div>

                  {/* Fee Amount Callout */}
                  <div className="text-left sm:text-right bg-white p-3 rounded-xl border border-purple-200/90 shadow-xs min-w-[140px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Consultation Fee
                    </span>
                    <span className="text-2xl font-black text-[#5f259f]">
                      ₹{details.amount}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                      ✓ Sent to Hospital Admin
                    </span>
                  </div>
                </div>

                {/* QR Code and Instructions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Left: Dynamic PhonePe QR Code */}
                  <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-purple-50/50 to-white rounded-2xl border-2 border-purple-200 text-center relative group">
                    <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                      <QRCodeSVG
                        value={details.upi_intent_uri || `upi://pay?pa=7240499165-2@ybl&pn=Sanjeevni+Hospital+Admin&am=${details.amount}&cu=INR`}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-950 font-bold">
                      <QrCode className="w-4 h-4 text-purple-700" />
                      <span>Admin PhonePe UPI QR (7240499165)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Pay to: 7240499165-2@ybl
                    </p>

                    {/* Mobile App Direct Links */}
                    <div className="mt-3 w-full flex flex-col gap-1.5">
                      <a
                        href={details.phonepe_intent_uri || `upi://pay?pa=7240499165-2@ybl&pn=Sanjeevni+Hospital+Admin&am=${details.amount}&cu=INR`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#5f259f] text-white font-semibold text-xs hover:bg-[#4d1d82] transition shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Open Directly in PhonePe App</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                      <a
                        href={details.upi_intent_uri || `upi://pay?pa=7240499165-2@ybl&pn=Sanjeevni+Hospital+Admin&am=${details.amount}&cu=INR`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition"
                      >
                        <span>Open Other UPI App (GPay / Paytm)</span>
                      </a>
                    </div>
                  </div>

                  {/* Right: Steps & UTR Verification */}
                  <div className="space-y-4">
                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                        How to complete payment:
                      </p>
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          1
                        </span>
                        <span>
                          Open <strong>PhonePe</strong>, <strong>Google Pay</strong>, or <strong>Paytm</strong> and scan the clean QR code above.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          2
                        </span>
                        <span>
                          Verify payment is addressed to <strong>Sanjeevni Hospital Admin (7240499165@upi)</strong> for <strong>₹{details.amount}</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          3
                        </span>
                        <span>
                          {isAdmin 
                            ? "As Hospital Admin, verify incoming funds in account 7240499165 and issue the official medical receipt below."
                            : "Enter the 12-digit UTR transaction ID below. Hospital Administration verifies all payments into 7240499165."}
                        </span>
                      </div>
                    </div>

                    {/* UTR Entry & Confirm Form */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          PhonePe UTR / 12-Digit Banking Transaction ID:
                        </label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 428901234567 or PP-TXN"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                        />
                      </div>

                      {patientSubmittedMsg && (
                        <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          {patientSubmittedMsg}
                        </p>
                      )}

                      {error && (
                        <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          {error}
                        </p>
                      )}

                      {isAdmin ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            disabled={verifying}
                            onClick={() => handleVerifyPayment()}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition shadow-sm disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {verifying ? "Confirming Admin Credit…" : "Admin: Confirm Payment (7240499165)"}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={verifying}
                            onClick={() => handleVerifyPayment(undefined, "cash")}
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                            title="Record Cash Collection at Reception Desk"
                          >
                            <span>💵 Collect Cash</span>
                          </button>

                          <button
                            type="button"
                            disabled={verifying}
                            onClick={handleQuickDemoPay}
                            className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition shadow-xs disabled:opacity-50"
                            title="Admin Quick Settlement"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                            <span>Settle</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            disabled={verifying || !utrNumber.trim()}
                            onClick={() => {
                              setPatientSubmittedMsg(`✓ Transaction Ref #${utrNumber.trim()} submitted to Administration. Admin Lochan (+91 7240499165) will verify receipt in 7240499165@upi.`);
                              handleVerifyPayment();
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition shadow-sm disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Submit UTR for Admin Verification</span>
                          </button>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                            <span>Payment confirmation is strictly verified by Hospital Administration (Admin Phone: 7240499165). Receipt unlocks upon admin verification.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
