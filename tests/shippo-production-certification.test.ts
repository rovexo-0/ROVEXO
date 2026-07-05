import { describe, expect, it } from "vitest";
import { runShippoProductionCertification } from "@/lib/shipping/shippo/certification";

describe("Shippo Production Certification — Official Phase 6", () => {
  const report = runShippoProductionCertification();

  it("runs all 16 certification steps", () => {
    expect(report.steps).toHaveLength(16);
    expect(report.milestone).toBe("SHIPPO PRODUCTION CERTIFICATION");
    expect(report.engineeringStatus).toBe("FROZEN");
    expect(report.architecture).toBe("LOCKED");
    expect(report.version).toBe("1.0.0");
  });

  it("achieves ≥95% score with zero critical blockers", () => {
    expect(report.score).toBeGreaterThanOrEqual(95);
    const criticalBlockers = report.blockers.filter(
      (b) =>
        !b.includes("Live token configured") &&
        !b.includes("Webhook token configured"),
    );
    expect(criticalBlockers).toEqual([]);
    expect(report.pass).toBe(true);
  });

  it("passes Live API wiring", () => {
    expect(report.steps.find((s) => s.id === "live-api")?.pass).toBe(true);
  });

  it("passes shipping quotes, rates, labels, and shipments", () => {
    for (const id of [
      "shipping-quotes",
      "shipping-rates",
      "label-generation",
      "shipment-creation",
    ] as const) {
      expect(report.steps.find((s) => s.id === id)?.pass).toBe(true);
    }
  });

  it("passes tracking and webhook wiring", () => {
    expect(report.steps.find((s) => s.id === "tracking-updates")?.pass).toBe(true);
    expect(report.steps.find((s) => s.id === "tracking-webhooks")?.pass).toBe(true);
    expect(report.steps.find((s) => s.id === "live-webhooks")?.checks.filter((c) => c.id !== "runtime-webhook").every((c) => c.pass)).toBe(true);
  });

  it("passes buyer checkout, seller, business, and order lifecycle", () => {
    for (const id of [
      "buyer-checkout",
      "seller-shipping",
      "business-shipping",
      "order-lifecycle",
    ] as const) {
      expect(report.steps.find((s) => s.id === id)?.pass).toBe(true);
    }
  });

  it("passes carrier communication and production monitoring", () => {
    expect(report.steps.find((s) => s.id === "carrier-communication")?.pass).toBe(true);
    expect(report.steps.find((s) => s.id === "production-monitoring")?.pass).toBe(true);
  });

  it("passes Final Certification Gate", () => {
    expect(report.steps.find((s) => s.id === "final")?.pass).toBe(true);
  });

  it("defines next release phases", () => {
    expect(report.nextPhase).toContain("Real User Production E2E");
    expect(report.nextPhase).toContain("Official Public Launch");
  });
});
