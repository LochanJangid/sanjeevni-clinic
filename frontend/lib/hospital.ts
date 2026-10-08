"use client";

export const DEFAULT_HOSPITAL_NAME = "Sanjeevni Medical Pavilion";

export function getStoredHospitalName(): string {
  if (typeof window === "undefined") return DEFAULT_HOSPITAL_NAME;
  return localStorage.getItem("custom_hospital_name") || DEFAULT_HOSPITAL_NAME;
}

export function setStoredHospitalName(name: string): void {
  if (typeof window === "undefined") return;
  const cleanName = name.trim() || DEFAULT_HOSPITAL_NAME;
  localStorage.setItem("custom_hospital_name", cleanName);
  window.dispatchEvent(new CustomEvent("hospital-name-change", { detail: cleanName }));
}
