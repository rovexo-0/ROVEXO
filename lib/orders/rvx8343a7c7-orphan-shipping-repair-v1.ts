/**
 * One-time Owner/Super Admin lock for RVX8343A7C7 orphan shipping repair.
 * Exact order only — never accept arbitrary IDs.
 * Quote override forbidden: repair must use the order's existing selected_shipping_quote_id.
 */

export const RVX8343A7C7_ORPHAN_REPAIR_V1 = {
  orderId: "7554fb35-6261-4b4b-96a5-aef0273d9b5b",
  orderNumber: "RVX8343A7C7",
  /** Expected on the order already — never passed as a repair override. */
  expectedSelectedShippingQuoteId: "sendcloud:27227",
  action: "repair_paid_order_shipping_persistence",
} as const;
