import { describe, expect, it } from "vitest";
import {
  UK_CARRIERS,
  allCarrierNames,
  estimateDeliveryDate,
  isValidTrackingNumber,
  shipmentStatusLabel,
} from "@/lib/shipping/carriers";

describe("UK shipping carriers", () => {
  it("includes all required UK carriers", () => {
    const names = allCarrierNames();
    for (const carrier of ["Royal Mail", "Evri", "DPD", "UPS", "FedEx", "Parcelforce", "InPost"]) {
      expect(names).toContain(carrier);
    }
  });

  it("validates Royal Mail tracking numbers", () => {
    expect(isValidTrackingNumber("Royal Mail", "AB123456789GB")).toBe(true);
    expect(isValidTrackingNumber("Royal Mail", "abc")).toBe(false);
  });

  it("estimates delivery dates", () => {
    const date = estimateDeliveryDate("DPD", 1, new Date("2026-06-01T00:00:00Z"));
    expect(date.getTime()).toBeGreaterThan(new Date("2026-06-01T00:00:00Z").getTime());
  });

  it("labels shipment statuses", () => {
    expect(shipmentStatusLabel("in_transit")).toBe("In transit");
  });

  it("defines typical delivery windows for each carrier", () => {
    expect(UK_CARRIERS.length).toBe(7);
    expect(UK_CARRIERS.every((carrier) => carrier.trackingSupported)).toBe(true);
  });
});
