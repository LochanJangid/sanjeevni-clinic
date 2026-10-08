"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SellingHeader from "./SellingHeader";
import SellingFooter from "./SellingFooter";
import SiteHeader from "../app/SiteHeader";
import HospitalFooter from "./HospitalFooter";
import AssistantWidget from "../app/AssistantWidget";

export default function AppEnvironmentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Isolate Selling Environment (Commercial Presentation & Licensing by Lochan Jangid)
  // vs Hospital System Environment (White-labeled Clinical Operating System)
  const isSellingEnvironment =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/hospital-plans";

  return (
    <>
      {isSellingEnvironment ? (
        /* ==============================================================
           1. SELLING SYSTEM ENVIRONMENT:
           - Pure commercial sales & product showcase by Lochan Jangid
           - 10 core hospital features explained with photos & specs
           - Dedicated SellingHeader with "Launch Live Demo" CTA
           - Dedicated SellingFooter with developer credentials & licensing
           - Connected to the hospital system ONLY via "Launch Live Demo"
           - Zero hospital patient/staff navigation
           - No hospital assistant widget
           ============================================================== */
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
          <SellingHeader />
          <main className="flex-1">{children}</main>
          <SellingFooter />
        </div>
      ) : (
        /* ==============================================================
           2. HOSPITAL OPERATING SYSTEM ENVIRONMENT:
           - Completely white-labeled for the hospital owner's facility
           - Dynamic hospital brand across headers, receipts & queues
           - Hospital navigation (Doctors, Appointments, Beds, OPD TV, ERP)
           - Medical AI assistant widget for patient triage
           - NOTHING at the top or within navigation about selling software
           - Developer Lochan Jangid is credited ONLY at the very bottom
             in HospitalFooter, alongside a link to return to the sales site.
           ============================================================== */
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
          <Suspense fallback={<div className="site-header" aria-hidden="true" />}>
            <SiteHeader />
          </Suspense>
          <main className="flex-1">{children}</main>
          <AssistantWidget />
          <HospitalFooter />
        </div>
      )}
    </>
  );
}
