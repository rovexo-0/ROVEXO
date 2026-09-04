/**
 * ROVEXO Shipping SSOT v1.0 — shipping_records is the only write authority.
 *
 * CANONICAL: shipping_records (+ shipment_parcels / shipping_tracking_events / shipping_quotes)
 * LEGACY:    order_shipments — compatibility READ only (no new truth, no required dual-write)
 *
 * Carrier · status · tracking · active shipment state · lifecycle
 * → one source of truth: shipping_records.
 */

export const SHIPPING_RECORDS_SSOT_V1 = {
  version: "v1.0",
  canonicalTable: "shipping_records",
  legacyTable: "order_shipments",
  equation: "ONE SHIPMENT IDENTITY = shipping_records · order_shipments = LEGACY READ ONLY",
  writeAuthority: "shipping_records",
  legacyRole: "compatibility_read_only",
  forbidden: [
    "new_order_shipments_insert_as_truth",
    "dual_write_status_to_order_shipments",
    "carrier_tracking_status_from_order_shipments_as_ssot",
  ],
} as const;

/** Mutation paths that must never write order_shipments. */
export const SHIPPING_SSOT_CANONICAL_WRITE_OWNERS = [
  "lib/shipping/store.ts#ensureShippingRecord",
  "lib/shipping/store.ts#updateShippingRecordStatus",
  "lib/shipping/store.ts#attachShippingTracking",
  "lib/shipping/store.ts#recordShippingTrackingDiagnosticEvent",
  "lib/shipping/parcels-repository.ts",
] as const;

/** Allowed order_shipments access after SSOT freeze. */
export const SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY = {
  insert: "forbidden",
  update: "forbidden",
  delete: "forbidden_except_ops_reset",
  select: "compatibility_read_only_or_historical_fallback",
} as const;
