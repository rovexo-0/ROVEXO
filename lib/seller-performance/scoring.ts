import {
  SELLER_PERFORMANCE_WEIGHTS,
  SELLER_SCORE_MAX,
  SELLER_SCORE_MIN,
} from "@/lib/seller-performance/master-spec";
import type { ComponentScores, SellerPerformanceFactors } from "@/lib/seller-performance/types";

export function clampSellerScore(value: number): number {
  return Math.max(SELLER_SCORE_MIN, Math.min(SELLER_SCORE_MAX, Math.round(value)));
}

export function scoreReviews(factors: SellerPerformanceFactors): number {
  const { averageRating, reviewCount } = factors.reviews;
  if (reviewCount === 0) return 0;
  const ratingPart = (averageRating / 5) * 70;
  const volumePart = Math.min(30, reviewCount * 3);
  return clampSellerScore(ratingPart + volumePart);
}

export function scoreCompletedOrders(count: number): number {
  if (count >= 1000) return 100;
  if (count >= 500) return 98;
  if (count >= 100) return 95;
  if (count >= 50) return 85;
  if (count >= 20) return 70;
  if (count >= 5) return 55;
  if (count >= 1) return 35;
  return 0;
}

export function scoreResponseRate(percent: number): number {
  return clampSellerScore(percent);
}

export function scoreAverageResponseTime(minutes: number | null): number {
  if (minutes === null) return 50;
  if (minutes <= 60) return 100;
  if (minutes <= 240) return 85;
  if (minutes <= 1440) return 70;
  if (minutes <= 2880) return 50;
  return 25;
}

export function scoreDispatchTime(hours: number | null): number {
  if (hours === null) return 50;
  if (hours <= 24) return 100;
  if (hours <= 48) return 85;
  if (hours <= 72) return 70;
  if (hours <= 120) return 55;
  return Math.max(20, 100 - Math.round(hours / 6));
}

export function scoreCancellationRate(ratePercent: number): number {
  return clampSellerScore(100 - ratePercent);
}

export function scoreValidReports(count: number): number {
  return clampSellerScore(100 - count * 15);
}

export function scoreProfileCompletion(percent: number): number {
  return clampSellerScore(percent);
}

export function scoreStoreActivity(activityScore: number): number {
  return clampSellerScore(activityScore);
}

export function buildComponentScores(factors: SellerPerformanceFactors): ComponentScores {
  return {
    reviews: scoreReviews(factors),
    completedOrders: scoreCompletedOrders(factors.completedOrders),
    responseRate: scoreResponseRate(factors.responseRatePercent),
    averageResponseTime: scoreAverageResponseTime(factors.averageResponseTimeMinutes),
    dispatchTime: scoreDispatchTime(factors.averageDispatchTimeHours),
    cancellationRate: scoreCancellationRate(factors.cancellationRatePercent),
    validReports: scoreValidReports(factors.validatedReports),
    profileCompletion: scoreProfileCompletion(factors.profileCompletion.percent),
    storeActivity: scoreStoreActivity(factors.storeActivity.score),
  };
}

export function calculateSellerPerformanceScore(factors: SellerPerformanceFactors): number {
  const components = buildComponentScores(factors);
  const weighted =
    components.reviews * SELLER_PERFORMANCE_WEIGHTS.reviews +
    components.completedOrders * SELLER_PERFORMANCE_WEIGHTS.completedOrders +
    components.responseRate * SELLER_PERFORMANCE_WEIGHTS.responseRate +
    components.averageResponseTime * SELLER_PERFORMANCE_WEIGHTS.averageResponseTime +
    components.dispatchTime * SELLER_PERFORMANCE_WEIGHTS.dispatchTime +
    components.cancellationRate * SELLER_PERFORMANCE_WEIGHTS.cancellationRate +
    components.validReports * SELLER_PERFORMANCE_WEIGHTS.validReports +
    components.profileCompletion * SELLER_PERFORMANCE_WEIGHTS.profileCompletion +
    components.storeActivity * SELLER_PERFORMANCE_WEIGHTS.storeActivity;

  return clampSellerScore(weighted);
}

export function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return "No data yet";
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hours`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

export function formatDispatchTime(hours: number | null): string {
  if (hours === null) return "No shipments yet";
  if (hours <= 24) return "Within 24h";
  if (hours <= 48) return "Within 48h";
  if (hours < 72) return `${hours.toFixed(1)} hours average`;
  return `${(hours / 24).toFixed(1)} days average`;
}
