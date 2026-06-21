import type { PromotionType } from "@/lib/promotions/config";

export type PromotionAnalyticsSurface =
  | "homepage"
  | "search"
  | "category"
  | "listing"
  | "seller";

export type PromotionAnalyticsEventType = "impression" | "click";

export type PromotionAnalyticsSummary = {
  impressions: number;
  clicks: number;
  ctr: number;
  purchases: number;
  revenueCents: number;
};

export type AdminPromotionRow = {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  sellerId: string;
  sellerName: string;
  type: PromotionType;
  durationId: string;
  amountCents: number;
  status: "pending" | "active" | "expired" | "failed" | "suspended";
  startsAt: string;
  endsAt: string;
  stripeSessionId: string | null;
  createdAt: string;
};

export type AdminPromotionStats = {
  totalPromotions: number;
  activePromotions: number;
  revenueCents: number;
  monthRevenueCents: number;
  bumpCount: number;
  featureCount: number;
  impressions: number;
  clicks: number;
  ctr: number;
};
