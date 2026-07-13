import { levelLabel, progressToNextLevel, buildNextLevelRequirements } from "@/lib/seller-performance/levels";
import { SELLER_LEVEL_LABELS, type SellerLevel } from "@/lib/seller-performance/master-spec";
import { getSellerPerformanceScore } from "@/lib/seller-performance/service";

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
};

function buildProgressMessage(
  progressPercent: number,
  pointsToNext: number | null,
  nextLevelLabel: string | null,
): string {
  if (!nextLevelLabel) return "You have reached the highest seller level.";
  if (pointsToNext != null && pointsToNext > 0) {
    return `${pointsToNext} points to ${nextLevelLabel}`;
  }
  return `${progressPercent}% toward ${nextLevelLabel}`;
}

export async function fetchAccountSellerPerformanceSummary(
  userId: string,
): Promise<AccountSellerPerformanceSummary> {
  const scoreRow = await getSellerPerformanceScore(userId);
  const factors = scoreRow.factors;
  const progress = progressToNextLevel(scoreRow.score);

  if (factors) {
    progress.requirements = buildNextLevelRequirements(
      scoreRow.score,
      factors,
      scoreRow.componentScores,
    );
  }

  const nextLevelLabel = progress.nextLevel ? SELLER_LEVEL_LABELS[progress.nextLevel] : null;
  const altRequirement = progress.requirements.find((item) => item.kind !== "points");
  let progressMessage = buildProgressMessage(
    progress.percent,
    progress.pointsToNext,
    nextLevelLabel,
  );

  if (altRequirement && progress.pointsToNext != null && progress.pointsToNext > 0) {
    progressMessage = `${progress.pointsToNext} points or ${altRequirement.remaining} more ${altRequirement.label.toLowerCase()} to ${nextLevelLabel}`;
  }

  return {
    level: scoreRow.level,
    levelLabel: levelLabel(scoreRow.level),
    score: scoreRow.score,
    averageRating: factors?.reviews.averageRating ?? 0,
    reviewCount: factors?.reviews.reviewCount ?? 0,
    totalSales: factors?.completedOrders ?? 0,
    progressPercent: progress.percent,
    progressMessage,
    nextLevelLabel,
  };
}
