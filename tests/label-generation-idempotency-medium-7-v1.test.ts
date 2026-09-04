/**
 * MEDIUM #7 — Duplicate Shipment / Label Protection.
 * Auto-aligned to current shipping exports.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  LABEL_GENERATION_IDEMPOTENCY_V1,
  buildLabelGenerationIdempotencyKey,
  decideLabelGenerationClaim,
  hasReusableProviderParcelId,
  hasUsableReadyLabelArtifact,
  isHistoricalFailedParcelSafeFromActiveSelection,
  isRecoveryParcelAttemptAuthorized,
  mayCreateNewProviderParcelAttempt,
  selectActiveParcelForLabelProtection,
} from "@/lib/shipping/label-generation-idempotency-v1";
import {
  isEligibleForNewLabel,
  isFailedHistoricalParcel,
  resolveShipmentParcelForLabel,
} from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import {
  SHIPPING_RECORDS_SSOT_V1,
  SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY,
} from "@/lib/shipping/shipping-records-ssot-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const RECORD = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function makeParcel(
  overrides: Partial<ShipmentParcel> & Pick<ShipmentParcel, "id" | "parcelNumber" | "status">,
): ShipmentParcel {
  return {
    shippingRecordId: RECORD,
    totalParcels: overrides.totalParcels ?? 1,
    weightKg: 1.2,
    dimensions: { lengthCm: 30, widthCm: 20, heightCm: 10 },
    carrier: null,
    shippingService: null,
    trackingNumber: null,
    trackingUrl: null,
    productItemIds: [],
    insuranceEnabled: false,
    insuranceValueGbp: null,
    operation: null,
    estimatedDeliveryAt: null,
    label: null,
    providerParcelId: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

const PREPARING_1 = makeParcel({ id: "parcel-preparing-1", parcelNumber: 1, status: "preparing" });
const READY_1 = makeParcel({
  id: "parcel-ready-1",
  parcelNumber: 1,
  status: "collected",
  trackingNumber: "RX123456789GB",
  label: { id: "label-1", pdfUrl: "https://cdn.test/label.pdf", labelUrl: "https://cdn.test/label.pdf", status: "ready" },
  providerParcelId: 9001,
});
const FAILED_HISTORICAL = makeParcel({
  id: "parcel-failed-4",
  parcelNumber: 4,
  status: "collected",
  trackingNumber: null,
  label: null,
  providerParcelId: null,
  carrier: "Evri",
});
const PROVIDER_ONLY = makeParcel({
  id: "parcel-provider-2",
  parcelNumber: 2,
  status: "preparing",
  providerParcelId: 4242,
});

describe("MEDIUM #7 — label generation idempotency helpers", () => {
  it("declares SSOT + single-active equation", () => {
    expect(LABEL_GENERATION_IDEMPOTENCY_V1.ssot).toBe("shipping_records");
    expect(LABEL_GENERATION_IDEMPOTENCY_V1.legacyReadOnly).toBe("order_shipments");
    expect(LABEL_GENERATION_IDEMPOTENCY_V1.recoveryNewParcel).toBe("explicit_authorize_only");
    expect(SHIPPING_RECORDS_SSOT_V1.writeAuthority).toBe("shipping_records");
    expect(SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY.insert).toBe("forbidden");
  });

  it("1 — first label: empty parcels → create path", () => {
    expect(resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [],
    })).toEqual({ status: "create" });
  });

  it("2 — repeated identical request: ready label reused", () => {
    expect(hasUsableReadyLabelArtifact({ label: READY_1.label, trackingNumber: READY_1.trackingNumber })).toBe(true);
    expect(mayCreateNewProviderParcelAttempt({ parcel: READY_1, existingProviderParcelId: READY_1.providerParcelId })).toBe(false);
    expect(decideLabelGenerationClaim({
      labelStatus: "ready",
      trackingNumber: "RX123456789GB",
      pdfUrl: "https://cdn.test/label.pdf",
      providerParcelId: 9001,
      claimedByThisRequest: false,
    })).toEqual({ action: "return_ready", reason: "ready_label" });
  });

  it("3 — concurrent claims: peer pending without provider → wait_in_flight", () => {
    expect(decideLabelGenerationClaim({
      labelStatus: "pending", trackingNumber: null, pdfUrl: null, providerParcelId: null, claimedByThisRequest: false,
    })).toEqual({ action: "wait_in_flight", reason: "claim_held_by_peer" });
    expect(decideLabelGenerationClaim({
      labelStatus: "pending", trackingNumber: null, pdfUrl: null, providerParcelId: null, claimedByThisRequest: true,
    })).toEqual({ action: "proceed", reason: "claimed" });
  });

  it("4 — retry after timeout: existing provider parcel forces reuse", () => {
    expect(hasReusableProviderParcelId(4242)).toBe(true);
    expect(mayCreateNewProviderParcelAttempt({ parcel: PREPARING_1, existingProviderParcelId: 4242 })).toBe(false);
    expect(decideLabelGenerationClaim({
      labelStatus: "pending", trackingNumber: null, pdfUrl: null, providerParcelId: 4242, claimedByThisRequest: false,
    })).toEqual({ action: "reuse_provider", reason: "provider_parcel_exists", providerParcelId: 4242 });
  });

  it("5 — provider returns existing parcel → reuse", () => {
    expect(mayCreateNewProviderParcelAttempt({ parcel: PROVIDER_ONLY, existingProviderParcelId: PROVIDER_ONLY.providerParcelId })).toBe(false);
  });

  it("6 — failed/void attempt → reclaim proceed; preparing stays eligible", () => {
    expect(decideLabelGenerationClaim({
      labelStatus: "void", trackingNumber: null, pdfUrl: null, providerParcelId: null, claimedByThisRequest: false,
    })).toEqual({ action: "proceed", reason: "stale_pending_reclaimed" });
    expect(isEligibleForNewLabel(PREPARING_1)).toBe(true);
    expect(mayCreateNewProviderParcelAttempt({ parcel: PREPARING_1, existingProviderParcelId: null })).toBe(true);
  });

  it("7 — recovery: new parcel only when explicitly authorized", () => {
    expect(isRecoveryParcelAttemptAuthorized(undefined)).toBe(false);
    expect(isRecoveryParcelAttemptAuthorized(false)).toBe(false);
    expect(isRecoveryParcelAttemptAuthorized(true)).toBe(true);
  });

  it("8 — recovered multi-carrier: active parcel remains ready/announced", () => {
    const active = selectActiveParcelForLabelProtection([FAILED_HISTORICAL, READY_1]);
    expect(active?.id).toBe(READY_1.id);
    expect(resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [FAILED_HISTORICAL, READY_1],
    })).toEqual({ status: "use", parcel: READY_1 });
  });

  it("9 — historical failed parcel never selected as active label", () => {
    expect(isFailedHistoricalParcel(FAILED_HISTORICAL)).toBe(true);
    expect(isEligibleForNewLabel(FAILED_HISTORICAL)).toBe(false);
    expect(resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [FAILED_HISTORICAL],
    }).status).toBe("reject");
    const active = selectActiveParcelForLabelProtection([FAILED_HISTORICAL, PREPARING_1]);
    expect(isHistoricalFailedParcelSafeFromActiveSelection(FAILED_HISTORICAL, active)).toBe(true);
    expect(active?.id).toBe(PREPARING_1.id);
  });

  it("idempotency key is stable per order+parcel", () => {
    expect(buildLabelGenerationIdempotencyKey("order-1", 1)).toBe("rovexo-order-order-1-parcel-1");
    expect(buildLabelGenerationIdempotencyKey("order-1", 1)).toBe(buildLabelGenerationIdempotencyKey("order-1", 1));
  });
});

describe("MEDIUM #7 — source contracts (SSOT / legacy / claim wiring)", () => {
  it("10 — legacy order_shipments: no insert/update writers in shipping lib", () => {
    for (const file of [
      "lib/shipping/label-generation.server.ts",
      "lib/shipping/store.ts",
      "lib/shipping/parcels-repository.ts",
      "lib/shipping/service.ts",
    ]) {
      const src = read(file);
      const writeRe = /\.from\(\s*["']order_shipments["']\s*\)[\s\S]{0,220}?\.((insert)|(update)|(upsert))\s*\(/g;
      expect(writeRe.test(src), `${file} must not write order_shipments`).toBe(false);
    }
  });

  it("11 — shipping_records remains sole write SSOT + claim uses shipping_labels_v1", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const parcelsSrc = read("lib/shipping/parcels-repository.ts");
    expect(labelGen).toContain("claimLabelGenerationAttempt");
    expect(labelGen).toContain("buildLabelGenerationIdempotencyKey");
    expect(labelGen).toContain("MEDIUM #7");
    expect(parcelsSrc).toContain("claimLabelGenerationAttempt");
    expect(parcelsSrc).toContain('from("shipping_labels_v1")');
    expect(parcelsSrc).toContain("isUniqueViolation");
    expect(parcelsSrc).toContain("authorizeRecoveryParcelAttempt: true");
    expect(SHIPPING_RECORDS_SSOT_V1.canonicalTable).toBe("shipping_records");
  });

  it("12 — buyer/provider shipping costs unchanged by MEDIUM #7 claim wiring", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("persistShippingRecordProviderCostPence");
    expect(labelGen).not.toMatch(/\.from\(\s*["']orders["']\s*\)[\s\S]{0,200}?delivery_fee\s*:/);
    expect(labelGen).toContain("MEDIUM #7 — claim before Sendcloud announce (DB unique on shipment_parcel_id).");
    const claimIdx = labelGen.indexOf("MEDIUM #7 — claim before Sendcloud announce (DB unique on shipment_parcel_id).");
    const claimBlock = labelGen.slice(claimIdx, claimIdx + 2000);
    expect(claimBlock).not.toContain("pricePence");
    expect(claimBlock).not.toContain("delivery_fee");
  });

  it("label path still skips MEDIUM #6 gates when reusable provider parcel exists", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("hasReusableProviderParcel");
    expect(labelGen).toContain("existingProviderParcelId");
  });
});
