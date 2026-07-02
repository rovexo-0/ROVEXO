import { describe, expect, it } from "vitest";
import { createDefaultShippingEngineDocument } from "@/lib/shipping-engine/defaults";
import {
  FUTURE_CARRIER_IDS,
  SHIPPING_ENGINE_MODULES,
  SHIPPING_ENGINE_TRACKING_STAGES,
  registerShippingEngineModule,
} from "@/lib/shipping-engine/registry";
import { buildShippingTimeline } from "@/lib/shipping-engine/timeline";

describe("shipping engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultShippingEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.methods.length).toBeGreaterThanOrEqual(7);
    expect(doc.zones.some((z) => z.id === "uk" && z.enabled)).toBe(true);
    expect(doc.buyerProtection.integratesWithWallet).toBe(true);
  });

  it("registers all core shipping modules", () => {
    const ids = SHIPPING_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("manager");
    expect(ids).toContain("tracking");
    expect(ids).toContain("returns");
    expect(ids).toContain("labels");
  });

  it("defines full tracking engine stages", () => {
    expect(SHIPPING_ENGINE_TRACKING_STAGES.map((s) => s.id)).toContain("out-for-delivery");
    expect(SHIPPING_ENGINE_TRACKING_STAGES.map((s) => s.id)).toContain("delivery-confirmed");
  });

  it("prepares future carrier architecture", () => {
    expect(FUTURE_CARRIER_IDS).toContain("Royal Mail");
    expect(FUTURE_CARRIER_IDS).toContain("ROVEXO Shipping");
    expect(FUTURE_CARRIER_IDS).toContain("Amazon Shipping");
  });

  it("builds carrier-independent timeline from order status", () => {
    const timeline = buildShippingTimeline({
      orderStatus: "shipped",
      shipmentStatus: "in_transit",
      createdAt: "2026-06-01T00:00:00Z",
      paidAt: "2026-06-01T01:00:00Z",
      shippedAt: "2026-06-02T00:00:00Z",
    });
    expect(timeline.some((e) => e.id === "in-transit" && e.current)).toBe(true);
    expect(timeline.find((e) => e.id === "order-created")?.done).toBe(true);
  });

  it("allows future module registration", () => {
    const next = registerShippingEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "📦",
      description: "Future module",
      href: "/shipping",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});
