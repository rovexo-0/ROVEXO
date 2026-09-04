/**
 * HIGH #4 — Canonical Shipping Database Types sync certification.
 * Asserts lib/supabase/types/database.ts matches migration authority fields.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1,
  SHIPPING_LABELS_CANONICAL_TYPE_FIELDS,
  SHIPPING_QUOTES_CANONICAL_TYPE_FIELDS,
  SHIPPING_RECORDS_CANONICAL_TYPE_FIELDS,
} from "@/lib/supabase/types/canonical-shipping-database-types-sync-v1";
import type { Database } from "@/lib/supabase/types/database";

const typesPath = join(process.cwd(), "lib/supabase/types/database.ts");
const typesSrc = readFileSync(typesPath, "utf8");

function tableBlock(name: string): string {
  const start = typesSrc.indexOf(`      ${name}: {`);
  expect(start, `missing table ${name}`).toBeGreaterThanOrEqual(0);
  // Next peer table key at exactly 6 spaces (not nested `Row` / `Insert` at 8+).
  const rest = typesSrc.slice(start + 1);
  const nextRel = rest.search(/\n {6}[a-z0-9_]+: \{/);
  const end = nextRel === -1 ? typesSrc.length : start + 1 + nextRel;
  return typesSrc.slice(start, end);
}

function assertRowFields(block: string, fields: readonly string[]) {
  const rowStart = block.indexOf("Row: {");
  const rowEnd = block.indexOf("Insert: {", rowStart);
  expect(rowStart).toBeGreaterThanOrEqual(0);
  expect(rowEnd).toBeGreaterThan(rowStart);
  const row = block.slice(rowStart, rowEnd);
  for (const field of fields) {
    expect(row, `missing Row field ${field}`).toContain(`${field}:`);
  }
}

describe("HIGH #4 — Canonical Shipping Database Types", () => {
  it("documents generator unavailable + migration sync method", () => {
    expect(CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1.authority).toBe(
      "supabase/migrations",
    );
    expect(CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1.generatorLocalStatus).toBe(
      "UNAVAILABLE_AUTH_REQUIRED",
    );
    expect(CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1.shippingRecordsSsot).toBe(
      "shipping_records",
    );
  });

  it("includes all synced shipping tables in Database typings", () => {
    for (const table of CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1.syncedTables) {
      expect(typesSrc).toContain(`      ${table}: {`);
    }
  });

  it("includes shipping_status_v1 and parcel_tier_v1 enums", () => {
    for (const en of CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1.syncedEnums) {
      expect(typesSrc).toContain(`${en}:`);
    }
    type Status = Database["public"]["Enums"]["shipping_status_v1"];
    type Tier = Database["public"]["Enums"]["parcel_tier_v1"];
    const status: Status = "in_transit";
    const tier: Tier = "medium_parcel";
    expect(status).toBe("in_transit");
    expect(tier).toBe("medium_parcel");
  });

  it("SHIPPING_RECORDS_TYPES — canonical SSOT fields", () => {
    const block = tableBlock("shipping_records");
    assertRowFields(block, SHIPPING_RECORDS_CANONICAL_TYPE_FIELDS);
    expect(block).toContain('referencedRelation: "orders"');
    expect(block).toContain("isOneToOne: true");
    type Row = Database["public"]["Tables"]["shipping_records"]["Row"];
    const _probe: Pick<
      Row,
      | "shipping_price_pence"
      | "selected_quote_id"
      | "carrier"
      | "status"
      | "tracking_number"
      | "order_id"
    > = {
      shipping_price_pence: 399,
      selected_quote_id: "sendcloud:1",
      carrier: "evri",
      status: "preparing",
      tracking_number: null,
      order_id: "00000000-0000-0000-0000-000000000001",
    };
    expect(_probe.shipping_price_pence).toBe(399);
  });

  it("SHIPPING_QUOTES_TYPES — provider cost + quote identity fields", () => {
    const block = tableBlock("shipping_quotes");
    assertRowFields(block, SHIPPING_QUOTES_CANONICAL_TYPE_FIELDS);
    type Row = Database["public"]["Tables"]["shipping_quotes"]["Row"];
    const _probe: Pick<Row, "price_pence" | "provider_id" | "quote_payload"> = {
      price_pence: 450,
      provider_id: "sendcloud",
      quote_payload: { providerShippingCostPence: 300 },
    };
    expect(_probe.price_pence).toBe(450);
  });

  it("LABEL_TYPES — shipping_labels_v1 parcel + label fields", () => {
    const block = tableBlock("shipping_labels_v1");
    assertRowFields(block, SHIPPING_LABELS_CANONICAL_TYPE_FIELDS);
    expect(block).toContain('referencedRelation: "shipment_parcels"');
  });

  it("TRACKING_TYPES — shipping_tracking_events", () => {
    const block = tableBlock("shipping_tracking_events");
    assertRowFields(block, [
      "shipping_record_id",
      "status",
      "title",
      "occurred_at",
      "source",
      "location",
    ]);
  });

  it("PARCEL_TYPES — shipment_parcels", () => {
    const block = tableBlock("shipment_parcels");
    assertRowFields(block, [
      "shipping_record_id",
      "parcel_number",
      "total_parcels",
      "carrier",
      "tracking_number",
      "status",
      "insurance_enabled",
      "parcel_operation",
      "weight_kg",
    ]);
  });

  it("WEBHOOK_TYPES — sendcloud_webhook_events", () => {
    const block = tableBlock("sendcloud_webhook_events");
    assertRowFields(block, [
      "webhook_event_id",
      "event_type",
      "tracking_number",
      "order_id",
      "status",
      "processed_at",
      "source",
      "metadata",
    ]);
  });

  it("RELATION_TYPES — reserve / transactions / claims / returns", () => {
    assertRowFields(tableBlock("shipping_reserve"), [
      "order_id",
      "seller_id",
      "reserved_amount",
      "spent_amount",
      "status",
    ]);
    assertRowFields(tableBlock("shipping_transactions"), [
      "order_id",
      "reserve_id",
      "direction",
      "amount",
      "carrier",
    ]);
    assertRowFields(tableBlock("carrier_claims"), [
      "order_id",
      "carrier",
      "tracking_number",
      "claim_type",
      "status",
      "provider",
    ]);
    assertRowFields(tableBlock("carrier_returns"), [
      "order_id",
      "return_tracking_number",
      "status",
    ]);
    assertRowFields(tableBlock("carrier_responses"), [
      "claim_id",
      "return_id",
      "order_id",
      "payload",
    ]);
    expect(tableBlock("seller_shipping_settings")).toContain("default_label_size:");
    expect(tableBlock("shipping_addresses")).toContain("user_id:");
  });

  it("does not reintroduce dropped dual-provider tables", () => {
    for (const dropped of CANONICAL_SHIPPING_DATABASE_TYPES_SYNC_V1.droppedNotTyped) {
      expect(typesSrc).not.toContain(`      ${dropped}: {`);
    }
  });
});
