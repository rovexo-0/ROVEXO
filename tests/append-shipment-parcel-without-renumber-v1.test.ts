import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { nextAppendParcelNumber } from "@/lib/shipping/append-shipment-parcel-without-renumber-v1";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("appendShipmentParcelWithoutRenumbering", () => {
  it("A — existing [4] appends 5, not [1,2]", () => {
    expect(nextAppendParcelNumber([4])).toBe(5);
    expect(nextAppendParcelNumber([1])).toBe(2);
    expect(nextAppendParcelNumber([])).toBe(1);
    expect(nextAppendParcelNumber([1, 2, 4])).toBe(5);
  });

  it("A — repository append never calls renumberParcels or updates existing rows", () => {
    const src = read("lib/shipping/parcels-repository.ts");
    const start = src.indexOf("export async function appendShipmentParcelWithoutRenumbering");
    const end = src.indexOf("export async function updateShipmentParcel");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const method = src.slice(start, end);
    expect(method).toContain("nextAppendParcelNumber");
    expect(method).not.toContain("renumberParcels(");
    expect(method).not.toContain(".update(");
    expect(src).toContain("await renumberParcels(record.id)");
  });

  it("quote append never deletes historical shipping_quotes rows", () => {
    const src = read("lib/shipping/store.ts");
    const start = src.indexOf(
      "export async function appendAndSelectShippingQuoteWithoutReplacing",
    );
    const end = src.indexOf("export async function saveShippingLabel");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const method = src.slice(start, end);
    expect(method).toContain(".insert(");
    expect(method).not.toContain(".delete(");
    expect(src).toContain('await admin.from("shipping_quotes").delete()');
  });

  it("G — Print Label API contract still accepts orderId only", () => {
    const route = read("app/api/shipping/labels/route.ts");
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(route).toContain("orderId: z.string().uuid()");
    expect(route).toContain("parcelId: z.string().uuid().optional()");
    expect(hub).toContain("body: JSON.stringify({ orderId: order.id })");
    expect(hub).not.toContain("parcelId:");
  });
});
