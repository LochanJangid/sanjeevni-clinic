"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Heart, 
  CheckCircle2, 
  Plus 
} from "lucide-react";
import { getAuthToken } from "../../../lib/auth";

interface Doctor {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  fees: number;
  qualification: string;
  experience_years: number;
  about: string;
  clinic_address: string;
}

interface Review {
  id: number;
  rating: number;
  patient_name: string;
  comment: string;
  wait_time_rating: number;
  bedside_manner_rating: number;
  created_at: string;
}

interface ReviewData {
  reviews: Review[];
  total_reviews: number;
  average_rating: number;
  wait_time_avg: number;
  bedside_manner_avg: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function DoctorDetailContent() {
  const params = useParams<{ id: string }>();
  const doctorId = Number(params?.id);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review submission state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    async function fetchDoctorAndReviews() {
      if (!doctorId) {
        setLoading(false);
        setError("Doctor not found.");
        return;
      }

      try {
        const [docRes, revRes] = await Promise.all([
          fetch(`${API_URL}/doctors/get_doctor/${doctorId}`),
          fetch(`${API_URL}/clinical/reviews/doctor/${doctorId}`),
        ]);

        if (!docRes.ok) throw new Error("Doctor info unavailable");
        const docData = await docRes.json();
        setDoctor(docData);

        if (revRes.ok) {
          const revJson = await revRes.json();
          setReviewsData(revJson);
        }
      } catch {
        setError("Doctor info is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctorAndReviews();
  }, [doctorId]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !patientName.trim()) return;
    setSubmittingReview(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/clinical/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          rating,
          patient_name: patientName.trim(),
          comment: comment.trim(),
          wait_time_rating: 5,
          bedside_manner_rating: 5,
        }),
      });

      if (res.ok) {
        setReviewMsg("Review posted successfully! Thank you for your feedback.");
        setShowReviewForm(false);
        setComment("");
        setPatientName("");
        // Reload reviews
        const revRes = await fetch(`${API_URL}/clinical/reviews/doctor/${doctorId}`);
        if (revRes.ok) setReviewsData(await revRes.json());
      }
    } catch {
      setReviewMsg("Unable to post review at this time.");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="directory-state card" role="status">
          Loading specialist clinician profile…
        </div>
      </main>
    );
  }

  if (error || !doctor) {
    return (
      <main className="page-shell">
        <div className="directory-state card directory-error" role="alert">
          <h2>Doctor profile not found</h2>
          <p>{error || "Please return to the directory."}</p>
          <Link className="button button-quiet" href="/doctors">
            Back to doctors
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="doctor-detail-shell">
        <Link href="/doctors" className="back-link">
          ← Back to specialist directory
        </Link>

        <div className="doctor-profile-layout card">
          <div>
            <div className="doctor-detail-avatar" aria-hidden="true">
              {doctor.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("")}
            </div>
            <p className="eyebrow doctor-detail-eyebrow">
              {doctor.category_name} SPECIALIST
            </p>
            <h1 className="doctor-detail-name">{doctor.name}</h1>
            <p className="text-sm font-semibold text-emerald-800 mb-2">
              {doctor.qualification}
            </p>

            {/* Rating summary */}
            {reviewsData && reviewsData.total_reviews > 0 && (
              <div className="flex items-center gap-2 mb-4 text-xs">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(reviewsData.average_rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <strong className="text-slate-900 font-bold">
                  {reviewsData.average_rating} / 5.0
                </strong>
                <span className="text-muted">
                  ({reviewsData.total_reviews} verified reviews)
                </span>
              </div>
            )}

            <div className="doctor-detail-info">
              <p>
                <strong>Clinical Department</strong>
                <span>{doctor.category_name}</span>
              </p>
              <p>
                <strong>Experience</strong>
                <span>{doctor.experience_years} Years of Practice</span>
              </p>
              <p>
                <strong>Location &amp; Suite</strong>
                <span>{doctor.clinic_address}</span>
              </p>
              <p>
                <strong>Consultation Fee</strong>
                <span>₹{doctor.fees}</span>
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                About the Clinician
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {doctor.about || "Senior consultant medical specialist at Sanjeevni Clinic."}
              </p>
            </div>
          </div>

          <div className="doctor-detail-fee-panel">
            <p className="eyebrow">OUTPATIENT CONSULTATION</p>
            <p className="doctor-detail-price">₹{doctor.fees}</p>
            <p>Direct 30-minute consultation slot with digital prescription &amp; follow-up care.</p>

            <Link
              href={`/appointments/book?doctor_id=${doctor.id}`}
              className="button button-primary"
            >
              Choose Appointment Time →
            </Link>

            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted">
              ✓ Verified Sanjeevni Practitioner<br />
              ✓ Digital Rx &amp; Invoicing Included<br />
              ✓ Online or Front-desk Settlement
            </div>
          </div>
        </div>

        {/* VERIFIED PATIENT REVIEWS & RATINGS SECTION */}
        <div className="card p-8 bg-white border border-border shadow-sm mt-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Star className="w-5 h-5 fill-amber-400" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Patient Reviews &amp; Clinical Satisfaction
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                Verified feedback from patients after completed consultations with {doctor.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Write a Patient Review</span>
            </button>
          </div>

          {reviewMsg && (
            <div className="my-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {reviewMsg}
            </div>
          )}

          {/* Review Submission Form */}
          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="my-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Submit Consultation Feedback</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="E.g. Meenakshi S."
                    className="w-full text-xs p-2.5 bg-white border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                    Overall Experience Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-border rounded-lg"
                  >
                    <option value={5}>5 Stars - Excellent Medical Care</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Satisfactory</option>
                    <option value={2}>2 Stars - Needs Improvement</option>
                    <option value={1}>1 Star - Dissatisfied</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                  Your Review / Experience Comments
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share how the doctor helped you, their diagnosis, punctuality, and bedside manner..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-white border border-border rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-3 py-1.5 border border-border text-xs rounded-lg text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  {submittingReview ? "Submitting..." : "Post Review"}
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="mt-6 space-y-4">
            {!reviewsData || reviewsData.reviews.length === 0 ? (
              <p className="text-xs text-muted italic">
                No patient reviews yet for this clinician. Be the first to leave feedback!
              </p>
            ) : (
              reviewsData.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {rev.patient_name}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Consultation
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                  <span className="text-[10px] text-muted whitespace-nowrap">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DoctorDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="directory-state card">Loading doctor profile...</div>
        </main>
      }
    >
      <DoctorDetailContent />
    </Suspense>
  );
}
