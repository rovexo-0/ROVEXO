/**
 * ROVEXO STORE SHOWCASE — Anti-Abuse Engine v1.0 (LOCK).
 *
 * Forbidden:
 * - Stacking 7+7+7
 * - Multiple active Store Showcase
 * - Double boosting
 * - Manual positioning
 *
 * After expiration: 24h waiting period before repurchase.
 */

import { STORE_SHOWCASE_REPURCHASE_WAIT_HOURS } from "@/lib/promote/constants";

export type StoreShowcaseAntiAbuseInput = {
  /** Any currently active Store Showcase for this seller. */
  hasActiveStoreShowcase: boolean;
  /** Most recent expiration timestamp (ISO), if any. */
  lastExpiredAt?: string | null;
  now?: Date;
};

export type StoreShowcaseAntiAbuseResult = {
  allowed: boolean;
  reason:
    | "ok"
    | "active-showcase-forbidden"
    | "repurchase-wait"
    | "double-boost-forbidden";
  /** When repurchase becomes allowed (ISO), if waiting. */
  waitEndsAt: string | null;
  message: string;
};

function addHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Evaluate whether a new Store Showcase purchase is allowed.
 * Fail closed on active showcase or within the 24h wait.
 */
export function evaluateStoreShowcaseAntiAbuse(
  input: StoreShowcaseAntiAbuseInput,
): StoreShowcaseAntiAbuseResult {
  const now = input.now ?? new Date();

  if (input.hasActiveStoreShowcase) {
    return {
      allowed: false,
      reason: "active-showcase-forbidden",
      waitEndsAt: null,
      message: "Store Showcase is already active. Multiple active showcases are not allowed.",
    };
  }

  if (input.lastExpiredAt) {
    const expiredAt = new Date(input.lastExpiredAt);
    if (!Number.isNaN(expiredAt.getTime())) {
      const waitEnds = addHours(expiredAt, STORE_SHOWCASE_REPURCHASE_WAIT_HOURS);
      if (now.getTime() < waitEnds.getTime()) {
        return {
          allowed: false,
          reason: "repurchase-wait",
          waitEndsAt: waitEnds.toISOString(),
          message: "Store Showcase can be purchased again 24 hours after expiration.",
        };
      }
    }
  }

  return {
    allowed: true,
    reason: "ok",
    waitEndsAt: null,
    message: "Store Showcase purchase allowed.",
  };
}

/** Explicit double-boost guard (active + attempting another). */
export function assertNoDoubleStoreShowcaseBoost(hasActive: boolean): StoreShowcaseAntiAbuseResult {
  if (!hasActive) {
    return {
      allowed: true,
      reason: "ok",
      waitEndsAt: null,
      message: "No double boost.",
    };
  }
  return {
    allowed: false,
    reason: "double-boost-forbidden",
    waitEndsAt: null,
    message: "Double boosting Store Showcase is forbidden.",
  };
}
