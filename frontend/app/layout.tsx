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
    default: "Sanjeevni Super-Specialty Clinic & Hospital System",
    template: "%s | Sanjeevni Clinic",
  },
  description: "Official clinical platform for Sanjeevni Clinic. Doctor appointments, live OPD queue, inpatient bed census, pathology laboratory, and digital prescriptions.",
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
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <AppEnvironmentShell>{children}</AppEnvironmentShell>
        </Suspense>
      </body>
    </html>
  );
}
