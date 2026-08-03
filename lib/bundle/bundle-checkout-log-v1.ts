/**
 * Bundle Checkout logging — Phase 1 certification audit trail.
 */

import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";

export type BundleCheckoutLogEvent =
  | "Reservation Created"
  | "Reservation Released"
  | "Checkout Started"
  | "Checkout Failed"
  | "Checkout Cancelled"
  | "Checkout Completed"
  | "Concurrency Conflict"
  | "Stock Conflict"
  | "Offer Created"
  | "Offer Accepted"
  | "Offer Declined"
  | "Order Created"
  | "Bundle Revalidated"
  | "Snapshot Locked";

export function bundleCheckoutLog(
  event: BundleCheckoutLogEvent,
  detail?: Record<string, unknown> | string,
): void {
  const suffix =
    typeof detail === "string"
      ? detail
      : detail
        ? JSON.stringify(detail)
        : undefined;
  FINANCIAL_LOGGER("BUY NOW STARTED", `BUNDLE:${event}${suffix ? ` ${suffix}` : ""}`);
  if (typeof console !== "undefined") {
    console.info(`[bundle-checkout] ${event}`, detail ?? "");
  }
}
