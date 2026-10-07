import { Suspense } from "react";
import BookAppointmentForm from "./BookAppointmentForm";

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookAppointmentForm />
    </Suspense>
  );
}

function BookingLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Loading appointment...</p>
    </main>
  );
}