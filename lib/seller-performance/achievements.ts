import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementId,
} from "@/lib/seller-performance/master-spec";
import { levelForScore } from "@/lib/seller-performance/levels";
import type { SellerPerformanceFactors } from "@/lib/seller-performance/types";

const TRENDING_SALES_THRESHOLD = 5;
const TRENDING_WINDOW_DAYS = 30;

function countPositiveReviews(factors: SellerPerformanceFactors): number {
  const { stars } = factors.reviews;
  return stars.five + stars.four;
}

export function deriveAchievements(
  score: number,
  factors: SellerPerformanceFactors,
): AchievementId[] {
  const earned = new Set<AchievementId>();

  if (factors.completedOrders >= 1) earned.add("first_sale");
  if (factors.completedOrders >= 10) earned.add("orders_10");
  if (factors.completedOrders >= 50) earned.add("orders_50");
  if (factors.completedOrders >= 100) earned.add("orders_100");
  if (factors.completedOrders >= 500) earned.add("orders_500");
  if (factors.completedOrders >= 1000) earned.add("orders_1000");

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
  if (countPositiveReviews(factors) >= 100) earned.add("reviews_100_positive");
  if (factors.storeActivity.recentSales >= TRENDING_SALES_THRESHOLD) {
    earned.add("trending_seller");
  }

  const level = levelForScore(score);
  if (
    level === "trusted_seller" ||
    level === "top_seller" ||
    level === "premium_seller" ||
    level === "elite_seller"
  ) {
    earned.add("trusted_seller");
  }
  if (level === "top_seller" || level === "premium_seller" || level === "elite_seller") {
    earned.add("top_seller");
  }
  if (level === "premium_seller" || level === "elite_seller") earned.add("premium_seller");
  if (level === "elite_seller") earned.add("elite_seller");

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

export function achievementCatalog(earned: AchievementId[]): Array<{
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
    earnedAt: null,
  }));
}

export { TRENDING_SALES_THRESHOLD, TRENDING_WINDOW_DAYS };
