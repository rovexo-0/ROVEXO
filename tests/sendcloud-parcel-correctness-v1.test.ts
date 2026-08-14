/**
 * SENDCLOUD-FUNCTIONAL-HARDENING-V1 — Phase 3 parcel correctness + local idempotency.
 */
import { describe, expect, it } from "vitest";
import { buildSendcloudParcelPayload } from "@/lib/shipping/pricing/sendcloud-mappers";
import type { ShippingAddress } from "@/lib/shipping/types";

const delivery: ShippingAddress = {
  role: "delivery",
  fullName: "Buyer Name",
  line1: "221B Baker Street",
  city: "London",
  postcode: "NW1 6XE",
  country: "GB",
  validated: true,
};

const collection: ShippingAddress = {
  role: "collection",
  fullName: "Seller Name",
  line1: "42 Seller Lane",
  city: "Leeds",
  postcode: "LS1 1BA",
  country: "GB",
  phone: "+441134445555",
  validated: true,
};

describe("Sendcloud parcel payload correctness", () => {
  it("maps recipient, seller dispatch, dims, weight, method, order_number, request_label", () => {
    const payload = buildSendcloudParcelPayload({
      methodId: 42,
      parcelTier: "large_parcel",
      deliveryAddress: delivery,
      collectionAddress: collection,
      orderNumber: "RVX-4242",
      declaredValueGbp: 75,
      externalReference: "rovexo-order-x-parcel-1",
    });

    expect(payload.name).toBe("Buyer Name");
    expect(payload.postal_code).toBe("NW1 6XE");
    expect(payload.country).toBe("GB");
    expect(payload.from_name).toBe("Seller Name");
    expect(payload.from_postal_code).toBe("LS1 1BA");
    expect(payload.from_country).toBe("GB");
    expect(payload.from_telephone).toBe("+441134445555");
    expect(payload.shipment).toEqual({ id: 42 });
    expect(payload.order_number).toBe("RVX-4242");
    expect(payload.request_label).toBe(true);
    expect(payload.external_reference).toBe("rovexo-order-x-parcel-1");
    expect(Number(payload.weight)).toBeGreaterThan(0);
    expect(Number(payload.length)).toBeGreaterThan(0);
    expect(Number(payload.width)).toBeGreaterThan(0);
    expect(Number(payload.height)).toBeGreaterThan(0);
  });

  it("does not invent HTTP idempotency header — uses external_reference only", async () => {
    const { readFileSync } = await import("node:fs");
    const client = readFileSync("lib/shipping/sendcloud/client.ts", "utf8");
    expect(client).toContain("external_reference");
    expect(client).not.toMatch(/["']Idempotency-Key["']/i);
  });

  it("legacy createSendcloudParcel V2 path is removed from client", async () => {
    const { readFileSync } = await import("node:fs");
    const client = readFileSync("lib/shipping/sendcloud/client.ts", "utf8");
    expect(client).not.toMatch(/export async function createSendcloudParcel\b/);
  });
});
