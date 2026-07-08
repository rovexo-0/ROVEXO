import { describe, expect, it } from "vitest";

import { formatGBP } from "@/features/commerce-ui/lib/format";
import { parcelStatusMeta } from "@/features/commerce-ui/lib/status";
import { MOCK_PARCELS, MOCK_TOTALS } from "@/features/commerce-ui/mock/ui-lock-mock";

describe("commerce-ui — format", () => {
  it("formats GBP with two decimal places", () => {
    expect(formatGBP(628.86)).toBe("£628.86");
  });
});

describe("commerce-ui — parcel status", () => {
  it('uses "Parcel X of Y" labels, never "Label"', () => {
    for (const parcel of MOCK_PARCELS) {
      const meta = parcelStatusMeta(parcel.status);
      expect(meta.label).not.toMatch(/label/i);
      expect(parcel.index).toBeGreaterThan(0);
      expect(parcel.totalParcels).toBeGreaterThanOrEqual(parcel.index);
    }
  });

  it("maps preparing status to Preparing Shipment", () => {
    expect(parcelStatusMeta("preparing").label).toBe("Preparing Shipment");
  });
});

describe("commerce-ui — checkout totals", () => {
  it("includes only products, shipping, platform fee and total", () => {
    expect(MOCK_TOTALS.products + MOCK_TOTALS.shipping + MOCK_TOTALS.platformFee).toBeCloseTo(
      MOCK_TOTALS.total,
      2,
    );
  });
});
