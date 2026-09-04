/**
 * HIGH #2 — Shipping SSOT: shipping_records is the only write authority.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  SHIPPING_RECORDS_SSOT_V1,
  SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY,
} from "@/lib/shipping/shipping-records-ssot-v1";
import {
  isFailedHistoricalParcel,
  isEligibleForNewLabel,
  resolveShipmentParcelForLabel,
} from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function collectTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".worktrees" || entry === ".next") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function hasOrderShipmentsWrite(source: string): boolean {
  // Match .from("order_shipments") ... .insert / .update within a short window.
  const re =
    /\.from\(\s*["']order_shipments["']\s*\)[\s\S]{0,220}?\.((insert)|(update)|(upsert)|(delete))\s*\(/g;
  return re.test(source);
}

function parcel(partial: Partial<ShipmentParcel> & Pick<ShipmentParcel, "id" | "parcelNumber" | "status">): ShipmentParcel {
  return {
    shippingRecordId: "rec-1",
    totalParcels: 2,
    weightKg: 1,
    dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 },
    trackingNumber: null,
    trackingUrl: null,
    carrier: null,
    shippingService: null,
    productItemIds: [],
    insuranceEnabled: false,
    insuranceValueGbp: null,
    operation: null,
    estimatedDeliveryAt: null,
    label: null,
    providerParcelId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("Shipping SSOT v1.0 — shipping_records", () => {
  it("declares shipping_records as canonical write authority", () => {
    expect(SHIPPING_RECORDS_SSOT_V1.canonicalTable).toBe("shipping_records");
    expect(SHIPPING_RECORDS_SSOT_V1.legacyTable).toBe("order_shipments");
    expect(SHIPPING_RECORDS_SSOT_V1.writeAuthority).toBe("shipping_records");
    expect(SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY.insert).toBe("forbidden");
    expect(SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY.update).toBe("forbidden");
  });

  it("canonical create/update/attach paths write shipping_records only", () => {
    const store = read("lib/shipping/store.ts");
    expect(store).toContain('from("shipping_records")');
    expect(store).toContain("ensureShippingRecord");
    expect(store).toContain("updateShippingRecordStatus");
    expect(store).toContain("attachShippingTracking");
    expect(store).toContain("never dual-write order_shipments");
    expect(store).toContain("never insert/update order_shipments");
    expect(store).not.toContain("createOrderShipment(input)");
    expect(hasOrderShipmentsWrite(store)).toBe(false);
  });

  it("carrier + tracking + status persist on shipping_records in attach path", () => {
    const store = read("lib/shipping/store.ts");
    const attach = store.slice(store.indexOf("export async function attachShippingTracking"));
    expect(attach).toContain("carrier: input.carrier");
    expect(attach).toContain("tracking_number: input.trackingNumber");
    expect(attach).toContain('status: "collected"');
    expect(attach).toContain('from("shipping_records")');
    expect(hasOrderShipmentsWrite(attach)).toBe(false);
  });

  it("status transition updates shipping_records and not order_shipments", () => {
    const store = read("lib/shipping/store.ts");
    const fn = store.slice(
      store.indexOf("export async function updateShippingRecordStatus"),
      store.indexOf("export async function recordShippingTrackingDiagnosticEvent"),
    );
    expect(fn).toContain('.update({ status: input.status })');
    expect(fn).toContain("shipping_tracking_events");
    expect(hasOrderShipmentsWrite(fn)).toBe(false);
  });

  it("legacy createOrderShipment / updateShipmentStatus are frozen to canonical", () => {
    const service = read("lib/shipping/service.ts");
    expect(service).toContain("LEGACY API — frozen write path");
    expect(service).toContain("Does NOT insert into order_shipments");
    expect(service).toContain("attachShippingTracking");
    expect(service).toContain("updateShippingRecordStatus");
    expect(service).toContain("prefers canonical shipping_records");
    expect(hasOrderShipmentsWrite(service)).toBe(false);
    // Compatibility SELECT of legacy table remains allowed.
    expect(service).toContain('from("order_shipments")');
  });

  it("legacy compatibility read derives from canonical when present", () => {
    const service = read("lib/shipping/service.ts");
    expect(service).toContain("orderShipmentFromCanonical");
    expect(service).toContain("fromCanonical: true");
    expect(service).toContain("getShippingRecord");
    expect(service).toContain("readLegacyOrderShipment");
  });

  it("duplicate shipment prevention — ensureShippingRecord is singular owner", () => {
    const store = read("lib/shipping/store.ts");
    expect(store).toContain("export async function ensureShippingRecord");
    const attachStart = store.indexOf("export async function attachShippingTracking");
    const attachEnd = store.indexOf("export async function saveShippingQuotes");
    const attach = store.slice(attachStart, attachEnd);
    expect(attach).toContain("ensureShippingRecord");
    expect(hasOrderShipmentsWrite(attach)).toBe(false);
    expect(attach).not.toContain('from("order_shipments")');
  });

  it("multi-carrier / historical parcel recovery unchanged", () => {
    const failed = parcel({
      id: "p-failed",
      parcelNumber: 1,
      status: "failed",
    });
    const eligible = parcel({
      id: "p-new",
      parcelNumber: 2,
      status: "preparing",
    });
    expect(isFailedHistoricalParcel(failed)).toBe(true);
    expect(isEligibleForNewLabel(eligible)).toBe(true);
    const resolved = resolveShipmentParcelForLabel({
      shippingRecordId: "rec-1",
      loadedExplicitParcel: null,
      orderParcels: [failed, eligible],
    });
    expect(resolved.status).toBe("use");
    if (resolved.status === "use") {
      expect(resolved.parcel.id).toBe("p-new");
    }
  });

  it("verify no unintended order_shipments writes under lib/ (except ops reset)", () => {
    const root = join(process.cwd(), "lib");
    const files = collectTsFiles(root);
    const offenders: string[] = [];
    for (const file of files) {
      if (file.includes(`${join("lib", "launch", "production-launch-reset")}`)) continue;
      const src = readFileSync(file, "utf8");
      if (hasOrderShipmentsWrite(src)) offenders.push(file.replace(process.cwd() + "/", ""));
    }
    expect(offenders).toEqual([]);
  });

  it("deletion eligibility prefers shipping_records active state", () => {
    const src = read("lib/account/deletion-eligibility.ts");
    expect(src).toContain("shipping_records");
    expect(src).toContain("ACTIVE_SHIPPING_RECORD_STATUSES");
    expect(src).toContain("LEGACY_ACTIVE_SHIPMENT_STATUSES");
  });
});
