"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      try {
        // JWT payload is the middle part
        const payload = JSON.parse(
          atob(token.split(".")[1])
        );

        setUsername(payload.username);
      } catch {
        // Invalid token
        localStorage.removeItem("access_token");
        setUsername(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUsername(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">

      {/* Header */}
      <header className="flex w-full items-center justify-between px-6 py-5 sm:px-10">

        {/* Logo */}
        <Link href="/">
          <Image
            className="dark:invert h-5 w-[100px]"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
        </Link>

        {/* Authentication */}
        <div className="flex items-center gap-3">

          {username ? (
            <>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {username}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Login
              </Link>

              <Link
                href="/registration"
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Register
              </Link>
            </>
          )}

        </div>
      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center px-6">

        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">

          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
            Welcome to Sanjeevni Clinic
          </h1>

          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Your healthcare companion for a better and simpler experience.
          </p>

          {!username && (
            <div className="mt-4 flex gap-3">
              <Link
                href="/registration"
                className="flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Create account
              </Link>

              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Login
              </Link>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}