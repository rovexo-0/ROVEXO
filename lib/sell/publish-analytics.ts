import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { PublishSuccessPayload } from "@/lib/sell/publish-success";

export type PublishTimingMetrics = {
  publishDurationMs: number;
  uploadDurationMs?: number;
};

export function trackListingPublished(
  payload: PublishSuccessPayload,
  metrics: PublishTimingMetrics,
): void {
  trackGaEvent("listing_created", {
    item_id: payload.listingId,
    item_name: payload.title,
    seller_id: payload.sellerId,
    listing_status: String(payload.listingStatus),
    publish_duration_ms: Math.round(metrics.publishDurationMs),
    upload_duration_ms: metrics.uploadDurationMs
      ? Math.round(metrics.uploadDurationMs)
      : undefined,
  });
}

export function trackPublishSuccessViewListing(payload: PublishSuccessPayload): void {
  trackGaEvent("view_listing", {
    item_id: payload.listingId,
    item_name: payload.title,
    seller_id: payload.sellerId,
    source: "publish_success",
  });
}

export function trackPublishSuccessShareListing(
  payload: PublishSuccessPayload,
  method: "native" | "clipboard",
): void {
  trackGaEvent("share_listing", {
    item_id: payload.listingId,
    item_name: payload.title,
    seller_id: payload.sellerId,
    method,
    source: "publish_success",
  });
}

export function trackPublishSuccessSellAnother(payload: PublishSuccessPayload): void {
  trackGaEvent("create_listing", {
    item_id: payload.listingId,
    item_name: payload.title,
    seller_id: payload.sellerId,
    source: "publish_success_sell_another",
  });
}
