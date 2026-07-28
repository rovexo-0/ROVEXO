"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

/**
 * Next.js route error UI — Global Fail Closed Engine.
 * Never renders raw Error.message (secret / stack leak vector).
 */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="fail-closed-v1-shell" style={{ minHeight: "60vh", padding: 16 }}>
      <FailClosedPanel density="page" onRetry={() => reset()} />
    </main>
  );
}
