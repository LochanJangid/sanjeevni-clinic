"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  FileText, 
  QrCode, 
  ShieldCheck, 
  X, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Building2, 
  Sparkles,
  ArrowRight,
  Receipt
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";
import PhonePePaymentModal from "../../components/PhonePePaymentModal";
import MedicalPaymentReceipt, { PaymentReceiptData } from "../../components/MedicalPaymentReceipt";

interface BillItem {
  id: number;
  appointment_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string;
  phone_number: string;
  created_at: string;
  paid_at: string;
  appointment_date: string;
  appointment_time: string;
  doctor_name: string;
  category_name: string;
}

interface AnalyticsData {
  summary: {
    total_revenue: number;
    pending_revenue: number;
    paid_invoices_count: number;
    pending_invoices_count: number;
  };
  department_breakdown: Array<{
    department: string;
    total_amount: number;
    transaction_count: number;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function BillingPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("patient");
  const [currentUsername, setCurrentUsername] = useState("Patient");

  // PhonePe Modal & Receipt States
  const [phonePeAppointmentId, setPhonePeAppointmentId] = useState<number | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceiptData | null>(null);

  async function loadData() {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const claims = parseTokenClaims(token);
    if (!claims?.sub) {
      setLoading(false);
      return;
    }

    setUserRole(claims.role || "patient");
    if (claims.username) setCurrentUsername(claims.username);

    try {
      if (claims.role === "admin") {
        const res = await fetch(`${API_URL}/billing/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      }

      // Fetch patient bills
      const billsRes = await fetch(`${API_URL}/billing/user/${claims.sub}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (billsRes.ok) {
        const data = await billsRes.json();
        setBills(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading financial records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handlePhonePeSuccess(receipt: PaymentReceiptData) {
    loadData();
    setActiveReceipt(receipt);
    setPhonePeAppointmentId(null);
  }

  const paidBillsCount = bills.filter((b) => b.status === "paid").length;
  const pendingBillsCount = bills.filter((b) => b.status !== "paid").length;
  const totalPaidSum = bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Financial Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Receipt className="w-3 h-3 text-[#0D9488]" />
                  FINANCIAL LEDGER
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#1E3A8A]" />
                  PHONEPE UPI &amp; GST COMPLIANT
                </span>
                <span className="text-xs font-mono text-gray-500 font-bold">
                  ADMIN DESK: 7240499165 (UPI: 7240499165-2@ybl)
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Receipt className="w-7 h-7" />
                </span>
                <span>Billing &amp; Medical Receipts</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Unified financial tracking: PhonePe QR instant UPI payments, downloadable digital GST tax receipts, and clinical accounts breakdown.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/appointments"
                className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 hover:border-gray-300 text-[#4B5563] hover:text-[#1E3A8A] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>My Appointments</span>
              </Link>
              <Link
                href="/doctors"
                className="px-4 py-2.5 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Book New Visit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mb-3" />
            <p className="text-sm font-medium text-gray-500">LOADING FINANCIAL RECORDS...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Admin Revenue Overview KPIs */}
        {userRole === "admin" && analytics && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 mb-1 inline-flex">
                  EXECUTIVE TELEMETRY
                </span>
                <h2 className="text-lg font-bold text-[#1E3A8A]">Hospital Accounts Overview</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#0D9488]/40 transition">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                  <span>GROSS REVENUE CLEARED</span>
                  <TrendingUp className="w-4 h-4 text-[#0D9488]" />
                </div>
                <div className="text-3xl font-extrabold text-[#0D9488] font-mono tracking-tight">
                  ₹{analytics.summary.total_revenue.toLocaleString()}
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  {analytics.summary.paid_invoices_count} Paid Invoices Settled
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                  <span>PENDING AR BALANCE</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
                  ₹{analytics.summary.pending_revenue.toLocaleString()}
                </div>
                <div className="mt-2 text-[11px] text-amber-600">
                  {analytics.summary.pending_invoices_count} Awaiting PhonePe settlement
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                  <span>UPI GATEWAY ROUTING</span>
                  <QrCode className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-extrabold text-[#1E3A8A] font-mono tracking-tight">
                  PhonePe UPI
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  100% Direct Clinician Payout Routing
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            {analytics.department_breakdown.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-base font-bold text-[#1E3A8A] mb-4">Specialty Department Revenue Distribution</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-mono">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                        <th className="py-2.5">Specialty Department</th>
                        <th className="py-2.5 text-center">Consultations</th>
                        <th className="py-2.5 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {analytics.department_breakdown.map((dept, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-semibold text-[#1E3A8A]">{dept.department}</td>
                          <td className="py-3 text-center text-[#4B5563]">{dept.transaction_count}</td>
                          <td className="py-3 text-right font-bold text-[#0D9488]">
                            ₹{dept.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Patient Invoices and PhonePe Pay Section */}
        {!loading && bills.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center space-y-4 shadow-sm">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-[#1E3A8A]">No Billing Records Found</h3>
            <p className="text-xs text-gray-500">You do not have any invoices or consult charges registered with this account.</p>
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm"
            >
              <span>Consult a Doctor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : !loading && (
          <section className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-1 inline-flex">
                  OFFICIAL INVOICES
                </span>
                <h2 className="text-lg font-bold text-[#1E3A8A]">
                  Consultation Invoices &amp; Digital Receipts
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-xl bg-teal-50 text-[#0D9488] border border-teal-200 font-semibold">
                  {paidBillsCount} Cleared (₹{totalPaidSum.toLocaleString()})
                </span>
                {pendingBillsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                    {pendingBillsCount} Pending
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="py-3 px-3">Receipt / Invoice #</th>
                    <th className="py-3 px-3">Visit Date</th>
                    <th className="py-3 px-3 font-sans">Clinician</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Fee Amount</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-3">
                        <strong className="text-[#1E3A8A] text-xs font-mono">
                          SJ-REC-{bill.appointment_id.toString().padStart(5, "0")}
                        </strong>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">{bill.appointment_date}</td>
                      <td className="py-3.5 px-3 font-bold text-[#1E3A8A]">{bill.doctor_name}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-gray-200 text-[#4B5563] text-[11px] font-medium">
                          {bill.category_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#1E3A8A] text-sm">₹{bill.amount}</td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {bill.payment_method === "phonepe" ? "PhonePe UPI" : (bill.payment_method || "PhonePe")}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === "paid"
                              ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {bill.status === "paid" ? "PAID ✓" : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {bill.status === "paid" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReceipt({
                                appointment_id: bill.appointment_id,
                                receipt_number: `SJ-REC-${bill.appointment_id.toString().padStart(5, "0")}`,
                                doctor_name: bill.doctor_name,
                                specialty: bill.category_name,
                                patient_name: currentUsername,
                                appointment_date: bill.appointment_date,
                                appointment_time: bill.appointment_time,
                                amount: bill.amount,
                                payment_method: bill.payment_method || "phonepe",
                                transaction_id: bill.transaction_id || `PP-TXN-SJ${bill.appointment_id}`,
                                paid_at: bill.paid_at,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0D9488] border border-teal-200 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPhonePeAppointmentId(bill.appointment_id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pay on PhonePe ↗</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PhonePe Payment Modal */}
        {phonePeAppointmentId !== null && (
          <PhonePePaymentModal
            appointmentId={phonePeAppointmentId}
            isOpen={true}
            onClose={() => setPhonePeAppointmentId(null)}
            onPaymentSuccess={handlePhonePeSuccess}
          />
        )}

        {/* Official Receipt Modal View */}
        {activeReceipt && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print"
            onClick={() => setActiveReceipt(null)}
          >
            <div
              className="relative w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-2xl p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto text-[#4B5563]"
              onClick={(e) => e.stopPropagation()}
            >
              <MedicalPaymentReceipt
                data={activeReceipt}
                onClose={() => setActiveReceipt(null)}
                isEmbedded={true}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
