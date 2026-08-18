import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementId,
} from "@/lib/seller-performance/master-spec";
import { levelForScore } from "@/lib/seller-performance/levels";
import type { SellerPerformanceFactors } from "@/lib/seller-performance/types";

const TRENDING_SALES_THRESHOLD = 5;
const TRENDING_WINDOW_DAYS = 30;
const POSITIVE_REVIEWS_TARGET = 100;

const ORDER_MILESTONES = [
  { id: "first_sale" as const, target: 1 },
  { id: "orders_10" as const, target: 10 },
  { id: "orders_50" as const, target: 50 },
  { id: "orders_100" as const, target: 100 },
  { id: "orders_500" as const, target: 500 },
  { id: "orders_1000" as const, target: 1000 },
] as const;

function countPositiveReviews(factors: SellerPerformanceFactors): number {
  const { stars } = factors.reviews;
  return stars.five + stars.four;
}

export type AchievementProgressRow = {
  id: AchievementId;
  label: string;
  current: number;
  target: number;
  remaining: number;
};

/** Next countable milestone only — same thresholds as deriveAchievements. */
export function listCountableAchievementProgress(
  factors: SellerPerformanceFactors,
  earnedIds: readonly AchievementId[],
): AchievementProgressRow[] {
  const earned = new Set(earnedIds);
  const rows: AchievementProgressRow[] = [];

  const nextOrder = ORDER_MILESTONES.find(
    (milestone) => !earned.has(milestone.id) && factors.completedOrders < milestone.target,
  );
  if (nextOrder && factors.completedOrders > 0) {
    const definition = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === nextOrder.id);
    rows.push({
      id: nextOrder.id,
      label: definition?.label ?? nextOrder.id,
      current: factors.completedOrders,
      target: nextOrder.target,
      remaining: nextOrder.target - factors.completedOrders,
    });
  }

  const positiveReviews = countPositiveReviews(factors);
  if (!earned.has("reviews_100_positive") && positiveReviews > 0 && positiveReviews < POSITIVE_REVIEWS_TARGET) {
    const definition = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === "reviews_100_positive");
    rows.push({
      id: "reviews_100_positive",
      label: definition?.label ?? "100 Positive Reviews",
      current: positiveReviews,
      target: POSITIVE_REVIEWS_TARGET,
      remaining: POSITIVE_REVIEWS_TARGET - positiveReviews,
    });
  }

  return rows;
}

export function deriveAchievements(
  score: number,
  factors: SellerPerformanceFactors,
): AchievementId[] {
  const earned = new Set<AchievementId>();

  for (const milestone of ORDER_MILESTONES) {
    if (factors.completedOrders >= milestone.target) earned.add(milestone.id);
  }

  if (factors.identityVerified) earned.add("verified_seller");
  if (
    factors.responseRatePercent >= 90 &&
    factors.averageResponseTimeMinutes !== null &&
    factors.averageResponseTimeMinutes <= 240
  ) {
    earned.add("fast_responder");
  }
  if (
    factors.responseRatePercent >= 95 &&
    factors.averageResponseTimeMinutes !== null &&
    factors.averageResponseTimeMinutes <= 60
  ) {
    earned.add("excellent_response_time");
  }
  if (factors.averageDispatchTimeHours !== null && factors.averageDispatchTimeHours <= 24) {
    earned.add("fast_dispatch");
  }
  if (factors.reviews.averageRating >= 4.8 && factors.reviews.reviewCount >= 10) {
    earned.add("top_rated");
  }
  if (countPositiveReviews(factors) >= POSITIVE_REVIEWS_TARGET) earned.add("reviews_100_positive");
  if (factors.storeActivity.recentSales >= TRENDING_SALES_THRESHOLD) {
    earned.add("trending_seller");
  }

  const level = levelForScore(score);
  // Map Blood Code XLVI badges → legacy achievement ids (same reputation engine).
  if (
    level === "gold" ||
    level === "diamond" ||
    level === "platinum" ||
    level === "elite" ||
    level === "legend"
  ) {
    earned.add("trusted_seller");
  }
  if (level === "platinum" || level === "elite" || level === "legend") {
    earned.add("top_seller");
  }
  if (level === "elite" || level === "legend") earned.add("premium_seller");
  if (level === "legend") earned.add("elite_seller");

  return [...earned];
}

export function mergeAchievementsWithAdminOverrides(input: {
  derived: AchievementId[];
  granted: AchievementId[];
  revoked: AchievementId[];
}): AchievementId[] {
  const set = new Set(input.derived);
  for (const badge of input.granted) set.add(badge);
  for (const badge of input.revoked) set.delete(badge);
  return [...set];
}

export function achievementCatalog(
  earned: AchievementId[],
  earnedAtById: Partial<Record<AchievementId, string | null>> = {},
): Array<{
  id: AchievementId;
  label: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}> {
  const earnedSet = new Set(earned);
  return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    earned: earnedSet.has(definition.id),
    earnedAt: earnedSet.has(definition.id) ? (earnedAtById[definition.id] ?? null) : null,
  }));
}

export { TRENDING_SALES_THRESHOLD, TRENDING_WINDOW_DAYS };

