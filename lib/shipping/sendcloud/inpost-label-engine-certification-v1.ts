/**
 * ROVEXO — InPost GB (Sendcloud inpost_gb) label engine certification lock V1.
 *
 * Audited against live Sendcloud V2 methods + V3 compat + route-aware
 * POST /shipping-options for GB→GB small_parcel 2kg / 45×10×10 (2026-08-14).
 *
 * Reuses the canonical Sendcloud V3 Shipping Engine (EVRi / RM / DPD baseline).
 * Do NOT create a second InPost engine / client / label / tracking system.
 *
 * V1 certified scope: Locker→Address home delivery only
 *   (`inpost_gb:lockertoaddress/dropoff`).
 * Destination type = home delivery address (last_mile=home_delivery).
 * First mile = dropoff (seller drop-off) — NOT a destination locker ID in announce.
 *
 * Locker / PUDO / L2L / Address→Locker options require Service Point Engine
 * (Gate 0). Catalog-verified but OUT OF SCOPE until Gate 0 is certified ON.
 *
 * Live announce / billable labels = BLOCKED_BY_BILLING_SAFETY.
 * All codes/contracts below are route-proven — never invent identifiers.
 */

export const INPOST_LABEL_ENGINE_CERTIFICATION_V1 = {
  version: "1.0",
  carrierDisplayName: "InPost",
  /** Exact Sendcloud carrier code in the connected environment. */
  sendcloudCarrierCode: "inpost_gb",
  sendcloudCarrierDisplayName: "InPost GB",
  /**
   * Canonical domestic Locker→Address Two Day dropoff (route-proven).
   * V2 method 27227 → compat → exact route match.
   * Destination: buyer home address (not locker/PUDO).
   */
  lockerToAddress: {
    shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
    productCode: "inpost_gb:lockertoaddress",
    serviceName: "InPost Locker to Address Two Day",
    v2MethodId: 27227,
    observedQuoteGbp: "3.20",
    lastMile: "home_delivery",
    firstMile: "dropoff",
    servicePointRequired: false,
    /** Announce destination is postal address — not to_service_point. */
    destinationType: "home_address" as const,
  },
  /** Sendcloud broker (bulk) contract returned by route-aware catalog. */
  canonicalContractId: "40353",
  canonicalContractName: "Sendcloud broker (bulk)",
  catalogRequiredFields: [] as const,
  /**
   * Catalog fields empty, but Sendcloud InPost announcement requires recipient
   * UK mobile (engine-enforced). Sender phone must be omitted on announce.
   */
  recipientPhoneRequiredAtAnnounce: true,
  omitSenderPhoneOnAnnounce: true,
  servicePointRequired: false,
  directContractOnly: false,
  sendcloudPrenegotiated: true,
  announceRequiresContractId: true,
  parcelLimits: {
    maxWeightKg: "15.001",
    maxLengthCm: "64.00",
    maxWidthCm: "41.00",
    maxHeightCm: "38.00",
    maxDimensionSumCm: null as string | null,
  },
  returnsSupportedOnSelectedServices: false,
  multicollo: false,
  requestedLabelMimeType: "application/pdf",
  /**
   * Catalog-verified on same route but Service Point required —
   * OUT OF SCOPE while Gate 0 Service Point Engine is OFF.
   */
  outOfScopeUntilServicePointGate: [
    {
      shippingOptionCode: "inpost_gb:l2l/size=m",
      v2MethodId: 27222,
      servicePointRequired: true,
      lastMile: "locker_or_service_point",
      observedQuoteGbp: "3.35",
    },
    {
      shippingOptionCode: "inpost_gb:l2l/size=l",
      v2MethodId: 27223,
      servicePointRequired: true,
      lastMile: "locker_or_service_point",
      observedQuoteGbp: "4.62",
    },
    {
      shippingOptionCode: "inpost_gb:addresstolocker/pickup",
      v2MethodId: 3747,
      servicePointRequired: true,
      lastMile: "locker_or_service_point",
      observedQuoteGbp: "2.53",
    },
  ] as const,
  /**
   * Compat maps V2 27221 → inpost_gb:l2l/size=s, but that option was NOT
   * returned on the certification route for 2kg / 45×10×10 — do not invent
   * it as route-proven for this parcel band.
   */
  l2lSmallCompatOnlyNotRouteProvenOnCertParcel: {
    v2MethodId: 27221,
    compatShippingOptionCode: "inpost_gb:l2l/size=s",
    routeProvenOnCertParcel: false,
  },
  nonBillableLiveEvidence: {
    announceLiveTest: "BLOCKED_BY_BILLING_SAFETY" as const,
    billableLabelCreated: false,
    codePathCertified: true,
    liveLabelCertified: false,
  },
} as const;

export function isInpostSendcloudShippingOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return code.startsWith("inpost_gb:") || code.startsWith("inpost:");
}

export function isCertifiedInpostV1HomeDeliveryOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code ===
    INPOST_LABEL_ENGINE_CERTIFICATION_V1.lockerToAddress.shippingOptionCode
  );
}

export function isInpostServicePointOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code.includes("l2l/") ||
    code.includes("addresstolocker") ||
    code.includes("lockertolocker") ||
    (code.includes("locker") && !code.includes("lockertoaddress"))
  );
}

/**
 * Hard billing-safety gate for InPost technical certification.
 * Always blocks live billable announce — no non-billable announce endpoint.
 */
export function assertInpostBillingSafetyBlocksLiveAnnounce(): {
  ANNOUNCE_LIVE_TEST: "BLOCKED_BY_BILLING_SAFETY";
  BILLABLE_LABEL_CREATED: false;
} {
  const evidence = INPOST_LABEL_ENGINE_CERTIFICATION_V1.nonBillableLiveEvidence;
  if (evidence.billableLabelCreated !== false) {
    throw new Error("INPOST_BILLING_SAFETY_VIOLATION: billableLabelCreated must be false");
  }
  if (evidence.announceLiveTest !== "BLOCKED_BY_BILLING_SAFETY") {
    throw new Error(
      "INPOST_BILLING_SAFETY_VIOLATION: announceLiveTest must be BLOCKED_BY_BILLING_SAFETY",
    );
  }
  if (evidence.liveLabelCertified !== false) {
    throw new Error("INPOST_BILLING_SAFETY_VIOLATION: liveLabelCertified must be false");
  }
  return {
    ANNOUNCE_LIVE_TEST: "BLOCKED_BY_BILLING_SAFETY",
    BILLABLE_LABEL_CREATED: false,
  };
}

/** Rejects JSON/HTML error bodies saved as fake PDFs (%PDF required). */
export function isValidInpostLabelPdfBytes(buffer: Uint8Array): boolean {
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
