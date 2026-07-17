import { describe, expect, it, vi } from "vitest";
import { validateUkShippingAddress } from "@/lib/shipping/addresses";
import { INTERNAL_LABEL_PLATFORM_FEE_PENCE, applyInternalLabelFee } from "@/lib/shipping/labels/fee";
import { generateShippingLabel } from "@/lib/shipping/labels/service.server";
import {
  PARCEL_TIER_OPTIONS,
  detectParcelTier,
  mapLegacyParcelSize,
  parcelTierLabel,
  recommendParcelTier,
} from "@/lib/shipping/parcels";
import { fetchShippingQuotes } from "@/lib/shipping/pricing/service";
import { shippingStatusLabel } from "@/lib/shipping/status";
import { buildTrackingTimeline, createTrackingEvent } from "@/lib/shipping/tracking";
import { PARCEL_TIERS, SHIPPING_STATUSES } from "@/lib/shipping/types";

const sampleAddress = {
  role: "collection" as const,
  fullName: "Jane Seller",
  line1: "10 Downing Street",
  city: "London",
  postcode: "SW1A 2AA",
  country: "United Kingdom",
  validated: false,
};

describe("ROVEXO Shipping Engine v1.0", () => {
  it("defines all canonical parcel tiers", () => {
    expect(PARCEL_TIERS).toEqual([
      "letter",
      "small_parcel",
      "medium_parcel",
      "large_parcel",
      "xl_parcel",
    ]);
    expect(PARCEL_TIER_OPTIONS.map((option) => option.label)).toContain("Letter");
    expect(PARCEL_TIER_OPTIONS.map((option) => option.label)).toContain("XL Parcel");
  });

  it("detects parcel tier from dimensions and supports manual override", () => {
    const detected = detectParcelTier({
      dimensions: { weightKg: 0.2, lengthCm: 30, widthCm: 20, heightCm: 2 },
    });
    expect(detected.appliedTier).toBe("letter");
    expect(detected.source).toBe("dimensions");

    const manual = detectParcelTier({
      legacyParcelSize: "medium",
      manualTier: "xl_parcel",
    });
    expect(manual.appliedTier).toBe("xl_parcel");
    expect(manual.source).toBe("manual");
  });

  it("maps legacy sell-flow parcel sizes without regression", () => {
    expect(mapLegacyParcelSize("small")).toBe("small_parcel");
    expect(mapLegacyParcelSize("xl")).toBe("xl_parcel");
    expect(recommendParcelTier({ legacyParcelSize: "medium" })).toBe("medium_parcel");
    expect(parcelTierLabel("large_parcel")).toBe("Large Parcel");
  });

  it("defines canonical shipping statuses", () => {
    expect(SHIPPING_STATUSES).toContain("preparing");
    expect(SHIPPING_STATUSES).toContain("out_for_delivery");
    expect(SHIPPING_STATUSES).toContain("lost");
    expect(shippingStatusLabel("in_transit")).toBe("In Transit");
  });

  it("builds unlimited-event tracking timelines", () => {
    const events = [
      createTrackingEvent({ status: "preparing", title: "Preparing" }),
      createTrackingEvent({ status: "collected", title: "Collected" }),
      createTrackingEvent({ status: "in_transit", title: "In transit" }),
    ];
    const timeline = buildTrackingTimeline(events, "in_transit");
    expect(timeline.some((item) => item.current && item.status === "in_transit")).toBe(true);
    expect(timeline.filter((item) => item.done).length).toBeGreaterThanOrEqual(3);
  });

  it("validates UK shipping addresses", () => {
    const result = validateUkShippingAddress(sampleAddress);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.normalized.postcode).toBe("SW1A 2AA");
    }
  });

  it("returns no live quotes on the client facade when Sendcloud is not configured", async () => {
    vi.stubEnv("SENDCLOUD_PUBLIC_KEY", "");
    vi.stubEnv("SENDCLOUD_SECRET_KEY", "");
    vi.stubEnv("SENDCLOUD_API_KEY", "");
    const pricing = await fetchShippingQuotes({
      parcelTier: "medium_parcel",
      collectionAddress: sampleAddress,
      deliveryAddress: { ...sampleAddress, role: "delivery", fullName: "John Buyer" },
    });
    expect(pricing.providerAvailable).toBe(false);
    expect(pricing.quotes).toHaveLength(0);
  });

  it("never exposes the internal £0.15 label fee in label responses", async () => {
    expect(INTERNAL_LABEL_PLATFORM_FEE_PENCE).toBe(15);
    expect(applyInternalLabelFee(500).platformFeePence).toBe(15);

    const result = await generateShippingLabel({
      quoteId: "quote-test",
      orderId: "order-test",
      orderNumber: "RVXTEST",
      parcelTier: "medium_parcel",
      collectionAddress: sampleAddress,
      deliveryAddress: { ...sampleAddress, role: "delivery" },
    });

    expect(result.internalPlatformFeePence).toBe(0);
    expect(result.label).not.toHaveProperty("platformFee");
    expect(JSON.stringify(result.label)).not.toContain("0.15");
  });
});
