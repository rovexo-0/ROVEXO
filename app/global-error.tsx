"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

/**
 * Root layout crash surface — must still render HTML shell.
 * Never exposes digest, message, or stack.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
          <FailClosedPanel density="page" onRetry={() => reset()} />
        </main>
      </body>
    </html>
  );
}
