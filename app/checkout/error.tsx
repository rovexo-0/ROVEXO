"use client";

import { toBuyNowPublicMessage, RVX_UNCLASSIFIED } from "@/lib/checkout/buy-now-guard-v1";

/**
 * Checkout route error boundary — Absolute UX Law.
 * User sees only Sorry + Retry. Never RVX codes in the UI.
 */
export default function CheckoutError({ reset }: { error: Error; reset: () => void }) {
  const publicMessage = toBuyNowPublicMessage(RVX_UNCLASSIFIED);
  const lines = publicMessage.split("\n").filter(Boolean);

  return (
    <section
      style={{ padding: 16, textAlign: "center" }}
      data-blood-code-xxiv="1.0"
      data-buy-now-public-error="1"
      role="alert"
      aria-live="assertive"
    >
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{lines[0]}</p>
      {lines.slice(1).map((line) => (
        <p key={line} style={{ marginTop: 8 }}>
          {line}
        </p>
      ))}
      <button type="button" onClick={() => reset()} style={{ marginTop: 16, minHeight: 44, width: "100%" }}>
        OK
      </button>
    </section>
  );
}
