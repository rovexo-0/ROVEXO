/**
 * SENDCLOUD-FUNCTIONAL-HARDENING-V1 — Phase 2 label success integrity.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSendcloudParcelPayload,
  extractSendcloudLabelUrl,
  isUsableSendcloudLabelUrl,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import type { ShippingAddress } from "@/lib/shipping/types";

const generateLabel = vi.fn();

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
  getSendcloudPublicKey: () => "pub",
  getSendcloudSecretKey: () => "sec",
  getSendcloudBaseUrl: () => "https://panel.sendcloud.sc/api/v2",
}));

vi.mock("@/lib/shipping/sendcloud/service", () => ({
  SendcloudService: {
    generateLabel: (...args: unknown[]) => generateLabel(...args),
    getQuotes: vi.fn(),
  },
}));

const delivery: ShippingAddress = {
  role: "delivery",
  fullName: "Buyer",
  line1: "10 Downing Street",
  city: "London",
  postcode: "SW1A 2AA",
  country: "GB",
  validated: true,
};

const collection: ShippingAddress = {
  role: "collection",
  fullName: "Seller",
  line1: "1 Seller Road",
  city: "Manchester",
  postcode: "M1 1AE",
  country: "GB",
  validated: true,
};

describe("Sendcloud label integrity", () => {
  it("extracts a valid label URL => usable", () => {
    const url = extractSendcloudLabelUrl({
      label: { label_printer: "https://panel.sendcloud.sc/label/abc.pdf" },
    });
    expect(isUsableSendcloudLabelUrl(url)).toBe(true);
  });

  it("missing label URL => not usable (never fabricate)", () => {
    expect(isUsableSendcloudLabelUrl(null)).toBe(false);
    expect(isUsableSendcloudLabelUrl("")).toBe(false);
    expect(isUsableSendcloudLabelUrl("not-a-url")).toBe(false);
    expect(
      extractSendcloudLabelUrl({
        label: {},
        documents: [],
      }),
    ).toBeNull();
  });

  it("buildSendcloudParcelPayload requires collection and maps from_* + external_reference", () => {
    const payload = buildSendcloudParcelPayload({
      methodId: 8,
      parcelTier: "medium_parcel",
      deliveryAddress: delivery,
      collectionAddress: collection,
      orderNumber: "RVX-9",
      externalReference: "rovexo-order-1-parcel-1",
    });

    expect(payload.request_label).toBe(true);
    expect(payload.shipment.id).toBe(8);
    expect(payload.from_name).toBe("Seller");
    expect(payload.from_postal_code).toBe("M1 1AE");
    expect(payload.from_country).toBe("GB");
    expect(payload.external_reference).toBe("rovexo-order-1-parcel-1");
    expect(payload.weight).toMatch(/^\d+\.\d{3}$/);
  });
});

describe("SendcloudAdapter createLabel integrity", () => {
  beforeEach(() => {
    generateLabel.mockReset();
  });

  it("valid tracking + label URL => available success", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 99,
      trackingNumber: "TRACK1",
      pdfUrl: "https://panel.sendcloud.sc/label/1.pdf",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
    });

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:8",
      orderId: "o1",
      orderNumber: "RVX-1",
      parcelTier: "small_parcel",
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 5,
      collectionAddress: collection,
      deliveryAddress: delivery,
      idempotencyKey: "key-1",
      shippingOptionCode: "royal_mail:tracked_48",
      v2MethodId: 8,
    });

    expect(result.available).toBe(true);
    expect(result.trackingNumber).toBe("TRACK1");
    expect(result.pdfUrl).toContain("https://");
  });

  it("missing label URL => not success", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 99,
      trackingNumber: "TRACK1",
      pdfUrl: null,
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
    });

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:8",
      orderId: "o1",
      orderNumber: "RVX-1",
      parcelTier: "small_parcel",
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 5,
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "royal_mail:tracked_48",
      v2MethodId: 8,
    });

    expect(result.available).toBe(false);
    expect(result.trackingNumber).toBeNull();
  });

  it("Sendcloud error => not success", async () => {
    generateLabel.mockRejectedValue(new Error("Sendcloud 500"));

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:8",
      orderId: "o1",
      orderNumber: "RVX-1",
      parcelTier: "small_parcel",
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 5,
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "royal_mail:tracked_48",
      v2MethodId: 8,
    });

    expect(result.available).toBe(false);
  });

  it("tracking missing => not success", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 99,
      trackingNumber: null,
      pdfUrl: "https://panel.sendcloud.sc/label/1.pdf",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
    });

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:8",
      orderId: "o1",
      orderNumber: "RVX-1",
      parcelTier: "small_parcel",
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 5,
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "royal_mail:tracked_48",
      v2MethodId: 8,
    });

    expect(result.available).toBe(false);
  });

  it("seller authorization remains enforced in label generation entry", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("lib/shipping/label-generation.server.ts", "utf8");
    expect(src).toContain("order.seller_id !== sellerId");
    expect(src).toContain('rovexoValidationFailure("Order not found or access denied.")');
  });
});
