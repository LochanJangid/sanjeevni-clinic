"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Building2, 
  Heart, 
  Mail, 
  MapPin, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  Clock,
  Tv,
  Bed,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { getStoredHospitalName } from "../lib/hospital";

export default function HospitalFooter() {
  const [hospitalName, setHospitalName] = useState("Sanjeevni");

  useEffect(() => {
    setHospitalName(getStoredHospitalName());
    const handleNameChange = (e: any) => {
      if (e.detail) setHospitalName(e.detail);
    };
    window.addEventListener("hospital-name-change", handleNameChange);
    return () => window.removeEventListener("hospital-name-change", handleNameChange);
  }, []);

  return (
    <footer className="mt-auto border-t border-gray-200 bg-slate-50 text-[#4B5563] text-xs no-print">
      {/* Main Hospital Information Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Hospital Brand & Accreditation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#1E3A8A] font-bold text-sm">
              <span className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-black text-sm shadow-sm">
                ✚
              </span>
              <div>
                <span className="block font-black tracking-tight text-[#1E3A8A]">{hospitalName.toUpperCase()}</span>
                <span className="block text-[10px] font-mono text-[#0D9488] font-bold">SUPER-SPECIALTY PAVILION</span>
              </div>
            </div>
            <p className="text-[#4B5563] text-xs leading-relaxed">
              Providing patient-centered clinical care, expert multi-specialty physician chambers, live OPD token queues, and 24x7 emergency trauma resuscitation.
            </p>
            <div className="text-[11px] font-mono text-gray-500 pt-1">
              Registration No: <strong className="text-gray-700">CEA-RJ-2024-8842</strong>
            </div>
          </div>

          {/* Col 2: Clinical Services & Departments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
              Specialized Departments
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition text-[#4B5563]">
                  Cardiology &amp; Vascular Sciences
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition text-[#4B5563]">
                  Dermatology &amp; Cosmetology
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition text-[#4B5563]">
                  General Medicine &amp; Diabetology
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition text-[#4B5563]">
                  Neurology &amp; Spine Care
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition text-[#4B5563]">
                  Pediatrics &amp; Child Health
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition text-[#4B5563]">
                  Orthopedics &amp; Joint Surgery
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Patient Care Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
              Patient Care Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/doctors" className="hover:text-[#0D9488] transition flex items-center gap-1.5 text-[#4B5563]">
                  <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Book Consultation</span>
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-[#0D9488] transition flex items-center gap-1.5 text-[#4B5563]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>AI Health Assistant</span>
                </Link>
              </li>
              <li>
                <Link href="/opd-queue" className="hover:text-[#0D9488] transition flex items-center gap-1.5 text-[#4B5563]">
                  <Tv className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>OPD Queue Waiting TV</span>
                </Link>
              </li>
              <li>
                <Link href="/beds" className="hover:text-[#0D9488] transition flex items-center gap-1.5 text-[#4B5563]">
                  <Bed className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Inpatient Bed Census</span>
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="hover:text-red-600 transition flex items-center gap-1.5 text-[#4B5563]">
                  <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                  <span>Emergency SOS Command</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Emergency Dispatch & Hospital Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
              Emergency Contact &amp; Hours
            </h4>
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-700 block tracking-wider">
                24x7 Ambulance &amp; Trauma
              </span>
              <a
                href="tel:+919999108108"
                className="text-base font-black text-red-800 hover:underline block font-mono"
              >
                +91 9999-108-108
              </a>
              <span className="text-[10px] text-red-600 block">Immediate Trauma Dispatch</span>
            </div>

            <div className="space-y-1 text-xs text-[#4B5563] pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                <span>chumantar gali jaipur</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                <span>OPD: 09:00 AM – 01:00 PM &amp; 05:00 PM – 08:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Copyright Bar & Lochan Jangid Attribution */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#4B5563] text-center sm:text-left">
          <div>
            <p>© {new Date().getFullYear()} {hospitalName}. All clinical rights reserved.</p>
            <p className="mt-1 text-xs">
              Created by{" "}
              <a
                href="https://lochan.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#1E3A8A] hover:text-[#0D9488] transition underline decoration-[#0D9488]/40 hover:decoration-[#0D9488]"
              >
                lochan jangid
              </a>
              {" "}·{" "}
              <a
                href="https://lochan.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0D9488] font-semibold hover:underline"
              >
                lochan.vercel.app
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[#1E3A8A] transition text-gray-500">
              Staff &amp; Patient Portal
            </Link>
            <span>•</span>
            <Link href="/registration" className="hover:text-[#1E3A8A] transition text-gray-500">
              Patient Registration
            </Link>
            <span>•</span>
            <Link href="/emergency" className="hover:text-red-600 transition text-gray-500">
              Emergency Bay
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
