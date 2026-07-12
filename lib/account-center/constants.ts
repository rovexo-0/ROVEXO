import type { OrderStatus } from "@/lib/orders/types";

/**
 * Active orders for the My Account hub counter.
 *
 * Maps to: Pending Payment, Paid, Ready To Ship, Posted, In Transit.
 * Excludes: Completed, Cancelled, Refunded (terminal statuses).
 */
export const ACCOUNT_HUB_ACTIVE_ORDER_STATUSES = [
  "awaiting_payment",
  "awaiting_shipment",
  "shipped",
  "issue_open",
] as const satisfies readonly OrderStatus[];
