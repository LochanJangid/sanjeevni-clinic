"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const navigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/doctors", label: "Find care" },
  { href: "/appointments", label: "Appointments" },
];

function getUsernameSnapshot() {
  const token = localStorage.getItem("access_token");
  if (!token) return "";

  try {
    const payload = token.split(".")[1];
    if (!payload) throw new Error("Invalid login token");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
    );
    return typeof decoded.username === "string" ? decoded.username : "";
  } catch {
    localStorage.removeItem("access_token");
    return "";
  }
}

function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("sanjeevni-session-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("sanjeevni-session-change", onChange);
  };
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const username = useSyncExternalStore(
    subscribeToSession,
    getUsernameSnapshot,
    () => "",
  );

  function signOut() {
    localStorage.removeItem("access_token");
    window.dispatchEvent(new Event("sanjeevni-session-change"));
    router.push("/");
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="Sanjeevni Clinic home">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>
            <span className="brand-name">Sanjeevni</span>
            <span className="brand-caption">CLINIC</span>
          </span>
        </Link>

        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {username ? (
            <>
              <Link className="profile-link" href="/profile">
                <span className="avatar" aria-hidden="true">
                  {username.charAt(0).toUpperCase()}
                </span>
                <span className="profile-name">{username}</span>
              </Link>
              <button className="button button-quiet header-signout" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="button button-quiet header-signin" href="/login">Sign in</Link>
              <Link className="button button-primary header-cta" href="/doctors">Find a doctor</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
