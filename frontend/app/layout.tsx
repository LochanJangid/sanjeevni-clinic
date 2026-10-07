import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from "./SiteHeader";
import AssistantWidget from "./AssistantWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sanjeevni Clinic | Care made clear",
    template: "%s | Sanjeevni Clinic",
  },
  description: "Find a doctor, book a visit, and keep your appointments organized with Sanjeevni Clinic.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="site-header" aria-hidden="true" />}>
          <SiteHeader />
        </Suspense>
        {children}
        <AssistantWidget />
        <footer className="site-footer">
          <div className="site-footer-inner">
            <Link className="footer-brand" href="/">
              <span className="brand-mark" aria-hidden="true">+</span>
              <span>Sanjeevni Clinic</span>
            </Link>
            <p>Simple, considered care—starting with your next visit.</p>
            <div className="footer-links">
              <Link href="/doctors">Find a doctor</Link>
              <Link href="/appointments">Appointments</Link>
              <Link href="/profile">Patient profile</Link>
            </div>
            <p className="footer-note">
              For urgent medical concerns, contact local emergency services or visit an emergency department.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
