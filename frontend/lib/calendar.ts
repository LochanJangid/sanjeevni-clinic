export function generateIcsCalendar(
  doctorName: string,
  specialty: string,
  appointmentDate: string,
  appointmentTime: string,
  clinicAddress: string = "chumantar gali jaipur"
) {
  // Format date and time
  const [hours, minutes] = appointmentTime.split(":");
  const dt = new Date(appointmentDate);
  dt.setHours(parseInt(hours || "10", 10), parseInt(minutes || "00", 10), 0);

  const endDt = new Date(dt.getTime() + 30 * 60 * 1000); // 30 mins slot

  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  function formatIcsDate(d: Date) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sanjeevni Clinic//Appointment Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:sanjeevni-${Date.now()}@sanjeevni.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(dt)}`,
    `DTEND:${formatIcsDate(endDt)}`,
    `SUMMARY:Consultation with ${doctorName} (${specialty})`,
    `DESCRIPTION:Your scheduled clinical consultation at Sanjeevni Clinic with ${doctorName}. Please arrive 10 minutes early.`,
    `LOCATION:${clinicAddress}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Sanjeevni Clinic Doctor Appointment in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `sanjeevni-appointment-${appointmentDate}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
