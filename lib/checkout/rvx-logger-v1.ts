/**
 * ROVEXO Blood XXIV — RVX Logger (Buy Now / Checkout Guard).
 * Root Cause Detection Mode — never hide financial failure cause in logs.
 */

export const RVX_LOG_PREFIX = "[RVX]" as const;

export type RvxLogPhase =
  | "BUY NOW STARTED"
  | "LISTING PASS"
  | "BUYER PASS"
  | "SELLER PASS"
  | "PRICE PASS"
  | "SHIPPING PASS"
  | "CURRENCY PASS"
  | "LOCK PASS"
  | "ORDER PASS"
  | "TRANSACTION PASS"
  | "PAYMENT SESSION PASS"
  | "FINANCIAL AUDIT PASS"
  | "IDEMPOTENCY PASS"
  | "ORDER FAILED"
  | "LISTING FAILED"
  | "BUYER FAILED"
  | "SELLER FAILED"
  | "PRICE FAILED"
  | "SHIPPING FAILED"
  | "CURRENCY FAILED"
  | "LOCK FAILED"
  | "TRANSACTION FAILED"
  | "PAYMENT SESSION FAILED"
  | "FINANCIAL AUDIT FAILED"
  | "IDEMPOTENCY FAILED"
  | "STOP"
  | "CHECKOUT BLOCKED"
  | "PAYMENT BLOCKED"
  | "FINISHED"
  | "SUCCESS"
  | "CHECKOUT ALLOWED";

/**
 * Structured Blood logger. Safe for client + server.
 * Never logs secrets, ENV names, stack traces, or payment payloads.
 * Client uses console.warn for failures — console.error triggers Next.js
 * development error overlays and blocks the real Buy Now UI.
 */
export function RVX_LOG(phase: RvxLogPhase, detail?: string): void {
  const line = detail
    ? `${RVX_LOG_PREFIX} ${phase} — ${detail}`
    : `${RVX_LOG_PREFIX} ${phase}`;
  if (phase.includes("FAILED") || phase === "STOP" || phase.includes("BLOCKED")) {
    if (typeof window !== "undefined") {
      console.warn(line);
    } else {
      console.error(line);
    }
    return;
  }
  console.info(line);
}

export function RVX_LOG_CODE(code: string): void {
  const line = `${RVX_LOG_PREFIX} ${code}`;
  if (typeof window !== "undefined") {
    console.warn(line);
    return;
  }
  console.error(line);
}
