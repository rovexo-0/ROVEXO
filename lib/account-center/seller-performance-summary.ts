import { formatAccountSellerRatingDisplay } from "@/lib/account-center/format-seller-rating";
import { levelLabel, progressToNextLevel, buildNextLevelRequirements } from "@/lib/seller-performance/levels";
import { SELLER_LEVEL_LABELS, type SellerLevel } from "@/lib/seller-performance/master-spec";
import { getSellerPerformanceScore } from "@/lib/seller-performance/service";
import type { NextLevelRequirement } from "@/lib/seller-performance/types";

export type AccountSellerPerformanceSummary = {
  level: SellerLevel;
  levelLabel: string;
  score: number;
  averageRating: number;
  reviewCount: number;
  ratingDisplay: string;
  totalSales: number;
  progressPercent: number;
  progressMessage: string;
  nextLevelLabel: string | null;
};

const SELLER_LEVEL_NUMBERS: Record<SellerLevel, number> = {
  new_seller: 1,
  trusted_seller: 2,
  top_seller: 3,
  premium_seller: 4,
  elite_seller: 5,
};

function buildAccountProgressMessage(
  totalSales: number,
  nextLevel: SellerLevel | null,
  nextLevelLabel: string | null,
  pointsToNext: number | null,
  progressPercent: number,
  requirements: NextLevelRequirement[],
): string {
  if (totalSales === 0) {
    return "Start selling to build your reputation.";
  }

  if (!nextLevel || !nextLevelLabel) {
    return "You have reached the highest seller level.";
  }

  if (progressPercent >= 85) {
    return `Almost ${nextLevelLabel}.`;
  }

  const salesRequirement = requirements.find((item) => item.kind === "completed_orders");
  if (salesRequirement && salesRequirement.remaining > 0) {
    const noun = salesRequirement.remaining === 1 ? "sale" : "sales";
    const levelNumber = SELLER_LEVEL_NUMBERS[nextLevel];
    return `Only ${salesRequirement.remaining} ${noun} until Level ${levelNumber}`;
  }

  if (pointsToNext != null && pointsToNext > 0) {
    const noun = pointsToNext === 1 ? "point" : "points";
    return `Only ${pointsToNext} ${noun} until ${nextLevelLabel}`;
  }

  const alternateRequirement = requirements.find(
    (item) => item.kind !== "points" && item.remaining > 0,
  );
  if (alternateRequirement) {
    return `Only ${alternateRequirement.remaining} more ${alternateRequirement.label.toLowerCase()} until ${nextLevelLabel}`;
  }

  return `Progress toward ${nextLevelLabel}`;
}

export async function getSellerPerformanceSummary(
  userId: string,
): Promise<AccountSellerPerformanceSummary> {
  const scoreRow = await getSellerPerformanceScore(userId);
  const factors = scoreRow.factors;
  const totalSales = factors?.completedOrders ?? 0;
  const reviewCount = factors?.reviews.reviewCount ?? 0;
  const averageRating = factors?.reviews.averageRating ?? 0;
  const progress = progressToNextLevel(scoreRow.score);

  if (factors) {
    progress.requirements = buildNextLevelRequirements(
      scoreRow.score,
      factors,
      scoreRow.componentScores,
    );
  }

  const nextLevelLabel = progress.nextLevel ? SELLER_LEVEL_LABELS[progress.nextLevel] : null;
  const progressPercent = totalSales === 0 ? 0 : progress.percent;
  const progressMessage = buildAccountProgressMessage(
    totalSales,
    progress.nextLevel,
    nextLevelLabel,
    progress.pointsToNext,
    progressPercent,
    progress.requirements,
  );

  return {
    level: scoreRow.level,
    levelLabel: levelLabel(scoreRow.level),
    score: scoreRow.score,
    averageRating,
    reviewCount,
    ratingDisplay: formatAccountSellerRatingDisplay(averageRating, reviewCount),
    totalSales,
    progressPercent,
    progressMessage,
    nextLevelLabel,
  };
}

/** @deprecated Use getSellerPerformanceSummary */
export const fetchAccountSellerPerformanceSummary = getSellerPerformanceSummary;
