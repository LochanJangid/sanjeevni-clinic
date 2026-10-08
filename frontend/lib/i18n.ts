export type Language = "en" | "hi";

export const translations = {
  en: {
    brand: "Sanjeevni",
    tagline: "Super-Specialty Clinic & Hospital OS",
    findCare: "Find Care",
    appointments: "Appointments",
    symptomChecker: "AI Triage",
    labReports: "Lab Reports",
    vitals: "Vitals",
    beds: "Hospital Beds",
    pharmacy: "Pharmacy",
    opdQueue: "OPD Queue",
    vaccines: "Vaccinations",
    emergency: "Emergency SOS",
    records: "Health Records",
    billing: "Billing",
    admin: "Admin",
    doctorPortal: "Doctor Portal",
    myDashboard: "Patient Dashboard",
    login: "Log in",
    logout: "Log out",
    quickRole: "Switch Demo Role",
    bookNow: "Book Consultation",
    emergencyCall: "Emergency: +91 9999-108-108",
    selectRole: "Quick Test Access",
    patient: "Patient",
    doctor: "Doctor",
    adminRole: "Admin",
  },
  hi: {
    brand: "संजीवनी",
    tagline: "सुपर-स्पेशियलिटी क्लिनिक एवं अस्पताल OS",
    findCare: "डॉक्टर खोजें",
    appointments: "अपॉइंटमेंट्स",
    symptomChecker: "एआई लक्षण जांच",
    labReports: "लैब रिपोर्ट्स",
    vitals: "स्वास्थ्य वाइटल्स",
    beds: "अस्पताल बेड",
    pharmacy: "दवाखाना",
    opdQueue: "ओपीडी कतार",
    vaccines: "टीकाकरण",
    emergency: "आपातकालीन SOS",
    records: "स्वास्थ्य रिकॉर्ड",
    billing: "बिलिंग",
    admin: "प्रशासन",
    doctorPortal: "डॉक्टर पोर्टल",
    myDashboard: "मरीज डैशबोर्ड",
    login: "लॉग इन",
    logout: "लॉग आउट",
    quickRole: "डेमो रोल बदलें",
    bookNow: "परामर्श बुक करें",
    emergencyCall: "आपातकालीन: +91 9999-108-108",
    selectRole: "त्वरित परीक्षण",
    patient: "मरीज",
    doctor: "डॉक्टर",
    adminRole: "एडमिन",
  },
};

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("sanjeevni_lang") as Language) || "en";
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sanjeevni_lang", lang);
  window.dispatchEvent(new Event("sanjeevni-lang-change"));
}
