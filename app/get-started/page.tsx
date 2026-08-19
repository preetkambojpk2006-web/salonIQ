import Link from "next/link";

export default function GetStartedPage() {
  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
        <div className="stack-6 text-center">
          <div className="stack-4">
            <p className="text-eyebrow">SalonIQ OS</p>
            <h1 className="heading-page text-2xl desktop:text-3xl">
              Your salon, on autopilot
            </h1>
            <p className="text-body">
              Bookings, customers, payments aur daily reports — sab ek jagah.
              WhatsApp-first, India ke liye bana.
            </p>
          </div>
          <div className="stack-4">
            <Link href="/signup" className="btn-primary text-center">
              Start free
            </Link>
            <Link href="/login" className="btn-secondary text-center">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
