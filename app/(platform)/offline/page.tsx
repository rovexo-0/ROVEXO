import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-ds-4 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-ds-4 text-2xl font-bold">You are offline</h1>
      <p className="mt-ds-2 w-full px-ds-4 text-sm text-text-secondary">
        ROVEXO needs an internet connection for listings, checkout, and messages. Cached pages may still be
        available when you reconnect.
      </p>
      <Link
        href="/"
        className="mt-ds-6 rounded-lg bg-primary px-ds-4 py-ds-3 text-sm font-medium text-white"
      >
        Try again
      </Link>
    </main>
  );
}
