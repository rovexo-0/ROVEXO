import type { TrustTier } from "@/lib/trust/types";

export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 100;
export const TRUST_DEFAULT_SCORE = 50;

export const TRUST_TIER_THRESHOLDS: Array<{ tier: TrustTier; min: number }> = [
  { tier: "diamond", min: 90 },
  { tier: "platinum", min: 75 },
  { tier: "gold", min: 60 },
  { tier: "silver", min: 40 },
  { tier: "bronze", min: 0 },
];

export const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

export const TRUST_EVENT_DELTAS = {
  order_completed_seller: 2,
  order_completed_buyer: 1,
  order_cancelled_seller: -3,
  order_cancelled_buyer: -1,
  order_refunded_seller: -4,
  order_refunded_buyer: -1,
  order_refunded_partial_seller: -2,
  order_refunded_partial_buyer: 0,
  review_positive: 3,
  review_negative: -5,
  dispute_lost_seller: -8,
  dispute_lost_buyer: -4,
  dispute_won_seller: 2,
  report_received: -2,
  moderation_warning: -5,
  moderation_blocked: -12,
  policy_violation: -10,
  chargeback: -15,
  suspension: -20,
  verification_approved: 3,
  verification_rejected: -2,
  on_time_shipment: 1,
  late_shipment: -2,
  admin_penalty: 0,
  admin_restore: 0,
  fraud_detected: -25,
} as const;

export type TrustEventKey = keyof typeof TRUST_EVENT_DELTAS;

export const LOW_TRUST_THRESHOLD = 35;
