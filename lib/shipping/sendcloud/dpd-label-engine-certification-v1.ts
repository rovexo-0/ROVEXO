/**
 * ROVEXO — DPD UK (Sendcloud dpd_gb) label engine certification lock V1.
 *
 * Audited against live Sendcloud V2 methods + V3 compat + route-aware
 * POST /shipping-options for GB→GB Small Parcel band (Sendcloud-derived envelope) (2026-08-14).
 *
 * Reuses the canonical Sendcloud V3 Shipping Engine (EVRi / Royal Mail baseline).
 * Do NOT create a second DPD engine / client / label / tracking system.
 *
 * V1 scope: HOME DELIVERY only — Classic Next Day + Two Day dropoff.
 * Service Point (Ship to Shop) = OUT OF SCOPE (service_point_required).
 * Live announce / billable labels = BLOCKED_BY_BILLING_SAFETY.
 *
 * All codes/contracts below are route-proven from the connected catalog —
 * never invent identifiers.
 */

export const DPD_LABEL_ENGINE_CERTIFICATION_V1 = {
  version: "1.0",
  carrierDisplayName: "DPD",
  /** Exact Sendcloud carrier code in the connected environment. */
  sendcloudCarrierCode: "dpd_gb",
  sendcloudCarrierDisplayName: "DPD UK",
  /**
   * Canonical domestic Next Day Classic dropoff (route-proven).
   * V2 method 2902 → compat → exact route match.
   */
  nextDayClassic: {
    shippingOptionCode: "dpd_gb:classic",
    productCode: "dpd_gb:classic",
    serviceName: "DPD Next Day Delivery - Dropoff",
    v2MethodId: 2902,
    observedQuoteGbp: "7.82",
    lastMile: "home_delivery",
    firstMile: "dropoff",
  },
  /**
   * Canonical domestic Two Day Classic dropoff (route-proven).
   * V2 method 2901 → compat → exact route match.
   */
  twoDayClassic: {
    shippingOptionCode: "dpd_gb:classic/delivery_deadline=twodays",
    productCode: "dpd_gb:classic/twodays",
    serviceName: "DPD Two Day - Dropoff",
    v2MethodId: 2901,
    observedQuoteGbp: "7.82",
    lastMile: "home_delivery",
    firstMile: "dropoff",
  },
  /** Sendcloud broker (bulk) contract returned by route-aware catalog. */
  canonicalContractId: "19001",
  canonicalContractName: "Sendcloud broker (bulk)",
  catalogRequiredFields: [] as const,
  servicePointRequired: false,
  directContractOnly: false,
  sendcloudPrenegotiated: true,
  announceRequiresContractId: true,
  /**
   * Catalog weight / max_dimensions for dpd_gb:classic (+ two-day) on
   * certification route. Multicollo may be true on Next Day in catalog —
   * ROVEXO V1 remains single-parcel only.
   */
  parcelLimits: {
    maxWeightKg: "30.001",
    maxLengthCm: "100.00",
    maxWidthCm: "70.00",
    maxHeightCm: "60.00",
    maxDimensionSumCm: null as string | null,
  },
  returnsSupportedOnSelectedServices: false,
  /** Catalog reports multicollo=true on classic Next Day — not enabled in ROVEXO V1. */
  multicolloCatalog: true,
  multicolloEnabledInRovexoV1: false,
  requestedLabelMimeType: "application/pdf",
  /** Out of scope — service point required. */
  outOfScopeShippingOptionCodes: [
    "dpd_gb:classic/last_mile=service_point,kg",
  ] as const,
  /**
   * Non-billable technical certification only.
   * Live POST /shipments/announce is forbidden without Owner billable auth.
   */
  nonBillableLiveEvidence: {
    announceLiveTest: "BLOCKED_BY_BILLING_SAFETY" as const,
    billableLabelCreated: false,
    codePathCertified: true,
    liveLabelCertified: false,
  },
} as const;

export function isDpdSendcloudShippingOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return code.startsWith("dpd_gb:") || code.startsWith("dpd:");
}

/** V1 certified home-delivery Classic Next Day / Two Day only. */
export function isCertifiedDpdV1HomeDeliveryOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code === DPD_LABEL_ENGINE_CERTIFICATION_V1.nextDayClassic.shippingOptionCode ||
    code === DPD_LABEL_ENGINE_CERTIFICATION_V1.twoDayClassic.shippingOptionCode
  );
}

export function isDpdServicePointOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code.includes("service_point") ||
    code.includes("servicepoint") ||
    code.includes("ship_to_shop") ||
    code.includes("shiptoshop")
  );
}

/**
 * Hard billing-safety gate for DPD technical certification.
 * Always blocks live billable announce — there is no non-billable announce endpoint.
 */
export function assertDpdBillingSafetyBlocksLiveAnnounce(): {
  ANNOUNCE_LIVE_TEST: "BLOCKED_BY_BILLING_SAFETY";
  BILLABLE_LABEL_CREATED: false;
} {
  const evidence = DPD_LABEL_ENGINE_CERTIFICATION_V1.nonBillableLiveEvidence;
  if (evidence.billableLabelCreated !== false) {
    throw new Error("DPD_BILLING_SAFETY_VIOLATION: billableLabelCreated must be false");
  }
  if (evidence.announceLiveTest !== "BLOCKED_BY_BILLING_SAFETY") {
    throw new Error(
      "DPD_BILLING_SAFETY_VIOLATION: announceLiveTest must be BLOCKED_BY_BILLING_SAFETY",
    );
  }
  if (evidence.liveLabelCertified !== false) {
    throw new Error("DPD_BILLING_SAFETY_VIOLATION: liveLabelCertified must be false");
  }
  return {
    ANNOUNCE_LIVE_TEST: "BLOCKED_BY_BILLING_SAFETY",
    BILLABLE_LABEL_CREATED: false,
  };
}

/** Rejects JSON/HTML error bodies saved as fake PDFs (%PDF required). */
export function isValidDpdLabelPdfBytes(buffer: Uint8Array): boolean {
  if (buffer.byteLength < 5) return false;
  let head = "";
  for (let i = 0; i < Math.min(8, buffer.byteLength); i += 1) {
    head += String.fromCharCode(buffer[i]!);
  }
  if (!head.startsWith("%PDF")) return false;
  const sampleLen = Math.min(buffer.byteLength, 4096);
  let sample = "";
  for (let i = 0; i < sampleLen; i += 1) {
    sample += String.fromCharCode(buffer[i]!);
  }
  const trimmed = sample.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("<!")) return false;
  return true;
}
