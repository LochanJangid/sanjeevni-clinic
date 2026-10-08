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
  Boxes,
  Edit,
  X,
  UserCheck,
  Receipt
} from "lucide-react";
import { getAuthToken, parseTokenClaims } from "../../lib/auth";

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

interface PatientOption {
  id: number;
  username: string;
  email: string;
  mobile?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userRole, setUserRole] = useState("patient");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | "">("");

  // Doctor order notification
  const [doctorOrderSuccess, setDoctorOrderSuccess] = useState<string | null>(null);

  // Admin CRUD Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Add Medicine Form
  const [addName, setAddName] = useState("");
  const [addGeneric, setAddGeneric] = useState("");
  const [addCategory, setAddCategory] = useState("General");
  const [addForm, setAddForm] = useState("Tablet");
  const [addStrength, setAddStrength] = useState("500mg");
  const [addPrice, setAddPrice] = useState<number>(50);
  const [addStock, setAddStock] = useState<number>(100);
  const [addBatch, setAddBatch] = useState("BATCH-2026-A1");
  const [addExpiry, setAddExpiry] = useState("2026-12-31");
  const [addRx, setAddRx] = useState(true);

  // Edit Medicine Form
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editBatch, setEditBatch] = useState("");
  const [editExpiry, setEditExpiry] = useState("");

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
    const token = getAuthToken();
    if (token) {
      const claims = parseTokenClaims(token);
      if (claims?.role) setUserRole(claims.role);

      if (claims?.role === "doctor" || claims?.role === "admin") {
        fetch(`${API_URL}/clinical/patients-list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.patients && data.patients.length > 0) {
              setPatients(data.patients);
              setSelectedPatientId(data.patients[0].id);
            }
          })
          .catch(() => {});
      }
    }
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

  // Doctor Order On Behalf of Patient
  async function handleDoctorOrderSubmit() {
    if (cart.length === 0) {
      alert("Please add medicines to the cart.");
      return;
    }
    if (!selectedPatientId) {
      alert("Please select a patient to charge.");
      return;
    }

    setSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/pharmacy/doctor-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_id: Number(selectedPatientId),
          items: cart.map((c) => ({ medicine_id: c.medicine.id, quantity: c.quantity })),
          instructions: "Doctor clinical dispensation added to patient ledger",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const pt = patients.find((p) => p.id === Number(selectedPatientId));
        const ptName = pt ? pt.username : `Patient #${selectedPatientId}`;
        setDoctorOrderSuccess(`✓ Prescribed medicines dispensed for ${ptName}. ₹${data.total_amount} added directly to patient's bill.`);
        setCart([]);
        await loadMedicines();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to place doctor pharmacy order.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error placing pharmacy order.");
    } finally {
      setSubmitting(false);
    }
  }

  // Admin Add Medicine
  async function handleAddMedicine(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/pharmacy/medicines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: addName.trim(),
          generic_name: addGeneric.trim(),
          category: addCategory.trim(),
          dosage_form: addForm.trim(),
          strength: addStrength.trim(),
          price: Number(addPrice),
          stock_quantity: Number(addStock),
          batch_number: addBatch.trim(),
          expiry_date: addExpiry,
          prescription_required: addRx,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setAddName("");
        setAddGeneric("");
        await loadMedicines();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to add medicine.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error adding medicine.");
    } finally {
      setSubmitting(false);
    }
  }

  // Admin Edit Medicine
  async function handleEditMedicineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMedicine) return;
    setSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/pharmacy/medicines/${editingMedicine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          price: Number(editPrice),
          stock_quantity: Number(editStock),
          batch_number: editBatch,
          expiry_date: editExpiry,
        }),
      });

      if (res.ok) {
        setEditingMedicine(null);
        await loadMedicines();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to update medicine.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error updating medicine.");
    } finally {
      setSubmitting(false);
    }
  }

  // Admin Delete Medicine
  async function handleDeleteMedicine(medId: number, medName: string) {
    if (!confirm(`Are you sure you want to permanently delete "${medName}" from pharmacy stock?`)) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/pharmacy/medicines/${medId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        await loadMedicines();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete medicine.");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const isAdmin = userRole === "admin";
  const isDoctor = userRole === "doctor" || userRole === "admin";

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 inline-flex items-center gap-1.5">
                  <Pill className="w-3 h-3 text-[#0D9488]" />
                  SANJEEVNI CENTRAL PHARMACY
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#1E3A8A]" />
                  CDSCO &amp; WHO-GMP COMPLIANT
                </span>
                <span className="text-xs font-mono text-gray-400">
                  BATCH-VERIFIED EXPIRY TELEMETRY
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A]">
                {isAdmin ? "Admin Pharmacy Stock Management & Inventory Control" : "Hospital Formulary & Prescription Dispensing"}
              </h1>

              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                {isAdmin
                  ? "Administrator console: Add new medicines, modify batch numbers, update MRP prices, adjust inventory quantities, and manage stock replenishment."
                  : isDoctor
                  ? "Physician clinical dispensing: Prescribe medicines on behalf of patients. Fulfilled orders are automatically added to the patient's billing ledger."
                  : "Verified pharmaceutical inventory from accredited laboratories. Access genuine medicines with instant hospital billing and express clinic pickup."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>+ Add New Medicine to Stock</span>
                </button>
              )}

              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 flex items-center gap-2 text-xs font-medium text-[#4B5563]">
                <Package className="w-4 h-4 text-[#0D9488]" />
                <span>STOCK UNITS: <strong className="text-[#0D9488]">{medicines.reduce((s, m) => s + m.stock_quantity, 0)} Units</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Order Success Banner */}
        {doctorOrderSuccess && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#0D9488] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
              <span>{doctorOrderSuccess}</span>
            </div>
            <button onClick={() => setDoctorOrderSuccess(null)} className="p-1 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Doctor Clinical Ordering Dock */}
        {isDoctor && (
          <div className="bg-slate-50 border-2 border-teal-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-[#0D9488] border border-teal-300 inline-block">
                  DOCTOR CLINICAL DISPENSING DOCK
                </span>
                <h3 className="text-lg font-bold text-[#1E3A8A] mt-1">
                  Order Pharmacy on Behalf of Patient (Auto-Added to Patient Bill)
                </h3>
              </div>

              {/* Patient Selector */}
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient to Charge:
                </label>
                {patients.length > 0 ? (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                    className="p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[#1E3A8A] focus:outline-none focus:border-[#0D9488]"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.username} ({p.email}) - ID #{p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="Enter Patient User ID"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                    className="p-2 rounded-xl border border-slate-300 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Cart Preview for Doctor */}
            {cart.length > 0 ? (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="text-xs font-bold text-[#1E3A8A] flex items-center justify-between">
                  <span>Prescription Cart ({cart.length} items):</span>
                  <span className="text-sm font-mono text-[#0D9488]">Total Billed: ₹{totalAmount}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cart.map((item) => (
                    <div
                      key={item.medicine.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-gray-200 text-xs flex items-center gap-2"
                    >
                      <span className="font-semibold text-gray-800">{item.medicine.name}</span>
                      <span className="text-gray-500 font-mono">({item.medicine.strength}) x {item.quantity}</span>
                      <span className="font-bold text-[#0D9488]">₹{item.medicine.price * item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.medicine.id, -1)}
                        className="text-gray-400 hover:text-rose-600 p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.medicine.id, 1)}
                        className="text-gray-400 hover:text-teal-600 p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleDoctorOrderSubmit}
                    className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Receipt className="w-4 h-4 text-white" />
                    <span>{submitting ? "Adding to Bill…" : `Order & Add ₹${totalAmount} to Patient Bill`}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Add medicines from the inventory list below into the order dock.
              </p>
            )}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine by brand or generic name..."
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
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Antibiotic">Antibiotics</option>
              <option value="Antidiabetic">Antidiabetics</option>
              <option value="Analgesic">Analgesics &amp; Pain</option>
              <option value="Respiratory">Respiratory</option>
            </select>
          </div>
        </div>

        {/* Admin CRUD Table View */}
        {isAdmin ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#1E3A8A] text-lg">Hospital Pharmacy Stock Ledger</h3>
                <p className="text-xs text-gray-500">Live inventory tracking with direct price and stock update capabilities.</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#0D9488] bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                {medicines.length} Formulations Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-gray-500 uppercase border-b border-gray-200 text-[11px]">
                    <th className="py-3 px-4">Medicine &amp; Generic</th>
                    <th className="py-3 px-4">Class &amp; Form</th>
                    <th className="py-3 px-4">Strength</th>
                    <th className="py-3 px-4">Price (MRP)</th>
                    <th className="py-3 px-4">Stock Qty</th>
                    <th className="py-3 px-4">Batch &amp; Expiry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {medicines.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-sans">
                        <strong className="text-[#1E3A8A] block font-bold text-xs">{med.name}</strong>
                        <span className="text-[11px] text-gray-400 font-normal">{med.generic_name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] text-[10px] font-bold">
                          {med.category}
                        </span>
                        <span className="text-gray-400 block text-[11px] mt-0.5">{med.dosage_form}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-semibold">{med.strength}</td>
                      <td className="py-3.5 px-4 font-bold text-[#0D9488] text-sm">₹{med.price}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            med.stock_quantity < 20
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-teal-50 text-[#0D9488] border border-teal-200"
                          }`}
                        >
                          {med.stock_quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        <span className="block text-gray-700 font-bold">{med.batch_number}</span>
                        <span className="text-[10px] text-gray-400">Exp: {med.expiry_date}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMedicine(med);
                            setEditPrice(med.price);
                            setEditStock(med.stock_quantity);
                            setEditBatch(med.batch_number);
                            setEditExpiry(med.expiry_date);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1E3A8A] font-semibold text-xs inline-flex items-center gap-1 transition"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#0D9488]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMedicine(med.id, med.name)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs inline-flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid for Clinicians & Patients */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((med) => (
              <div
                key={med.id}
                className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
                      {med.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0D9488]">
                      {med.stock_quantity > 0 ? "IN STOCK" : "OUT OF STOCK"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#1E3A8A]">{med.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{med.generic_name}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Form &amp; Strength</span>
                      <strong className="text-gray-700">{med.dosage_form} · {med.strength}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Batch Number</span>
                      <strong className="text-gray-700 font-mono text-[11px]">{med.batch_number}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Formulary Price</span>
                      <span className="text-xl font-black text-[#0D9488] font-mono">₹{med.price}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">Exp: {med.expiry_date}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => addToCart(med)}
                    className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>{isDoctor ? "Prescribe & Add to Dock" : "Add to Cart"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Admin Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-[#1E3A8A] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] tracking-widest uppercase font-bold text-teal-200 block">
                ADMIN STOCK REPLENISHMENT
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">
                Add New Medicine Formulation to Stock
              </h2>
            </div>

            <form onSubmit={handleAddMedicine} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acetaminophen"
                    value={addGeneric}
                    onChange={(e) => setAddGeneric(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category:</label>
                  <input
                    type="text"
                    required
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage Form:</label>
                  <input
                    type="text"
                    required
                    placeholder="Tablet / Syrup / Injection"
                    value={addForm}
                    onChange={(e) => setAddForm(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Strength:</label>
                  <input
                    type="text"
                    required
                    placeholder="500mg"
                    value={addStrength}
                    onChange={(e) => setAddStrength(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addPrice}
                    onChange={(e) => setAddPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity:</label>
                  <input
                    type="number"
                    required
                    value={addStock}
                    onChange={(e) => setAddStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Number:</label>
                  <input
                    type="text"
                    required
                    value={addBatch}
                    onChange={(e) => setAddBatch(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date:</label>
                  <input
                    type="date"
                    required
                    value={addExpiry}
                    onChange={(e) => setAddExpiry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold transition shadow-sm"
                >
                  {submitting ? "Saving…" : "Save Medicine to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit Medicine Modal */}
      {editingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-[#1E3A8A] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setEditingMedicine(null)}
                className="absolute right-4 top-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] tracking-widest uppercase font-bold text-teal-200 block">
                UPDATE INVENTORY PARAMETERS
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">
                Edit {editingMedicine.name}
              </h2>
            </div>

            <form onSubmit={handleEditMedicineSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Price (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Quantity (Units):</label>
                <input
                  type="number"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Number:</label>
                <input
                  type="text"
                  required
                  value={editBatch}
                  onChange={(e) => setEditBatch(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expiry Date:</label>
                <input
                  type="date"
                  required
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMedicine(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold transition shadow-sm"
                >
                  {submitting ? "Updating…" : "Update Stock Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
