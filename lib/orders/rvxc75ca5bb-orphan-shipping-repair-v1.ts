/**
 * One-time Owner/Super Admin lock for RVXC75CA5BB orphan shipping repair.
 * Exact order + exact Sendcloud quote identity only — never accept arbitrary IDs.
 */

export const RVXC75CA5BB_ORPHAN_REPAIR_V1 = {
  orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
  orderNumber: "RVXC75CA5BB",
  selectedShippingQuoteId: "sendcloud:29631",
  action: "repair_paid_order_shipping_persistence",
} as const;
