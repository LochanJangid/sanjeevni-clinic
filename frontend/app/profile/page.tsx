"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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
      setMessage("Your contact details have been saved.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1 className="page-title">Patient profile</h1>
      <p className="page-lead">Keep the contact information linked to your account up to date.</p>

      {loading ? (
        <div className="profile-card card profile-loading">Loading your patient profile…</div>
      ) : error && !profile ? (
        <div className="profile-card card profile-auth-message" role="alert">
          <h2 className="section-heading">Sign in to continue</h2>
          <p>{error}</p>
          <Link href="/login" className="button button-primary">Go to sign in</Link>
        </div>
      ) : profile ? (
        <form className="profile-card card" onSubmit={saveProfile}>
          <div className="profile-card-heading">
            <div className="profile-large-avatar" aria-hidden="true">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="section-heading">{profile.username}</h2>
              <p>Patient account · ID {profile.id}</p>
            </div>
          </div>

          {error && <p className="form-feedback error-feedback" role="alert">{error}</p>}
          {message && <p className="form-feedback success-feedback" role="status">{message}</p>}

          <div className="profile-fields">
            <label>
              <span className="field-label">Username</span>
              <input
                className="field-input"
                minLength={3}
                maxLength={80}
                autoComplete="username"
                required
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
              />
            </label>
            <label>
              <span className="field-label">Email address <span className="optional-label">Optional</span></span>
              <input
                className="field-input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label>
              <span className="field-label">Mobile number <span className="optional-label">Optional</span></span>
              <input
                className="field-input"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={form.mobile}
                onChange={(event) => setForm({ ...form, mobile: event.target.value })}
              />
            </label>
          </div>

          <div className="profile-card-footer">
            <p>We only use the contact information you provide to identify your account.</p>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
