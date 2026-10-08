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
  ArrowRight,
  Package,
  Boxes
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

  const totalAmount = cart.reduce((sum, i) => sum + i.medicine.price * i.quantity, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
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
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Cockpit */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Pill className="w-3 h-3 text-[#0D9488]" />
                  IN-HOUSE DISPENSARY
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#1E3A8A]" />
                  BATCH-VERIFIED STOCKS
                </span>
                <span className="text-xs font-mono text-gray-400">
                  COLD-CHAIN MONITORED
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A] flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] shadow-sm">
                  <Pill className="w-7 h-7" />
                </span>
                <span>Sanjeevni Central Pharmacy &amp; Medicines</span>
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                Fulfill prescribed drugs, cardiovascular medications, dermatological topicals, pediatric syrups, and chronic health supplies directly from accredited hospital stocks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="px-5 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-sm flex items-center gap-2.5 transition self-start lg:self-auto"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              <span>Dispensary Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3.5">
            <Truck className="w-6 h-6 text-[#0D9488] shrink-0" />
            <div className="text-xs">
              <strong className="block text-[#1E3A8A] font-bold text-sm">Express 2-Hour Delivery</strong>
              <span className="text-gray-500">Or instant counter pickup at Clinic Lobby</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3.5">
            <ShieldCheck className="w-6 h-6 text-[#0D9488] shrink-0" />
            <div className="text-xs">
              <strong className="block text-[#1E3A8A] font-bold text-sm">Batch Verified &amp; Cold Chain</strong>
              <span className="text-gray-500">Stored under strict temperature monitoring</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3.5">
            <Clock className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="text-xs">
              <strong className="block text-[#1E3A8A] font-bold text-sm">Direct Rx Integration</strong>
              <span className="text-gray-500">1-click order from doctor prescriptions</span>
            </div>
          </div>
        </div>

        {/* Success Order Confirmation */}
        {orderSuccess && (
          <div className="bg-teal-50 p-6 rounded-3xl border border-teal-200 text-[#4B5563] space-y-2">
            <div className="flex items-center gap-2.5 text-[#0D9488] font-bold text-base">
              <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
              <span>Order Dispatched! Ref: {orderSuccess.order_id}</span>
            </div>
            <p className="text-xs text-[#4B5563]">
              Your medications have been routed to the Sanjeevni Central Dispensary for pharmacist verification. Expected dispatch: {orderSuccess.estimated_delivery}.
            </p>
            <div className="text-xs font-mono font-bold text-[#0D9488] pt-1">
              Total Amount: ₹{orderSuccess.total_amount} via {orderSuccess.payment_method.toUpperCase()}
            </div>
          </div>
        )}

        {/* Search and Filters Form */}
        <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine name (e.g. Telmisartan, Paracetamol, Doxycycline)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-[#1E3A8A] placeholder-gray-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-[#1E3A8A] focus:outline-none focus:border-[#0D9488]"
            >
              <option value="all">All Drug Classes</option>
              <option value="cardiology">Cardiology</option>
              <option value="dermatology">Dermatology</option>
              <option value="antibiotic">Antibiotics</option>
              <option value="diabetology">Diabetology</option>
              <option value="analgesic">Pain Relief &amp; Fever</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-semibold transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Medicines Catalog Grid */}
        {loading ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mb-3" />
            <p className="text-sm font-medium text-gray-500">QUERYING DISPENSARY INVENTORY...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center space-y-2 shadow-sm">
            <Pill className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-[#1E3A8A]">No Medicines Found</h3>
            <p className="text-xs text-gray-500">Try resetting search filters or keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {medicines.map((med) => (
              <div
                key={med.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#0D9488]/40 hover:shadow-md transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      {med.dosage_form} · {med.strength}
                    </span>
                    {med.prescription_required && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                        Rx Required
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-[#1E3A8A] leading-snug">
                    {med.name}
                  </h3>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    {med.generic_name}
                  </span>

                  <div className="mt-3 text-[11px] text-gray-500 space-y-1">
                    <div>Class: <span className="text-[#4B5563]">{med.category}</span></div>
                    <div>Batch: <span className="text-gray-400">{med.batch_number}</span></div>
                    <div>Stock: <span className="text-[#0D9488] font-semibold">{med.stock_quantity} units</span></div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-[#1E3A8A]">
                      ₹{med.price}
                    </span>
                    <span className="text-[10px] text-gray-400 block">MRP incl. taxes</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(med)}
                    className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center gap-1 transition shadow-sm"
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
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white p-6 sm:p-8 max-w-md w-full rounded-3xl shadow-2xl border border-gray-200 space-y-4 text-[#4B5563]">
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-1 inline-flex">
                    DISPENSARY CART
                  </span>
                  <h3 className="text-lg font-bold text-[#1E3A8A]">
                    Order Checkout
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Your cart is empty. Add medicines from the catalog.
                </div>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-2xl p-2 bg-slate-50">
                    {cart.map((item) => (
                      <div key={item.medicine.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                        <div>
                          <strong className="block text-[#1E3A8A] font-sans">{item.medicine.name}</strong>
                          <span className="text-gray-400 text-[11px]">₹{item.medicine.price} each</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.medicine.id, -1)}
                            className="w-6 h-6 bg-white hover:bg-slate-200 border border-gray-200 text-[#4B5563] rounded-lg flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span className="font-bold text-[#1E3A8A] w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.medicine.id, 1)}
                            className="w-6 h-6 bg-white hover:bg-slate-200 border border-gray-200 text-[#4B5563] rounded-lg flex items-center justify-center transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Total Charged:</span>
                    <span className="text-[#0D9488] text-lg">₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                      Delivery Address / Clinic Room
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] focus:outline-none focus:border-[#0D9488]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] focus:outline-none focus:border-[#0D9488]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 hover:text-[#1E3A8A] rounded-xl text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
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
    </div>
  );
}
