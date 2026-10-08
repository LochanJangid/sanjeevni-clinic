"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, QrCode, ShieldCheck, X } from "lucide-react";
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

  return (
    <main className="page-shell">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">HEALTHCARE FINANCIALS</p>
          <h1 className="page-title">Billing &amp; Medical Receipts</h1>
          <p className="section-copy">
            Unified billing records, PhonePe instant UPI settlement, GST invoices, and accounts analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/appointments" className="button button-quiet">
            My Appointments
          </Link>
          <Link href="/doctors" className="button button-primary">
            Book New Visit
          </Link>
        </div>
      </div>

      {loading && <div className="card directory-state">Loading billing records…</div>}
      {error && <div className="card directory-state directory-error">{error}</div>}

      {/* Admin Revenue Overview KPIs */}
      {userRole === "admin" && analytics && (
        <section className="mb-8 space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Hospital Accounts Overview</h2>
          <div className="stats-kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Gross Revenue Cleared</span>
              <span className="kpi-value text-emerald-800">
                ₹{analytics.summary.total_revenue.toLocaleString()}
              </span>
              <span className="text-xs text-muted mt-1">
                {analytics.summary.paid_invoices_count} Paid Invoices
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Pending Invoices</span>
              <span className="kpi-value text-amber-700">
                ₹{analytics.summary.pending_revenue.toLocaleString()}
              </span>
              <span className="text-xs text-muted mt-1">
                {analytics.summary.pending_invoices_count} Awaiting PhonePe settlement
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">PhonePe UPI Gateway</span>
              <span className="kpi-value text-purple-700">100% Direct</span>
              <span className="text-xs text-muted mt-1">Instant Doctor UPI Routing</span>
            </div>
          </div>

          {/* Department Breakdown */}
          {analytics.department_breakdown.length > 0 && (
            <div className="card mt-6">
              <h3 className="section-heading text-lg mb-4">Department Revenue Distribution</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted">
                      <th className="py-2">Specialty Department</th>
                      <th className="py-2 text-center">Consultations</th>
                      <th className="py-2 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.department_breakdown.map((dept, i) => (
                      <tr key={i}>
                        <td className="py-3 font-semibold">{dept.department}</td>
                        <td className="py-3 text-center">{dept.transaction_count}</td>
                        <td className="py-3 text-right font-bold text-emerald-800">
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
        <div className="card directory-state">
          <p>No billing records found for your account.</p>
          <Link href="/doctors" className="button button-primary mt-4">
            Consult a Doctor
          </Link>
        </div>
      ) : (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading text-lg">My Consultation Invoices &amp; Receipts</h2>
            <span className="text-xs text-muted">
              {bills.filter((b) => b.status === "paid").length} Cleared · {bills.filter((b) => b.status !== "paid").length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted">
                  <th className="py-3 px-3">Receipt / Invoice</th>
                  <th className="py-3 px-3">Visit Date</th>
                  <th className="py-3 px-3">Clinician</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Fee Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <strong className="font-mono text-xs">
                        SJ-REC-{bill.appointment_id.toString().padStart(5, "0")}
                      </strong>
                    </td>
                    <td className="py-3 px-3 text-xs">{bill.appointment_date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{bill.doctor_name}</td>
                    <td className="py-3 px-3">
                      <span className="badge-quiet text-xs">{bill.category_name}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{bill.amount}</td>
                    <td className="py-3 px-3 text-xs capitalize">
                      {bill.payment_method === "phonepe" ? "PhonePe UPI" : (bill.payment_method || "PhonePe")}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`status-pill ${
                          bill.status === "paid" ? "status-completed" : "status-pending"
                        }`}
                      >
                        {bill.status === "paid" ? "Paid ✓" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
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
                          className="button button-quiet text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPhonePeAppointmentId(bill.appointment_id)}
                          className="button button-primary text-xs py-1.5 px-3 bg-[#5f259f] hover:bg-[#4d1d82] text-white inline-flex items-center gap-1.5 shadow-sm"
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
        </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto no-print"
          onClick={() => setActiveReceipt(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 my-6"
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
    </main>
  );
}
