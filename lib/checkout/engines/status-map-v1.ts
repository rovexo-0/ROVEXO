/**
 * Blood XXIV — Financial status mapping (Owner law ↔ DB enum).
 * ZERO DB enum rewrite — maps onto existing order_status for Sprint I–V safety.
 */

import type { OrderStatus } from "@/lib/orders/types";

/** Owner Absolute Financial order lifecycle (conceptual). */
export type BloodOrderStatus =
  | "CREATED"
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_SUCCESSFUL"
  | "ORDER_CONFIRMED"
  | "SELLER_PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

/** Owner Absolute Financial transaction lifecycle (conceptual). */
export type BloodTransactionStatus =
  | "CREATED"
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_SUCCESSFUL"
  | "CONFIRMED"
  | "DONE"
  | "CANCELLED";

/** DB persistence for unpaid Buy Now orders (LEGACY — draining). */
export const DB_PENDING_PAYMENT: OrderStatus = "awaiting_payment";

/**
 * Master Checkout Architecture Absolute Law.
 * Listing may remain RESERVED for a maximum of 120 seconds. No exceptions.
 */
export const CHECKOUT_SESSION_TTL_SECONDS = 120 as const;

/** @deprecated Use CHECKOUT_SESSION_TTL_SECONDS (120). Legacy 15-minute awaiting_payment window. */
export const BUY_NOW_AUTO_CANCEL_MINUTES = 15 as const;

/** Convenience: TTL in minutes for Date math (2). */
export const CHECKOUT_SESSION_TTL_MINUTES = 2 as const;

export function toBloodOrderStatus(db: OrderStatus): BloodOrderStatus {
  switch (db) {
    case "awaiting_payment":
      return "PENDING_PAYMENT";
    case "awaiting_shipment":
      return "ORDER_CONFIRMED";
    case "shipped":
      return "SHIPPED";
    case "delivered":
      return "DELIVERED";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    case "issue_open":
      return "ORDER_CONFIRMED";
    default:
      return "PENDING_PAYMENT";
  }
}

export function bloodOrderIsPendingPayment(db: OrderStatus): boolean {
  return db === "awaiting_payment";
}
