import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Page not found",
  description: "The page you are looking for does not exist or may have been removed.",
  path: "/",
  noIndex: true,
  omitCanonical: true,
});

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-ds-4 px-ds-4 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="w-full px-ds-4 text-sm text-text-secondary">
        The page you are looking for does not exist or may have been removed.
      </p>
      <Link href="/" className="text-sm font-semibold text-primary">
        Back to home
      </Link>
    </main>
  );
}
