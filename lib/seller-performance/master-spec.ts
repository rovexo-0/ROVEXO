/**
 * ROVEXO Seller Performance MASTER_SPEC v1.0 — Reputation Engine (NO AI)
 * Single source of truth for weights, levels, and achievement definitions.
 */

export const SELLER_PERFORMANCE_SPEC_VERSION = "1.0" as const;

/** Canonical freeze marker — Seller Performance v1.0 approved for production. */
export const SELLER_PERFORMANCE_CANONICAL_STATUS = "CANONICAL_FROZEN_v1.0" as const;
export const SELLER_PERFORMANCE_CANONICAL_FROZEN = true as const;

export const SELLER_SCORE_MIN = 0;
export const SELLER_SCORE_MAX = 100;

export const SELLER_PERFORMANCE_WEIGHTS = {
  reviews: 0.25,
  completedOrders: 0.2,
  responseRate: 0.15,
  averageResponseTime: 0.1,
  dispatchTime: 0.1,
  cancellationRate: 0.05,
  validReports: 0.05,
  profileCompletion: 0.05,
  storeActivity: 0.05,
} as const;

export type SellerPerformanceComponentKey = keyof typeof SELLER_PERFORMANCE_WEIGHTS;

export const SELLER_LEVEL_THRESHOLDS = [
  { level: "elite_seller" as const, min: 98, label: "Elite Seller" },
  { level: "premium_seller" as const, min: 90, label: "Premium Seller" },
  { level: "top_seller" as const, min: 75, label: "Top Seller" },
  { level: "trusted_seller" as const, min: 60, label: "Trusted Seller" },
  { level: "new_seller" as const, min: 0, label: "New Seller" },
] as const;

export type SellerLevel = (typeof SELLER_LEVEL_THRESHOLDS)[number]["level"];

export const SELLER_LEVEL_LABELS: Record<SellerLevel, string> = {
  new_seller: "New Seller",
  trusted_seller: "Trusted Seller",
  top_seller: "Top Seller",
  premium_seller: "Premium Seller",
  elite_seller: "Elite Seller",
};

export const PROFILE_COMPLETION_FIELDS = [
  "avatar",
  "banner",
  "fullName",
  "email",
  "phone",
  "address",
  "identity",
  "businessVerification",
  "bio",
  "storePolicies",
  "returnPolicy",
  "profilePhoto",
  "cover",
] as const;

export type ProfileCompletionField = (typeof PROFILE_COMPLETION_FIELDS)[number];

export const ACHIEVEMENT_DEFINITIONS = [
  { id: "first_sale", label: "First Sale", description: "Completed your first order" },
  { id: "orders_10", label: "10 Sales", description: "10 completed orders" },
  { id: "orders_50", label: "50 Sales", description: "50 completed orders" },
  { id: "verified_seller", label: "Verified Seller", description: "Identity verification approved" },
  { id: "fast_responder", label: "Fast Responder", description: "90%+ response rate with sub-4h average" },
  { id: "excellent_response_time", label: "Excellent Response Time", description: "95%+ response rate with sub-1h average" },
  { id: "fast_dispatch", label: "Fast Dispatcher", description: "Average dispatch within 24 hours" },
  { id: "top_rated", label: "Top Rated", description: "4.8+ average from 10+ reviews" },
  { id: "reviews_100_positive", label: "100 Positive Reviews", description: "100 reviews rated 4 stars or higher" },
  { id: "orders_100", label: "100 Orders", description: "100 completed orders" },
  { id: "orders_500", label: "500 Orders", description: "500 completed orders" },
  { id: "orders_1000", label: "1000 Orders", description: "1000 completed orders" },
  { id: "trending_seller", label: "Trending Seller", description: "Strong recent sales activity" },
  { id: "trusted_seller", label: "Trusted Seller", description: "Reached Trusted Seller level" },
  { id: "top_seller", label: "Top Seller", description: "Reached Top Seller level" },
  { id: "premium_seller", label: "Premium Seller", description: "Reached Premium Seller level" },
  { id: "elite_seller", label: "Elite Seller", description: "Reached Elite Seller level" },
] as const;

export type AchievementId = (typeof ACHIEVEMENT_DEFINITIONS)[number]["id"];

export const RECALCULATION_TRIGGERS = [
  "completed_order",
  "cancellation",
  "refund",
  "dispatch",
  "review",
  "reply",
  "validated_report",
  "identity_verification",
  "email_verification",
  "phone_verification",
  "business_verification",
  "profile_update",
  "first_sale",
  "sales_milestone_10",
  "sales_milestone_50",
  "sales_milestone_100",
  "account_inactivity",
  "account_reactivation",
  "force_recalc",
] as const;

export type RecalculationTrigger = (typeof RECALCULATION_TRIGGERS)[number];
