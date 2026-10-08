"use client";

import { Suspense, useEffect, useState } from "react";
import SiteHeader from "../app/SiteHeader";
import HospitalFooter from "./HospitalFooter";
import AssistantWidget from "../app/AssistantWidget";

export default function AppEnvironmentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#4B5563] selection:bg-[#0D9488] selection:text-white">
      <Suspense fallback={<div className="site-header" aria-hidden="true" />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1 bg-white">{children}</main>
      <AssistantWidget />
      <HospitalFooter />
    </div>
  );
}
