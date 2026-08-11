/**
 * SENDCLOUD-FUNCTIONAL-HARDENING-V1 — Phase 3 parcel correctness + local idempotency.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
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
});

describe("createSendcloudParcel concurrency lock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("concurrent creates with same external_reference share one in-flight POST", async () => {
    process.env.SENDCLOUD_PUBLIC_KEY = "pub";
    process.env.SENDCLOUD_SECRET_KEY = "sec";

    let resolveFetch!: (value: Response) => void;
    const fetchGate = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    let fetchCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        fetchCalls += 1;
        return fetchGate;
      }),
    );

    const { createSendcloudParcel } = await import("@/lib/shipping/sendcloud/client");

    const payload = buildSendcloudParcelPayload({
      methodId: 1,
      parcelTier: "small_parcel",
      deliveryAddress: delivery,
      collectionAddress: collection,
      orderNumber: "RVX-C",
      externalReference: "lock-key-shared",
    });

    const p1 = createSendcloudParcel(payload);
    const p2 = createSendcloudParcel(payload);

    resolveFetch(
      new Response(JSON.stringify({ parcel: { id: 7, tracking_number: "T1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const [a, b] = await Promise.all([p1, p2]);
    expect(a.id).toBe(7);
    expect(b.id).toBe(7);
    expect(fetchCalls).toBe(1);
  });
});
