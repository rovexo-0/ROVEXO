/**
 * HIGH #4 — Canonical Shipping Database Types sync (v1.0).
 *
 * Authority: real Supabase migrations under supabase/migrations/ (DB schema).
 * Target:   lib/supabase/types/database.ts
 *
 * Generator: `supabase gen types typescript --linked` (scripts/supabase-migrate-workflow.mjs step12)
 * Local status: UNAVAILABLE without SUPABASE_ACCESS_TOKEN / `supabase login`
 *   (LegacyPlatformAuthRequiredError). Types synced manually from migrations.
 *
 * Synced tables (Row/Insert/Update + Relationships + enums):
 * - shipping_records (SSOT)
 * - shipping_quotes
 * - shipping_labels_v1
 * - shipping_tracking_events
 * - shipment_parcels
 * - sendcloud_webhook_events (pre-existing; verified)
 * - shipping_addresses (pre-existing; verified)
 * - seller_shipping_settings (pre-existing; verified incl. default_label_size)
 * - shipping_reserve
 * - shipping_transactions
 * - carrier_claims
 * - carrier_returns
 * - carrier_responses
 *
 * Enums added: shipping_status_v1 · parcel_tier_v1
 *
 * Explicitly NOT typed (dropped by Sendcloud cleanup migration):
 * - shipping_fallback_events
 * - parcel2go_webhook_events
 *
 * Runtime: no shipping/pricing/label/tracking/webhook behaviour changes.
 */

export const CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1 = {
  version: "v1.0",
  high: "HIGH_4",
  authority: "supabase/migrations",
  target: "lib/supabase/types/database.ts",
  generator: "supabase gen types typescript --linked",
  generatorLocalStatus: "UNAVAILABLE_AUTH_REQUIRED",
  syncMethod: "manual_migration_reconcile",
  shippingRecordsSsot: "shipping_records",
  syncedTables: [
    "shipping_records",
    "shipping_quotes",
    "shipping_labels_v1",
    "shipping_tracking_events",
    "shipment_parcels",
    "sendcloud_webhook_events",
    "shipping_addresses",
    "seller_shipping_settings",
    "shipping_reserve",
    "shipping_transactions",
    "carrier_claims",
    "carrier_returns",
    "carrier_responses",
  ] as const,
  syncedEnums: ["shipping_status_v1", "parcel_tier_v1"] as const,
  droppedNotTyped: ["shipping_fallback_events", "parcel2go_webhook_events"] as const,
  migrationSources: [
    "20250722000001_shipping_engine_v1.sql",
    "20250727000001_parcel2go_production.sql",
    "20250728000001_parcel2go_label_metadata.sql",
    "20250729000001_commerce_engine_v1.sql",
    "20250730000001_resolution_engine_v1.sql",
    "20250628000002_v1_account_production_complete.sql",
    "20260708120000_shipment_parcels_canonical.sql",
    "20260708130000_shipment_parcels_insurance_operations.sql",
    "20260710120000_shipping_sendcloud_cleanup.sql",
    "20260710130000_seller_shipping_default_label_size.sql",
    "20260710150000_order_cancellation.sql",
    "20260731140000_sendcloud_webhook_idempotency_v1.sql",
  ] as const,
} as const;

/** Canonical fields that must exist on shipping_records typings. */
export const SHIPPING_RECORDS_CANONICAL_TYPE_FIELDS = [
  "shipping_price_pence",
  "selected_quote_id",
  "carrier",
  "status",
  "tracking_number",
  "tracking_url",
  "provider",
  "service_code",
  "order_id",
  "parcel_tier",
  "weight_kg",
  "created_at",
  "updated_at",
] as const;

/** Canonical fields that must exist on shipping_quotes typings. */
export const SHIPPING_QUOTES_CANONICAL_TYPE_FIELDS = [
  "price_pence",
  "provider_id",
  "carrier",
  "service_code",
  "service_name",
  "quote_payload",
  "shipping_record_id",
] as const;

/** Canonical fields that must exist on shipping_labels_v1 typings. */
export const SHIPPING_LABELS_CANONICAL_TYPE_FIELDS = [
  "shipping_record_id",
  "shipment_parcel_id",
  "carrier",
  "provider",
  "label_status",
  "label_url",
  "label_storage_path",
  "tracking_number",
  "provider_parcel_id",
] as const;
