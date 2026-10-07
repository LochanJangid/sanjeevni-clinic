"use client";

import { FormEvent, useState } from "react";
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
      setTimeout(() => {
        router.push("/");
      }, 1000);

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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Login to Sanjeevni Clinic
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
      </div>

      {/* Popup */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">

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
            <h2 className="mt-5 text-center text-xl font-semibold text-gray-900">
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