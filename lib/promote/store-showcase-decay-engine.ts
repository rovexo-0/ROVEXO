/**
 * ROVEXO STORE SHOWCASE — Decay Engine v1.0 (LOCK).
 *
 * Internal ranking weight only. Never sold as a position.
 * Day 7 → 10% boost · maximum row hint 20.
 * Day 8+ → expired · normal algorithm · no advantage · no penalty.
 */

import {
  STORE_SHOWCASE_DAY7_MAX_ROW,
  STORE_SHOWCASE_DURATION_DAYS,
} from "@/lib/promote/constants";

/** Boost % by campaign day (1-indexed). */
export const STORE_SHOWCASE_DECAY_BY_DAY: Readonly<Record<number, number>> = {
  1: 100,
  2: 85,
  3: 70,
  4: 55,
  5: 40,
  6: 25,
  7: 10,
} as const;

export type StoreShowcaseDecayState = {
  /** Campaign day (1–7 while active; ≥8 when expired). */
  day: number;
  /** Internal boost percent (0 when expired). Never shown to users. */
  boostPercent: number;
  /** True while within the 7-day window. */
  active: boolean;
  /** True from day 8 onward. */
  expired: boolean;
  /**
   * Day 7 only: soft maximum row hint (20).
   * Not a purchased slot — exposure weight only.
   */
  maxRow: number | null;
};

function msPerDay(): number {
  return 24 * 60 * 60 * 1000;
}

/**
 * 1-based campaign day from startsAt.
 * Day 1 = first 24h, Day 7 = days 6–7, Day 8+ = expired.
 */
export function resolveStoreShowcaseCampaignDay(
  startsAt: Date | string,
  now: Date = new Date(),
): number {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  if (Number.isNaN(start.getTime())) return STORE_SHOWCASE_DURATION_DAYS + 1;
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(elapsed / msPerDay()) + 1;
}

/**
 * Calculate Store Showcase decay (internal only).
 * Users never see these numbers.
 */
export function calculateStoreShowcaseDecay(
  startsAt: Date | string,
  now: Date = new Date(),
): StoreShowcaseDecayState {
  const day = resolveStoreShowcaseCampaignDay(startsAt, now);

  if (day > STORE_SHOWCASE_DURATION_DAYS) {
    return {
      day,
      boostPercent: 0,
      active: false,
      expired: true,
      maxRow: null,
    };
  }

  const boostPercent = STORE_SHOWCASE_DECAY_BY_DAY[day] ?? 0;
  return {
    day,
    boostPercent,
    active: true,
    expired: false,
    maxRow: day === STORE_SHOWCASE_DURATION_DAYS ? STORE_SHOWCASE_DAY7_MAX_ROW : null,
  };
}
