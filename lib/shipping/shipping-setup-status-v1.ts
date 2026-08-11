/**
 * Post-payment shipping persistence setup status (orders.shipping_setup_status).
 * Payment success is independent — repair_required never charges the buyer again.
 */

export const SHIPPING_SETUP_STATUSES = [
  "pending",
  "ready",
  "repair_required",
  "failed",
] as const;

export type ShippingSetupStatus = (typeof SHIPPING_SETUP_STATUSES)[number];

export function isShippingSetupStatus(value: unknown): value is ShippingSetupStatus {
  return (
    typeof value === "string" &&
    (SHIPPING_SETUP_STATUSES as readonly string[]).includes(value)
  );
}

export function isShippingSetupReady(status: string | null | undefined): boolean {
  return status === "ready";
}

export function isShippingSetupRepairable(status: string | null | undefined): boolean {
  return status === "repair_required" || status === "pending" || status === "failed";
}
