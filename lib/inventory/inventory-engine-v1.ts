/**
 * ROVEXO INVENTORY ENGINE v1.0 + Checkout Race Condition v1.0
 *
 * SSOT statuses: published → (checkout, still published) → sold after payment commit
 *
 * FORBIDDEN:
 *   Buy Now → RESERVED hides marketplace
 *   Buy Now → SOLD → Checkout
 *   Buy Now → Order → Payment
 *
 * ONLY ALLOWED (Checkout Race Condition v1.0):
 *   Buy Now → Checkout Session (listing stays published)
 *   → Payment success → ATOMIC claim (verify + order + sold) → marketplace remove
 *
 * Winner = first payment confirmed + order committed.
 * Second payer → ITEM_JUST_SOLD / HTTP 409.
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
  /** Legacy RPC retained for heal only — Buy Now must NOT call reserve. */
  reserveSets: {
    status: "reserved" as const,
    reserved: true,
    stockUnchanged: true,
  },
  markSoldSets: {
    statusWhenStockZero: "sold" as const,
    statusWhenStockRemaining: "published" as const,
    reserved: false,
    stockDecrementByQuantity: true,
    outOfStockRemainsVisible: false,
  },
  releaseSets: {
    status: "published" as const,
    reserved: false,
    stockUnchanged: true,
  },
  forbiddenOnReserve: ["status=sold", "stock=0", "stock_decrement"] as const,
  officialChain:
    "PUBLISHED → CHECKOUT (still published) → PAID → ATOMIC ORDER+SOLD → FINISHED" as const,
  /** Checkout session TTL — does not hide listing. */
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
    "CLAIM_INVENTORY",
    "CREATE_ORDER",
    "CREATE_TRANSACTION",
    "CREATE_SHIPPING",
    "STATUS_SOLD",
    "NOTIFICATIONS",
    "FINISHED",
  ] as const,
  sqlMigrations: [
    "supabase/migrations/20260724223000_inventory_engine_reserved_enum_v1.sql",
    "supabase/migrations/20260724223100_inventory_engine_reserved_rpc_v1.sql",
    "supabase/migrations/20260806150000_checkout_race_condition_sold_claim_v1.sql",
  ] as const,
  onlyBlockerUntilApplied: "SQL_MIGRATION" as const,
  buyNowMustNotHideListing: true as const,
  conflictMessage: "This item has just been sold." as const,
} as const;

export type InventoryEngineV1 = typeof INVENTORY_ENGINE_V1;

/** Cod Sânge alias — same SSOT. */
export const RESERVED_ABSOLUTE_LAW_RVX_2012 = INVENTORY_ENGINE_V1;
