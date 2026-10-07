"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Popup = {
  type: "success" | "error";
  title: string;
  message: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setPopup(null);

    try {
      const response = await fetch(`${API_URL}/users/user_login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setPopup({
          type: "error",
          title: "Login failed",
          message:
            data.detail || "Something went wrong. Please try again.",
        });

        return;
      }

      if (!data.auth_success) {
        setPopup({
          type: "error",
          title: "Login failed",
          message: data.msg || "Invalid username or password.",
        });

        return;
      }

      // Save JWT access token
      localStorage.setItem("access_token", data.access_token);
      window.dispatchEvent(new Event("sanjeevni-session-change"));

      setPopup({
        type: "success",
        title: "Login successful",
        message: `Welcome back, ${data.user.username}!`,
      });

      setForm({
        username: "",
        password: "",
      });

      // Go to home page
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 700);

    } catch {
      setPopup({
        type: "error",
        title: "Connection error",
        message: "Unable to connect to the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setPopup(null);
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">YOUR PATIENT SPACE</p>
          <h1>Care details, a little easier to keep track of.</h1>
          <p>Sign in to review appointments and keep your patient contact information current.</p>
          <div className="auth-intro-note"><span aria-hidden="true">+</span> A simple place for your clinic visits</div>
        </section>

      <div className="auth-card">

        {/* Header */}
        <div className="auth-card-header">
          <h2>Welcome back</h2>

          <p>Sign in to your Sanjeevni Clinic account.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="field-label"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              className="field-input"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="field-label"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="field-input"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="button button-primary auth-submit"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
        <p className="auth-switch">New to the clinic? <Link href="/registration">Create a patient account</Link></p>
      </div>
      </div>

      {/* Popup */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation">
          <div className="auth-popup" role="dialog" aria-modal="true" aria-labelledby="login-popup-title">

            {/* Icon */}
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                popup.type === "success"
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {popup.type === "success" ? (
                <svg
                  className="h-7 w-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-7 w-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            {/* Title */}
            <h2 id="login-popup-title" className="mt-5 text-center text-xl font-semibold text-gray-900">
              {popup.title}
            </h2>

            {/* Message */}
            <p className="mt-3 text-center text-sm leading-6 text-gray-600">
              {popup.message}
            </p>

            {/* Close */}
            <button
              onClick={closePopup}
              className={`mt-6 w-full rounded-lg px-4 py-3 font-medium text-white transition ${
                popup.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {popup.type === "success" ? "Continue" : "Close"}
            </button>

          </div>
        </div>
      )}
    </main>
  );
}