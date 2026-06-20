import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-ds-4 px-ds-4 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="max-w-md text-sm text-text-secondary">
        The page you are looking for does not exist or may have been removed.
      </p>
      <Link href="/" className="text-sm font-semibold text-primary">
        Back to home
      </Link>
    </main>
  );
}
