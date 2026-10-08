"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Pill, 
  Search, 
  Filter, 
  ShoppingCart, 
  CheckCircle2, 
  Truck, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  Minus, 
  Trash2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { getAuthToken } from "../../lib/auth";

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  dosage_form: string;
  strength: string;
  price: number;
  stock_quantity: number;
  batch_number: string;
  expiry_date: string;
  prescription_required: boolean;
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState("Flat 402, Green Avenue, Metro Sector 18");
  const [phone, setPhone] = useState("9876543210");
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadMedicines() {
    try {
      let url = `${API_URL}/clinical/pharmacy`;
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (search.trim()) params.append("search", search.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, [category]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadMedicines();
  }

  function addToCart(med: Medicine) {
    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === med.id);
      if (existing) {
        return prev.map((item) =>
          item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine: med, quantity: 1 }];
    });
  }

  function updateQuantity(medId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.medicine.price * item.quantity,
    0
  );

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/pharmacy/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart.map((i) => ({ medicine_id: i.medicine.id, quantity: i.quantity })),
          delivery_address: address,
          phone,
          payment_method: "upi",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderSuccess(data.order);
        setCart([]);
        setShowCheckout(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="portal-page-container">
      <div className="portal-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
              <Pill className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">IN-HOUSE DISPENSARY</span>
                <span className="text-xs text-muted">100% Genuine Clinical Stocks</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Sanjeevni Central Pharmacy &amp; Medicines
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCheckout(true)}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>View Dispensary Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Fulfill prescribed drugs, cardiovascular medications, dermatological topicals, pediatric syrups, and general health supplies directly from the accredited clinic inventory.
        </p>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="card p-4 bg-white border border-border flex items-center gap-3">
          <Truck className="w-5 h-5 text-teal-700" />
          <div className="text-xs">
            <strong className="block text-foreground font-bold">Express 2-Hour Delivery</strong>
            <span className="text-muted">Or instant counter pickup at Clinic Lobby</span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-border flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-700" />
          <div className="text-xs">
            <strong className="block text-foreground font-bold">Batch Verified &amp; Cold Chain</strong>
            <span className="text-muted">Stored under strict temperature monitoring</span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-border flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-700" />
          <div className="text-xs">
            <strong className="block text-foreground font-bold">Direct Rx Integration</strong>
            <span className="text-muted">1-click order from doctor prescriptions</span>
          </div>
        </div>
      </div>

      {/* Success Order Confirmation */}
      {orderSuccess && (
        <div className="card p-6 bg-emerald-50 border border-emerald-300 shadow-md my-6">
          <div className="flex items-center gap-3 text-emerald-900 font-bold text-base mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>Order Confirmed! Ref: {orderSuccess.order_id}</span>
          </div>
          <p className="text-xs text-emerald-800 mb-3">
            Your medications have been sent to the Sanjeevni Central Dispensary for pharmacist verification. Expected dispatch: {orderSuccess.estimated_delivery}.
          </p>
          <div className="text-xs font-semibold text-emerald-950">
            Total Charged: ₹{orderSuccess.total_amount} via {orderSuccess.payment_method.toUpperCase()}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3 my-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine name (e.g. Telmisartan, Paracetamol, Doxycycline)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="all">All Drug Classes</option>
            <option value="cardiology">Cardiology</option>
            <option value="dermatology">Dermatology</option>
            <option value="antibiotic">Antibiotics</option>
            <option value="diabetology">Diabetology</option>
            <option value="analgesic">Pain Relief &amp; Fever</option>
          </select>
          <button type="submit" className="button button-quiet text-xs">
            Search
          </button>
        </div>
      </form>

      {/* Medicines Catalog Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mb-2" />
          <p className="text-sm">Querying dispensary inventory...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="card p-10 text-center bg-white border border-dashed border-slate-300">
          <Pill className="w-10 h-10 text-muted mx-auto mb-2 opacity-60" />
          <h3 className="font-semibold text-sm">No medicines found matching criteria</h3>
          <p className="text-xs text-muted mt-1">Try resetting search filters or keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="card p-5 bg-white border border-border hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {med.dosage_form} · {med.strength}
                  </span>
                  {med.prescription_required && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Rx
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-foreground leading-snug">
                  {med.name}
                </h3>
                <span className="text-xs text-muted block mt-0.5">
                  {med.generic_name}
                </span>

                <div className="mt-3 text-[11px] text-muted space-y-1">
                  <div>Category: <span className="text-slate-700 font-medium">{med.category}</span></div>
                  <div>Batch: <span className="font-mono text-slate-600">{med.batch_number}</span></div>
                  <div>In Stock: <span className="text-emerald-700 font-semibold">{med.stock_quantity} units</span></div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-foreground">
                    ₹{med.price}
                  </span>
                  <span className="text-[10px] text-muted block">MRP incl. taxes</span>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(med)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 bg-white max-w-md w-full rounded-2xl shadow-2xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Dispensary Order Checkout
            </h3>
            <p className="text-xs text-muted mb-4">
              Review medicines and provide dispatch address.
            </p>

            {cart.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                Your cart is empty. Add medicines from the catalog.
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border rounded-lg p-2 bg-slate-50">
                  {cart.map((item) => (
                    <div key={item.medicine.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <strong className="block text-slate-800">{item.medicine.name}</strong>
                        <span className="text-muted text-[11px]">₹{item.medicine.price} each</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicine.id, -1)}
                          className="w-5 h-5 bg-white border rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicine.id, 1)}
                          className="w-5 h-5 bg-white border rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-teal-800 text-base">₹{totalAmount.toFixed(2)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Delivery Address / Clinic Room
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-lg"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="px-4 py-2 border border-border text-muted hover:text-foreground text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    {submitting ? "Placing Order..." : `Confirm & Pay ₹${totalAmount.toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
