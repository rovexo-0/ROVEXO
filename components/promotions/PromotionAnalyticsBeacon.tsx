"use client";

import { useEffect } from "react";

type PromotionAnalyticsBeaconProps = {
  productId?: string;
  surface: "homepage" | "search" | "category" | "listing" | "seller";
  enabled?: boolean;
};

export function trackPromotionEvent(
  productId: string,
  eventType: "impression" | "click",
  surface: PromotionAnalyticsBeaconProps["surface"],
): void {
  void fetch("/api/promotions/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, eventType, surface }),
  }).catch(() => undefined);
}

export function PromotionAnalyticsBeacon({
  productId,
  surface,
  enabled = true,
}: PromotionAnalyticsBeaconProps) {
  useEffect(() => {
    if (!enabled || !productId) return;
    trackPromotionEvent(productId, "impression", surface);
  }, [enabled, productId, surface]);

  return null;
}
