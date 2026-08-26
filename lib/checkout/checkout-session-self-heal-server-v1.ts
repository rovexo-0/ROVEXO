/**
 * Server-side Checkout Session self-heal (TTL 120s Absolute Law).
 * Commerce owners (orders / wallet / seller) still await the canonical engine.
 * Public listing HTML must not block TTFB on a full session sweep.
 * Never throws into the UI.
 */

import "server-only";

import { CHECKOUT_SESSION_ENGINE_selfHeal } from "@/lib/checkout/engines/checkout-session-engine-v1";

/** Public listing views: crawlers must not serialize expireAll on every GET. */
const NON_BLOCKING_SELF_HEAL_REASONS = new Set(["listing-view"]);

/** Align with client expire-stale min interval — one sweep per isolate window. */
const LISTING_SELF_HEAL_MIN_INTERVAL_MS = 15_000;

let listingHealInFlight: Promise<void> | null = null;
let listingHealLastStartedMs = 0;

async function runSelfHeal(reason: string): Promise<void> {
  try {
    const result = await CHECKOUT_SESSION_ENGINE_selfHeal();
    if (!result.ok) {
      console.error(
        `[RVX][INVENTORY] self-heal ${reason} failures=${result.failures} expired=${result.expired} restored=${result.restored}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "self-heal failed";
    console.error(`[RVX][INVENTORY] self-heal ${reason} error=${message}`);
  }
}

export async function awaitCheckoutSessionSelfHeal(reason: string): Promise<void> {
  if (NON_BLOCKING_SELF_HEAL_REASONS.has(reason)) {
    const now = Date.now();
    if (listingHealInFlight) {
      return;
    }
    if (now - listingHealLastStartedMs < LISTING_SELF_HEAL_MIN_INTERVAL_MS) {
      return;
    }
    listingHealLastStartedMs = now;
    listingHealInFlight = runSelfHeal(reason).finally(() => {
      listingHealInFlight = null;
    });
    return;
  }

  await runSelfHeal(reason);
}
