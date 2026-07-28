/**
 * ROVEXO v1.0 — PROMOTIONS FINAL FREEZE
 * TIME DECAY + ANTI MONOPOLY + UK FIRST
 * CEO APPROVED · CANONICAL · LONG TERM
 *
 * Boost / Bump / Store Promotion change temporary ranking ONLY.
 * Never mutate: created_at, reviews, rating, followers, sold, ownership.
 */

export const PROMOTIONS_FINAL_FREEZE_NAME = "ROVEXO PROMOTIONS FINAL FREEZE" as const;
export const PROMOTIONS_FINAL_FREEZE_VERSION = "1.0" as const;
export const PROMOTIONS_FINAL_FREEZE_STATUS = "LOCKED — PRODUCTION READY" as const;
export const PROMOTIONS_TZ = "Europe/London" as const;

/** Owner priority scale is 0–100; stored DB score = priority × SCALE for ORDER BY headroom. */
export const PROMOTION_SCORE_SCALE = 1_000;
export const PROMOTION_PRIORITY_DAY1 = 100;

/** Post-expiry wait before a new paid window may start (Rule #5). */
export const PROMOTION_COOLDOWN_HOURS = 24;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PromotionDecayKind = "boost" | "bump" | "store";

function londonDateKey(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PROMOTIONS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Whole UK calendar days elapsed since start (0 = Day 1). */
export function ukCalendarDaysElapsed(
  startedAt: string | null | undefined,
  now: Date = new Date(),
): number {
  if (!startedAt) return 0;
  const startKey = londonDateKey(startedAt);
  const nowKey = londonDateKey(now);
  const startUtc = Date.parse(`${startKey}T00:00:00.000Z`);
  const nowUtc = Date.parse(`${nowKey}T00:00:00.000Z`);
  if (Number.isNaN(startUtc) || Number.isNaN(nowUtc)) return 0;
  return Math.max(0, Math.floor((nowUtc - startUtc) / MS_PER_DAY));
}

export function isWindowActive(
  until: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!until) return false;
  return new Date(until).getTime() > now.getTime();
}

export function windowDurationDays(
  startedAt: string | null | undefined,
  until: string | null | undefined,
): number {
  if (!startedAt || !until) return 7;
  const ms = new Date(until).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 7;
  return Math.max(1, Math.round(ms / MS_PER_DAY));
}

/**
 * Infer curve from product type + window length.
 * Bump ≤3d · Boost ~7–14d · Store ≥21d (showcase).
 */
export function resolvePromotionDecayKind(input: {
  type?: "bump" | "feature" | null;
  startedAt?: string | null;
  until?: string | null;
  durationHours?: number | null;
}): PromotionDecayKind {
  if (input.type === "feature") return "store";
  const hours =
    input.durationHours ??
    (input.startedAt && input.until
      ? (new Date(input.until).getTime() - new Date(input.startedAt).getTime()) / 3_600_000
      : null);
  if (hours != null && Number.isFinite(hours)) {
    if (hours <= 84) return "bump"; // ≤ 3.5 days
    if (hours >= 21 * 24) return "store";
  }
  return "boost";
}

/**
 * Owner priority curves (0–100), then expired → 0 (organic).
 * Boost 7d: 100,90,80,70,60,50,40
 * Bump 3d:  100,70,40
 * Store 30d: 100 → 1 linear across the window
 */
export function computeOwnerPriorityScore(input: {
  kind: PromotionDecayKind;
  startedAt?: string | null;
  until?: string | null;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  if (!isWindowActive(input.until, now)) return 0;

  const elapsed = ukCalendarDaysElapsed(input.startedAt, now);
  const durationDays = windowDurationDays(input.startedAt, input.until);

  if (input.kind === "bump") {
    return Math.max(0, PROMOTION_PRIORITY_DAY1 - elapsed * 30);
  }
  if (input.kind === "boost") {
    return Math.max(0, PROMOTION_PRIORITY_DAY1 - elapsed * 10);
  }
  // Store: Day 1 = 100 … Day N = 1
  if (durationDays <= 1) return PROMOTION_PRIORITY_DAY1;
  if (elapsed >= durationDays - 1) return 1;
  return Math.max(
    1,
    Math.round(PROMOTION_PRIORITY_DAY1 - (elapsed / (durationDays - 1)) * 99),
  );
}

export function toStoredPromotionScore(priority0to100: number): number {
  return Math.max(0, Math.round(priority0to100 * PROMOTION_SCORE_SCALE));
}

export type TimeDecayScoreInput = {
  bumpedUntil?: string | null;
  featuredUntil?: string | null;
  lastBumpedAt?: string | null;
  featuredStartedAt?: string | null;
  bumpDurationHours?: number | null;
  featureDurationHours?: number | null;
  now?: Date;
};

/** Stored promotion_score for DB ORDER BY (scaled Owner priority). */
export function computeTimeDecayPromotionScore(input: TimeDecayScoreInput): number {
  const now = input.now ?? new Date();
  let best = 0;

  if (isWindowActive(input.bumpedUntil, now)) {
    const kind = resolvePromotionDecayKind({
      type: "bump",
      startedAt: input.lastBumpedAt,
      until: input.bumpedUntil,
      durationHours: input.bumpDurationHours,
    });
    best = Math.max(
      best,
      computeOwnerPriorityScore({
        kind,
        startedAt: input.lastBumpedAt,
        until: input.bumpedUntil,
        now,
      }),
    );
  }

  if (isWindowActive(input.featuredUntil, now)) {
    best = Math.max(
      best,
      computeOwnerPriorityScore({
        kind: "store",
        startedAt: input.featuredStartedAt,
        until: input.featuredUntil,
        now,
      }),
    );
  }

  return toStoredPromotionScore(best);
}

/**
 * Anti-monopoly: one seller must not occupy top-5 when other promoted sellers exist.
 * Fair rotation among active paid promotions, then organic order preserved.
 */
export function applyAntiMonopolyRotation<
  T extends { sellerId?: string | null; promotionScore?: number | null },
>(items: readonly T[]): T[] {
  const promoted = items.filter((item) => (item.promotionScore ?? 0) > 0);
  const organic = items.filter((item) => (item.promotionScore ?? 0) <= 0);
  if (promoted.length <= 1) return [...items];

  const pool = [...promoted].sort(
    (a, b) => (b.promotionScore ?? 0) - (a.promotionScore ?? 0),
  );
  const placed: T[] = [];

  while (pool.length > 0) {
    const top5Sellers = new Set(
      placed
        .slice(0, 5)
        .map((item) => item.sellerId)
        .filter((id): id is string => Boolean(id)),
    );
    const otherSellersExist = pool.some(
      (item) => item.sellerId && !top5Sellers.has(item.sellerId),
    );

    let pickIndex = 0;
    if (placed.length < 5 && otherSellersExist) {
      const best = pool[0];
      if (best?.sellerId && top5Sellers.has(best.sellerId)) {
        const diverse = pool.findIndex(
          (item) => item.sellerId && !top5Sellers.has(item.sellerId),
        );
        if (diverse >= 0) pickIndex = diverse;
      }
    }

    const [next] = pool.splice(pickIndex, 1);
    if (next) placed.push(next);
  }

  return [...placed, ...organic];
}

/** True when a new paid window is blocked (active or inside 24h cooldown). */
export function isPromotionPurchaseBlocked(input: {
  until: string | null | undefined;
  now?: Date;
  cooldownHours?: number;
}): { blocked: boolean; reason: "active" | "cooldown" | null; retryAt?: string } {
  const now = input.now ?? new Date();
  const cooldownHours = input.cooldownHours ?? PROMOTION_COOLDOWN_HOURS;
  if (!input.until) return { blocked: false, reason: null };

  const end = new Date(input.until);
  if (Number.isNaN(end.getTime())) return { blocked: false, reason: null };

  if (end.getTime() > now.getTime()) {
    return { blocked: true, reason: "active", retryAt: end.toISOString() };
  }

  const cooldownEnd = new Date(end.getTime() + cooldownHours * 3_600_000);
  if (cooldownEnd.getTime() > now.getTime()) {
    return { blocked: true, reason: "cooldown", retryAt: cooldownEnd.toISOString() };
  }

  return { blocked: false, reason: null };
}

export function promotionsFinalFreezeSnapshot() {
  return {
    name: PROMOTIONS_FINAL_FREEZE_NAME,
    version: PROMOTIONS_FINAL_FREEZE_VERSION,
    status: PROMOTIONS_FINAL_FREEZE_STATUS,
    timezone: PROMOTIONS_TZ,
    cooldownHours: PROMOTION_COOLDOWN_HOURS,
    curves: {
      boost7d: [100, 90, 80, 70, 60, 50, 40],
      bump3d: [100, 70, 40],
      store30d: "100 → 1 linear",
    },
    forbidden: [
      "permanent position #1",
      "stack while active",
      "boost mutating created_at",
      "seller monopoly of top 5",
    ] as const,
  } as const;
}

// Back-compat aliases used by earlier freeze module name.
export const BOOST_TIME_DECAY_NAME = PROMOTIONS_FINAL_FREEZE_NAME;
export const BOOST_TIME_DECAY_VERSION = PROMOTIONS_FINAL_FREEZE_VERSION;
export const BOOST_TIME_DECAY_STATUS = PROMOTIONS_FINAL_FREEZE_STATUS;
export const BOOST_TIME_DECAY_TZ = PROMOTIONS_TZ;
export const BOOST_SCORE_DAY1 = toStoredPromotionScore(PROMOTION_PRIORITY_DAY1);
export const FEATURE_SCORE_DAY1 = toStoredPromotionScore(PROMOTION_PRIORITY_DAY1);
export const boostTimeDecaySnapshot = promotionsFinalFreezeSnapshot;
