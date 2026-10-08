"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { User, Mail, Phone, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

interface Profile {
  id: number;
  username: string;
  email: string | null;
  mobile: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ username: "", email: "", mobile: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        setError("Sign in to view and update your patient profile.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load your profile.");
        setProfile(data);
        setForm({
          username: data.username || "",
          email: data.email || "",
          mobile: data.mobile || "",
        });
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Your session has ended. Sign in again to update your profile.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          email: form.email || null,
          mobile: form.mobile || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not save your profile.");

      setProfile(data);
      setMessage("Your contact details have been successfully updated.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#4B5563] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200 mb-2 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            ACCOUNT SECURITY &amp; CREDENTIALS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] tracking-tight">
            Patient Profile &amp; Contact Records
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Keep the verified contact information and mobile linked to your Sanjeevni account up to date.
          </p>
        </div>

        {loading ? (
          <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent mb-2" />
            <p className="text-xs font-medium text-gray-400">Loading patient profile...</p>
          </div>
        ) : error && !profile ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-3 shadow-sm">
            <p className="text-sm text-[#4B5563]">{error}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs transition shadow-sm"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : profile ? (
          <form className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 space-y-6 shadow-sm" onSubmit={saveProfile}>
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-2xl shadow-sm">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1E3A8A]">{profile.username}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0D9488] border border-teal-200">
                    PATIENT ACCOUNT
                  </span>
                  <span className="text-xs font-mono text-gray-400">UHID-PAT-{profile.id}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                <span>{message}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] text-xs font-medium focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                    minLength={3}
                    maxLength={80}
                    autoComplete="username"
                    required
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] text-xs font-medium focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#1E3A8A] mb-1.5">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[#1E3A8A] text-xs font-medium focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={form.mobile}
                    onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                Data is encrypted and used strictly for appointments &amp; notifications.
              </span>
              <button
                className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : null}

      </div>
    </div>
  );
}
