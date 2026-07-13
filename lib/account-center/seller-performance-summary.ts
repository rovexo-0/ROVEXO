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
  totalSales: number;
  progressPercent: number;
  progressMessage: string;
  nextLevelLabel: string | null;
  isNewSeller: boolean;
};

function buildAccountProgressMessage(
  totalSales: number,
  nextLevelLabel: string | null,
  pointsToNext: number | null,
  requirements: NextLevelRequirement[],
): string {
  if (totalSales === 0) {
    return "Start selling to build your reputation.";
  }

  if (!nextLevelLabel) {
    return "You have reached the highest seller level.";
  }

  const salesRequirement = requirements.find((item) => item.kind === "completed_orders");
  if (salesRequirement && salesRequirement.remaining > 0) {
    const noun = salesRequirement.remaining === 1 ? "sale" : "sales";
    return `Only ${salesRequirement.remaining} ${noun} until ${nextLevelLabel}`;
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

export async function fetchAccountSellerPerformanceSummary(
  userId: string,
): Promise<AccountSellerPerformanceSummary> {
  const scoreRow = await getSellerPerformanceScore(userId);
  const factors = scoreRow.factors;
  const totalSales = factors?.completedOrders ?? 0;
  const reviewCount = factors?.reviews.reviewCount ?? 0;
  const progress = progressToNextLevel(scoreRow.score);

  if (factors) {
    progress.requirements = buildNextLevelRequirements(
      scoreRow.score,
      factors,
      scoreRow.componentScores,
    );
  }

  const nextLevelLabel = progress.nextLevel ? SELLER_LEVEL_LABELS[progress.nextLevel] : null;
  const progressMessage = buildAccountProgressMessage(
    totalSales,
    nextLevelLabel,
    progress.pointsToNext,
    progress.requirements,
  );
  const progressPercent = totalSales === 0 ? 0 : progress.percent;

  return {
    level: scoreRow.level,
    levelLabel: levelLabel(scoreRow.level),
    score: scoreRow.score,
    averageRating: factors?.reviews.averageRating ?? 0,
    reviewCount,
    totalSales,
    progressPercent,
    progressMessage,
    nextLevelLabel,
    isNewSeller: totalSales === 0 && reviewCount === 0,
  };
}
