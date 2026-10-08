import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from "./SiteHeader";
import AssistantWidget from "./AssistantWidget";
import HospitalFooter from "../components/HospitalFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sanjeevni Hospital OS | Enterprise Healthcare Solution",
    template: "%s | Hospital OS",
  },
  description: "Enterprise hospital operating system for patient care, doctor consultation, bed census, OPD TV queue, and PhonePe billing.",
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
        <HospitalFooter />
      </body>
    </html>
  );
}
