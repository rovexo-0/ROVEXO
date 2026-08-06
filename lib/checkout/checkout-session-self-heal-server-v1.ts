/**
 * Server-side Checkout Session self-heal (TTL 120s Absolute Law).
 * Safe to await on page load — never throws into the UI.
 */

import "server-only";

import { CHECKOUT_SESSION_ENGINE_selfHeal } from "@/lib/checkout/engines/checkout-session-engine-v1";

export async function awaitCheckoutSessionSelfHeal(reason: string): Promise<void> {
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
