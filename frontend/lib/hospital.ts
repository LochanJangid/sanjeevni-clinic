"use client";

export const DEFAULT_HOSPITAL_NAME = "Sanjeevni";
export const DEFAULT_HOSPITAL_CITY = "chumantar gali jaipur";
export const DEFAULT_HOSPITAL_ADDRESS = "chumantar gali jaipur";
export const DEFAULT_HOSPITAL_LOGO = "✚";

export interface HospitalBranding {
  name: string;
  city: string;
  address?: string;
  logo: string;
  logoType: "icon" | "image";
  regNumber: string;
}

export const LOGO_PRESETS = [
  { id: "cross", label: "Medical Cross", icon: "✚", type: "icon" as const },
  { id: "caduceus", label: "Caduceus Crest", icon: "⚕️", type: "icon" as const },
  { id: "heart", label: "Cardio Heart", icon: "❤️‍🩹", type: "icon" as const },
  { id: "hospital", label: "Pavilion Seal", icon: "🏥", type: "icon" as const },
  { id: "shield", label: "Care Shield", icon: "🛡️", type: "icon" as const },
];

export function getStoredHospitalName(): string {
  if (typeof window === "undefined") return DEFAULT_HOSPITAL_NAME;
  return localStorage.getItem("custom_hospital_name") || DEFAULT_HOSPITAL_NAME;
}

export function getStoredHospitalLogo(): string {
  if (typeof window === "undefined") return DEFAULT_HOSPITAL_LOGO;
  return localStorage.getItem("custom_hospital_logo") || DEFAULT_HOSPITAL_LOGO;
}

export function getStoredHospitalBranding(): HospitalBranding {
  if (typeof window === "undefined") {
    return {
      name: DEFAULT_HOSPITAL_NAME,
      city: DEFAULT_HOSPITAL_CITY,
      address: DEFAULT_HOSPITAL_ADDRESS,
      logo: DEFAULT_HOSPITAL_LOGO,
      logoType: "icon",
      regNumber: "CEA-RJ-2024-8842",
    };
  }

  const name = localStorage.getItem("custom_hospital_name") || DEFAULT_HOSPITAL_NAME;
  const logo = localStorage.getItem("custom_hospital_logo") || DEFAULT_HOSPITAL_LOGO;
  const logoType = (localStorage.getItem("custom_hospital_logo_type") as "icon" | "image") || "icon";
  const city = localStorage.getItem("custom_hospital_city") || DEFAULT_HOSPITAL_CITY;
  const address = localStorage.getItem("custom_hospital_address") || DEFAULT_HOSPITAL_ADDRESS;
  const regNumber = localStorage.getItem("custom_hospital_reg") || "CEA-RJ-2024-8842";

  return { name, city, address, logo, logoType, regNumber };
}

export function setStoredHospitalName(name: string): void {
  if (typeof window === "undefined") return;
  const cleanName = name.trim() || DEFAULT_HOSPITAL_NAME;
  localStorage.setItem("custom_hospital_name", cleanName);
  window.dispatchEvent(new CustomEvent("hospital-name-change", { detail: cleanName }));
  window.dispatchEvent(new CustomEvent("hospital-branding-change", { detail: getStoredHospitalBranding() }));
}

export function setStoredHospitalLogo(logo: string, logoType: "icon" | "image" = "icon"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("custom_hospital_logo", logo);
  localStorage.setItem("custom_hospital_logo_type", logoType);
  window.dispatchEvent(new CustomEvent("hospital-branding-change", { detail: getStoredHospitalBranding() }));
}

export function setHospitalBranding(brand: Partial<HospitalBranding>): void {
  if (typeof window === "undefined") return;
  if (brand.name) {
    localStorage.setItem("custom_hospital_name", brand.name.trim());
    window.dispatchEvent(new CustomEvent("hospital-name-change", { detail: brand.name.trim() }));
  }
  if (brand.logo) localStorage.setItem("custom_hospital_logo", brand.logo);
  if (brand.logoType) localStorage.setItem("custom_hospital_logo_type", brand.logoType);
  if (brand.city) localStorage.setItem("custom_hospital_city", brand.city);
  if (brand.regNumber) localStorage.setItem("custom_hospital_reg", brand.regNumber);

  window.dispatchEvent(new CustomEvent("hospital-branding-change", { detail: getStoredHospitalBranding() }));
}
