import {
  SELLER_LEVEL_LABELS,
  SELLER_LEVEL_THRESHOLDS,
  SELLER_PERFORMANCE_WEIGHTS,
  type SellerLevel,
} from "@/lib/seller-performance/master-spec";
import { clampSellerScore } from "@/lib/seller-performance/scoring";
import type {
  ComponentScores,
  NextLevelRequirement,
  SellerPerformanceFactors,
  SellerPerformanceProgress,
} from "@/lib/seller-performance/types";

export function levelForScore(score: number): SellerLevel {
  const normalized = clampSellerScore(score);
  for (const entry of SELLER_LEVEL_THRESHOLDS) {
    if (normalized >= entry.min) return entry.level;
  }
  return "new_seller";
}

export function nextLevelForScore(score: number): SellerLevel | null {
  const current = levelForScore(score);
  const currentIndex = SELLER_LEVEL_THRESHOLDS.findIndex((entry) => entry.level === current);
  if (currentIndex <= 0) return null;
  return SELLER_LEVEL_THRESHOLDS[currentIndex - 1]?.level ?? null;
}

export function minScoreForLevel(level: SellerLevel): number {
  return SELLER_LEVEL_THRESHOLDS.find((entry) => entry.level === level)?.min ?? 0;
}

export function progressToNextLevel(score: number): SellerPerformanceProgress {
  const currentLevel = levelForScore(score);
  const nextLevel = nextLevelForScore(score);

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      percent: 100,
      pointsToNext: null,
      requirements: [],
    };
  }

  const currentMin = minScoreForLevel(currentLevel);
  const nextMin = minScoreForLevel(nextLevel);
  const span = nextMin - currentMin;
  const percent = span > 0 ? clampSellerScore(((score - currentMin) / span) * 100) : 100;

  return {
    currentLevel,
    nextLevel,
    percent,
    pointsToNext: Math.max(0, nextMin - score),
    requirements: [],
  };
}

function ordersNeededForComponentScore(targetComponentScore: number): number {
  if (targetComponentScore >= 95) return 100;
  if (targetComponentScore >= 85) return 50;
  if (targetComponentScore >= 70) return 20;
  if (targetComponentScore >= 55) return 5;
  if (targetComponentScore >= 35) return 1;
  return 0;
}

export function buildNextLevelRequirements(
  score: number,
  factors: SellerPerformanceFactors,
  components: ComponentScores,
): NextLevelRequirement[] {
  const progress = progressToNextLevel(score);
  if (!progress.nextLevel || progress.pointsToNext === null) return [];

  const requirements: NextLevelRequirement[] = [
    {
      kind: "points",
      label: "Seller Score points",
      current: score,
      target: minScoreForLevel(progress.nextLevel),
      remaining: progress.pointsToNext,
    },
  ];

  const ordersNeeded = Math.max(
    0,
    ordersNeededForComponentScore(components.completedOrders + 10) - factors.completedOrders,
  );
  if (ordersNeeded > 0) {
    requirements.push({
      kind: "completed_orders",
      label: "Completed sales",
      current: factors.completedOrders,
      target: factors.completedOrders + ordersNeeded,
      remaining: ordersNeeded,
    });
  }

  const fiveStarNeeded = Math.max(0, 12 - factors.reviews.stars.five);
  if (fiveStarNeeded > 0 && components.reviews < 90) {
    requirements.push({
      kind: "five_star_reviews",
      label: "Five-star reviews",
      current: factors.reviews.stars.five,
      target: factors.reviews.stars.five + fiveStarNeeded,
      remaining: fiveStarNeeded,
    });
  }

  if (components.responseRate < 90) {
    requirements.push({
      kind: "response_rate",
      label: "Message response rate (%)",
      current: Math.round(factors.responseRatePercent),
      target: 90,
      remaining: Math.max(0, 90 - Math.round(factors.responseRatePercent)),
    });
  }

  if (factors.profileCompletion.percent < 100) {
    requirements.push({
      kind: "profile",
      label: "Profile checklist items",
      current: factors.profileCompletion.completed.length,
      target: factors.profileCompletion.completed.length + factors.profileCompletion.missing.length,
      remaining: factors.profileCompletion.missing.length,
    });
  }

  return requirements;
}

export function levelLabel(level: SellerLevel): string {
  return SELLER_LEVEL_LABELS[level];
}

export function weightedContribution(
  component: keyof typeof SELLER_PERFORMANCE_WEIGHTS,
  componentScore: number,
): number {
  return componentScore * SELLER_PERFORMANCE_WEIGHTS[component];
}
