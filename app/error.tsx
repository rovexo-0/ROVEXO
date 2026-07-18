"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-ds-4 px-ds-4 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
      <p className="w-full px-ds-4 text-sm text-text-secondary">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button variant="primary" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
