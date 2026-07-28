/**
 * ROVEXO INVENTORY ENGINE v1.0 + COD SÂNGE RVX-2012 (Reserved Absolute Law)
 *
 * SSOT statuses only: published → reserved → sold → delisted(deleted)
 *
 * FORBIDDEN:
 *   Buy Now → SOLD → Checkout
 *   Buy Now → SOLD → Payment → Order
 *   Buy Now → Order → Payment
 *   Buy Now → Payment → Checkout
 *   Buy Now → SOLD → No Payment
 *
 * ONLY ALLOWED (Master Checkout Architecture v1.0):
 *   Buy Now → RESERVED → Checkout Session (120s) → Payment → Success → Order → SOLD
 *
 * Reservation record (ONE SSOT — checkout_sessions, Absolute Law 120s):
 *   reservationId = checkout_sessions.public_id
 *   buyerId · listingId · createdAt · expiresAt (expires_at)
 *   stripeCheckoutSessionId · orderId (after pay only) · status
 *
 * Timer: 120 seconds → AUTO RELEASE → published (stock unchanged)
 * Payment fail / timeout / abandoned session → RELEASE → published
 * Payment success → mark sold → stock = stock - quantity
 */

export const INVENTORY_ENGINE_V1 = {
  version: "1.0",
  bloodCode: "RVX-2012" as const,
  status: "LOCKED",
  productStatusEnum: [
    "draft",
    "published",
    "reserved",
    "paused",
    "sold",
    "deleted",
  ] as const,
  absoluteStatuses: ["published", "reserved", "sold", "deleted"] as const,
  forbiddenStatuses: [
    "available",
    "unavailable",
    "temp_sold",
    "payment_hold",
    "fake_sold",
    "lock_sold",
    "checkout_sold",
  ] as const,
  reserveSets: {
    status: "reserved" as const,
    reserved: true,
    stockUnchanged: true,
  },
  markSoldSets: {
    status: "published" as const,
    reserved: false,
    stockDecrementByQuantity: true,
    outOfStockRemainsVisible: true,
  },
  releaseSets: {
    status: "published" as const,
    reserved: false,
    stockUnchanged: true,
  },
  forbiddenOnReserve: ["status=sold", "stock=0", "stock_decrement"] as const,
  officialChain:
    "PUBLISHED → RESERVED → PAID → SOLD → FINISHED" as const,
  /** Absolute Law — listing may remain RESERVED for a maximum of 120 seconds. */
  reservationSeconds: 120 as const,
  reservationMinutes: 2 as const,
  reservationSsot: "checkout_sessions (open) + checkout_sessions.expires_at" as const,
  reservationFields: [
    "reservationId", // checkout_sessions.public_id
    "buyerId",
    "listingId",
    "createdAt",
    "expiresAt", // checkout_sessions.expires_at
    "checkoutId",
    "paymentId",
    "stripeId",
    "orderId", // set only after payment success
    "status",
  ] as const,
  releaseTriggers: [
    "PAYMENT_FAIL",
    "PAYMENT_TIMEOUT_120S",
    "ABANDONED_SESSION_AUTO_RELEASE",
  ] as const,
  successSequence: [
    "PAYMENT_SUCCESS",
    "CREATE_ORDER",
    "CREATE_TRANSACTION",
    "CREATE_SHIPPING",
    "STATUS_SOLD",
    "STOCK_DECREMENT",
    "NOTIFICATIONS",
    "FINISHED",
  ] as const,
  sqlMigrations: [
    "supabase/migrations/20260724223000_inventory_engine_reserved_enum_v1.sql",
    "supabase/migrations/20260724223100_inventory_engine_reserved_rpc_v1.sql",
  ] as const,
  onlyBlockerUntilApplied: "SQL_MIGRATION" as const,
} as const;

export type InventoryEngineV1 = typeof INVENTORY_ENGINE_V1;

/** Cod Sânge alias — same SSOT. */
export const RESERVED_ABSOLUTE_LAW_RVX_2012 = INVENTORY_ENGINE_V1;
