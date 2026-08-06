/**
 * Client-safe trigger for Checkout Session self-heal (TTL 120s Absolute Law).
 * Fire-and-forget — never blocks UI. Server persists before reporting success.
 */

"use client";

let inFlight: Promise<void> | null = null;
let lastRunMs = 0;
const MIN_INTERVAL_MS = 15_000;

export function triggerCheckoutSessionSelfHeal(reason: string): void {
  const now = Date.now();
  if (now - lastRunMs < MIN_INTERVAL_MS) return;
  if (inFlight) return;

  lastRunMs = now;
  inFlight = fetch("/api/checkout/expire-stale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  })
    .then(async (response) => {
      if (!response.ok) {
        console.info(`[RVX][INVENTORY] self-heal ${reason} http=${response.status}`);
      }
    })
    .catch(() => {
      // Fail closed — never break navigation.
    })
    .finally(() => {
      inFlight = null;
    });
}
