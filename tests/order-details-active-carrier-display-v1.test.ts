/**
 * Order Details current-active carrier display.
 * No DB mutation · no Sendcloud · no Stripe · no RVX8343A7C7 hardcode in production.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  extractActiveOrderDisplayCarriers,
  normalizeOrderDisplayCarrier,
  resolveOrderDisplayCarrier,
} from "@/lib/orders/resolve-order-display-carrier-v1";
import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

function parcel(
  overrides: Partial<ShipmentParcel> &
    Pick<ShipmentParcel, "id" | "parcelNumber" | "carrier" | "status">,
): ShipmentParcel {
  return {
    shippingRecordId: "ship-1",
    totalParcels: 2,
    weightKg: 1,
    dimensions: null,
    shippingService: null,
    trackingNumber: null,
    trackingUrl: null,
    productItemIds: ["prod-1"],
    insuranceEnabled: false,
    insuranceValueGbp: null,
    operation: null,
    estimatedDeliveryAt: null,
    label: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const historicalInPost = parcel({
  id: "parcel-4",
  parcelNumber: 4,
  carrier: "InPost",
  status: "failed",
  trackingNumber: null,
  label: { id: "label-4", pdfUrl: null, labelUrl: null, status: "void" },
});

const recoveredRoyalMail = parcel({
  id: "parcel-5",
  parcelNumber: 5,
  carrier: "Royal Mail",
  status: "preparing",
  trackingNumber: "MZ539415387GB",
  shippingService: "royal_mailv2:tracked_48/size=s",
  label: {
    id: "label-5",
    pdfUrl: "/labels/royal-mail.pdf",
    labelUrl: "/labels/royal-mail.pdf",
    status: "ready",
  },
  providerParcelId: 700205671,
});

describe("carrier mapping", () => {
  it("royal_mailv2 → Royal Mail · hermes_c2c_gb → Evri · inpost_gb → InPost", () => {
    expect(normalizeOrderDisplayCarrier("royal_mailv2")).toBe("Royal Mail");
    expect(normalizeOrderDisplayCarrier("Royal Mail")).toBe("Royal Mail");
    expect(normalizeOrderDisplayCarrier("hermes_c2c_gb")).toBe("Evri");
    expect(normalizeOrderDisplayCarrier("Evri")).toBe("Evri");
    expect(normalizeOrderDisplayCarrier("inpost")).toBe("InPost");
    expect(normalizeOrderDisplayCarrier("inpost_gb")).toBe("InPost");
    expect(normalizeOrderDisplayCarrier("InPost")).toBe("InPost");
  });
});

describe("TEST 1 — normal Royal Mail order displays Royal Mail", () => {
  it("order carrier Royal Mail with no active override", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "Royal Mail",
        shippingRecordCarrier: null,
        activeLabelCarrier: null,
        activeParcelCarrier: null,
      }),
    ).toBe("Royal Mail");
  });
});

describe("TEST 2 — normal Evri order displays Evri", () => {
  it("order carrier Evri with no active override", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "Evri",
        shippingRecordCarrier: null,
        activeLabelCarrier: null,
        activeParcelCarrier: null,
      }),
    ).toBe("Evri");
  });
});

describe("TEST 3 — historical InPost with active Royal Mail recovery displays Royal Mail", () => {
  it("active parcel/label Royal Mail overrides InPost order carrier", () => {
    const active = extractActiveOrderDisplayCarriers([historicalInPost, recoveredRoyalMail]);
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "InPost",
        ...active,
      }),
    ).toBe("Royal Mail");
  });
});

describe("TEST 4 — historical InPost without active recovery displays InPost", () => {
  it("falls back to persisted order carrier", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "InPost",
        shippingRecordCarrier: null,
        activeLabelCarrier: null,
        activeParcelCarrier: null,
      }),
    ).toBe("InPost");
    expect(extractActiveOrderDisplayCarriers([historicalInPost])).toEqual({
      activeLabelCarrier: null,
      activeParcelCarrier: null,
      activeTrackingNumber: null,
    });
  });
});

describe("TEST 5 — active Royal Mail label overrides historical InPost", () => {
  it("label precedence wins", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "InPost",
        activeLabelCarrier: "royal_mailv2",
        activeParcelCarrier: "InPost",
      }),
    ).toBe("Royal Mail");
  });
});

describe("TEST 6 — active Evri label overrides historical carrier", () => {
  it("Evri label wins over InPost order + parcel", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "InPost",
        activeLabelCarrier: "hermes_c2c_gb",
        activeParcelCarrier: "InPost",
      }),
    ).toBe("Evri");
  });
});

describe("TEST 7 — missing active carrier must not silently default to Royal Mail", () => {
  it("empty / invalid carriers fail closed to empty string", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: null,
        shippingRecordCarrier: null,
        activeLabelCarrier: null,
        activeParcelCarrier: null,
      }),
    ).toBe("");
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "   ",
        shippingRecordCarrier: null,
        activeLabelCarrier: "sendcloud",
        activeParcelCarrier: "",
      }),
    ).toBe("");
    expect(normalizeOrderDisplayCarrier(undefined)).toBeNull();
    expect(normalizeOrderDisplayCarrier("sendcloud")).toBeNull();
  });
});

describe("TEST 8 — RVX8343A7C7 recovery display regression", () => {
  it("displays Royal Mail while preserving historical InPost parcel 4 and Royal Mail parcel 5", () => {
    const parcels = [historicalInPost, recoveredRoyalMail];
    const active = extractActiveOrderDisplayCarriers(parcels);
    const displayed = resolveOrderDisplayCarrier({
      orderCarrier: "InPost",
      ...active,
    });

    expect(RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber).toBe("RVX8343A7C7");
    expect(displayed).toBe("Royal Mail");
    expect(parcels[0]?.carrier).toBe("InPost");
    expect(parcels[0]?.parcelNumber).toBe(4);
    expect(parcels[1]?.carrier).toBe("Royal Mail");
    expect(parcels[1]?.parcelNumber).toBe(5);
    expect(parcels[1]?.trackingNumber).toBe("MZ539415387GB");
    expect(parcels[1]?.providerParcelId).toBe(700205671);

    const resolver = readFileSync("lib/orders/resolve-order-display-carrier-v1.ts", "utf8");
    expect(resolver).not.toContain("RVX8343A7C7");
    expect(resolver).not.toContain("MZ539415387GB");
    expect(resolver).not.toMatch(/return ["']Royal Mail["']/);
  });
});

describe("Order Details wiring", () => {
  it("uses the reusable resolver and does not special-case the recovered order", () => {
    const detail = readFileSync("features/orders/components/OrderDetailView.tsx", "utf8");
    const hub = readFileSync("features/inbox/components/ConversationHub.tsx", "utf8");
    const labels = readFileSync("app/api/shipping/labels/route.ts", "utf8");
    expect(detail).toContain("resolveOrderDisplayCarrier");
    expect(detail).toContain("resolveOrderDisplayTracking");
    expect(detail).toContain("carrier={displayCarrier}");
    expect(detail).toContain("displayTrackingNumber={displayTracking}");
    // Current shipment extract must win over Hub label props.
    expect(detail).toContain(
      "activeLabelCarrier: extracted.activeLabelCarrier || activeLabelCarrier",
    );
    expect(detail).toContain(
      "activeParcelCarrier: extracted.activeParcelCarrier || activeParcelCarrier",
    );
    expect(detail).not.toContain(
      "activeLabelCarrier: activeLabelCarrier || extracted.activeLabelCarrier",
    );
    expect(detail).not.toContain("RVX8343A7C7");
    expect(hub).toContain("activeLabelCarrier={activeShippingLabel?.carrier ?? null}");
    expect(hub).not.toMatch(/order\?\.deliveryCarrier \|\|\s*"Royal Mail"/);
    expect(labels).toContain("selectCurrentOrderParcels");
    expect(labels).toContain("listShipmentParcelsForOrder");
  });
});

describe("recovered multi-carrier precedence + tracking identity", () => {
  const historicalEvri = parcel({
    id: "parcel-evri",
    parcelNumber: 1,
    carrier: "Evri",
    status: "failed",
    trackingNumber: "H01EVRIHIST",
    label: { id: "label-evri", pdfUrl: null, labelUrl: null, status: "void" },
  });
  const activeRoyalMail = parcel({
    id: "parcel-rm",
    parcelNumber: 2,
    carrier: "Royal Mail",
    status: "preparing",
    trackingNumber: "MZ111222333GB",
    label: {
      id: "label-rm",
      pdfUrl: "/labels/rm.pdf",
      labelUrl: "/labels/rm.pdf",
      status: "ready",
    },
    providerParcelId: 7001,
  });
  const historicalRoyalMail = parcel({
    id: "parcel-rm-old",
    parcelNumber: 1,
    carrier: "Royal Mail",
    status: "cancelled",
    trackingNumber: "GBOLDROYAL",
    label: { id: "label-rm-old", pdfUrl: null, labelUrl: null, status: "void" },
  });
  const activeEvri = parcel({
    id: "parcel-evri-new",
    parcelNumber: 2,
    carrier: "Evri",
    status: "preparing",
    trackingNumber: "H99EVRIACTIVE",
    label: {
      id: "label-evri-new",
      pdfUrl: "/labels/evri.pdf",
      labelUrl: "/labels/evri.pdf",
      status: "ready",
    },
    providerParcelId: 8001,
  });

  it("historical Evri + active Royal Mail displays Royal Mail tracking", () => {
    const active = extractActiveOrderDisplayCarriers([historicalEvri, activeRoyalMail]);
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "Evri",
        shippingRecordCarrier: "Evri",
        ...active,
      }),
    ).toBe("Royal Mail");
    expect(active.activeTrackingNumber).toBe("MZ111222333GB");
  });

  it("historical Royal Mail + active Evri displays Evri tracking", () => {
    const active = extractActiveOrderDisplayCarriers([historicalRoyalMail, activeEvri]);
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "Royal Mail",
        shippingRecordCarrier: "Royal Mail",
        ...active,
      }),
    ).toBe("Evri");
    expect(active.activeTrackingNumber).toBe("H99EVRIACTIVE");
  });

  it("cancelled historical parcel is not selected as active", () => {
    const active = extractActiveOrderDisplayCarriers([historicalRoyalMail]);
    expect(active.activeParcelCarrier).toBeNull();
    expect(active.activeTrackingNumber).toBeNull();
  });

  it("delivered historical does not overwrite a later live shipment", () => {
    const deliveredHistorical = parcel({
      id: "parcel-delivered",
      parcelNumber: 1,
      carrier: "Evri",
      status: "delivered",
      trackingNumber: "HDELIVERED1",
      providerParcelId: 1,
      label: {
        id: "label-delivered",
        pdfUrl: "/old.pdf",
        labelUrl: "/old.pdf",
        status: "ready",
      },
    });
    const recovered = parcel({
      id: "parcel-live",
      parcelNumber: 2,
      carrier: "Royal Mail",
      status: "preparing",
      trackingNumber: "MZLIVE999GB",
      providerParcelId: 2,
      label: {
        id: "label-live",
        pdfUrl: "/new.pdf",
        labelUrl: "/new.pdf",
        status: "ready",
      },
    });
    const active = extractActiveOrderDisplayCarriers([deliveredHistorical, recovered]);
    expect(active.activeParcelCarrier).toBe("Royal Mail");
    expect(active.activeTrackingNumber).toBe("MZLIVE999GB");
  });

  it("shipping_records carrier is used only when active parcel is missing", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "Evri",
        shippingRecordCarrier: "Royal Mail",
        activeLabelCarrier: null,
        activeParcelCarrier: null,
      }),
    ).toBe("Royal Mail");
  });
});
