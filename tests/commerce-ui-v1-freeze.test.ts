import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("Canonical Commerce UI — Absolute Final", () => {
  it("Order Details uses Master Menu rows only", () => {
    const view = read("features/commerce-ui/views/OrderDetailsView.tsx");
    expect(view).toContain("sellerShipments");
    expect(view).toContain("CanonicalMenuRow");
    expect(view).toContain("Payment status");
    expect(view).toContain("Support");
    expect(view).not.toContain("ShipmentCard");
    expect(view).not.toContain("OrderPlacedBanner");
    expect(view).not.toMatch(/Label\s+\d/i);
  });

  it("Tracking uses seller-grouped parcels without help micro-cards", () => {
    const view = read("features/commerce-ui/views/TrackingView.tsx");
    const card = read("features/commerce-ui/components/ParcelTrackingCard.tsx");
    expect(view).toContain("sellerShipments");
    expect(view).toContain("ParcelTrackingCard");
    expect(view).not.toContain("NeedHelpCard");
    expect(card).toContain("Parcel ${parcel.index} of ${parcel.totalParcels}");
  });

  it("defines canonical eight-step shipment timeline", () => {
    const timeline = read("features/commerce-ui/lib/shipment-timeline.ts");
    expect(timeline).toContain("order_confirmed");
    expect(timeline).toContain("preparing_shipment");
    expect(timeline).toContain("labels_created");
    expect(timeline).toContain("collected");
    expect(timeline).toContain("in_transit");
    expect(timeline).toContain("out_for_delivery");
    expect(timeline).toContain("delivered");
    expect(timeline).toContain("returned");
  });

  it("parcel tracking is status/courier/updates only — no operations grid", () => {
    const card = read("features/commerce-ui/components/ParcelTrackingCard.tsx");
    expect(card).toContain("ParcelProductsList");
    expect(card).toContain("Courier");
    expect(card).not.toContain("ParcelOperations");
  });

  it("checkout totals exclude logistics detail", () => {
    const totals = read("features/commerce-ui/components/OrderSummaryTotals.tsx");
    expect(totals).toContain('label="Products"');
    expect(totals).toContain('label="Shipping"');
    expect(totals).toContain('label="Platform Fee"');
    expect(totals).not.toMatch(/Buyer Protection/i);
  });
});
