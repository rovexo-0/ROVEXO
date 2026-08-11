/**
 * P6.2 lock — persist Owner-confirmed Sendcloud V3 shipping_option_code
 * for RVX8343A7C7 / sendcloud:27227 only.
 *
 * CONFIRMED by live P6.1 diagnostic (HTTP 200 · V3_EXACT_COUNTERPART_FOUND).
 * Never accept a different code. Never invent substitutes.
 * No shipment / announce / label / payment mutation.
 */

import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";

export const RVX8343A7C7_V3_QUOTE_PERSIST_V1 = {
  orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
  orderNumber: RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
  legacyQuoteId: "sendcloud:27227",
  v2MethodId: 27227,
  /** Owner-confirmed exact V3 counterpart from P6.1 diagnostic — immutable for this lock. */
  confirmedShippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
  classification: "V3_EXACT_COUNTERPART_FOUND",
  action: "persist_confirmed_v3_shipping_option_code",
} as const;

export type Rvx8343a7c7V3QuotePersistLock = typeof RVX8343A7C7_V3_QUOTE_PERSIST_V1;
