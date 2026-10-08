import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AppEnvironmentShell from "../components/AppEnvironmentShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lochan Jangid | Hospital & Medical Operating System",
    template: "%s | Hospital OS",
  },
  description: "Enterprise hospital operating system for patient care, doctor consultation, bed census, OPD TV queue, and PhonePe billing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <AppEnvironmentShell>{children}</AppEnvironmentShell>
        </Suspense>
      </body>
    </html>
  );
}
