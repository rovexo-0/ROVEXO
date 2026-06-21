import type { PromotionType } from "@/lib/promotions/config";

export type ListingPromotionRecord = {
  id: string;
  productId: string;
  sellerId: string;
  type: PromotionType;
  durationId: string;
  startsAt: string;
  endsAt: string;
  amountCents: number;
  stripeSessionId: string | null;
  stripePaymentIntentId?: string | null;
  status: "pending" | "active" | "expired" | "failed" | "suspended";
  createdAt?: string;
};

export type SellerPromotionHistoryItem = {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  type: PromotionType;
  durationId: string;
  amountCents: number;
  status: ListingPromotionRecord["status"];
  startsAt: string;
  endsAt: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
};

export type SellerPromotionStats = {
  activeCount: number;
  monthSpendCents: number;
  totalSpendCents: number;
};
