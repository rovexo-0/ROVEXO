/**
 * ROVEXO — Royal Mail UK (Sendcloud royal_mailv2) label engine certification lock V1.
 *
 * Audited against live Sendcloud V2 methods + V3 compat + route-aware
 * POST /shipping-options for GB→GB Small Parcel band (Sendcloud size=s envelope).
 *
 * Reuses the canonical Sendcloud V3 Shipping Engine (EVRi baseline).
 * Do NOT create a second Royal Mail engine / client / label / tracking system.
 *
 * V1 scope: HOME DELIVERY only — Tracked 24 / Tracked 48 Small Parcel.
 * Service Point / Local Collect / locker flows = OUT OF SCOPE.
 * Returns = OUT OF SCOPE (catalog functionalities.returns = false for V1 options).
 */

export const ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1 = {
  version: "1.0",
  carrierDisplayName: "Royal Mail",
  /** Exact Sendcloud carrier code in the connected environment (not alias "royal_mail"). */
  sendcloudCarrierCode: "royal_mailv2",
  sendcloudCarrierDisplayName: "Royal Mail by Sendcloud",
  /**
   * Canonical domestic Tracked 24 Small Parcel (route-proven).
   * V2 method 29622 → compat → exact route match.
   */
  tracked24: {
    shippingOptionCode: "royal_mailv2:tracked_24/size=s",
    productCode: "royal_mailv2:tracked_24",
    serviceName: "Royal Mail Tracked 24 - Small Parcel",
    v2MethodId: 29622,
    /** Live V3 quote total for certification route (GBP) — not hardcoded into checkout. */
    observedQuoteGbp: "3.88",
  },
  /**
   * Canonical domestic Tracked 48 Small Parcel (route-proven).
   * V2 method 29632 → compat → exact route match.
   */
  tracked48: {
    shippingOptionCode: "royal_mailv2:tracked_48/size=s",
    productCode: "royal_mailv2:tracked_48",
    serviceName: "Royal Mail Tracked 48 - Small Parcel",
    v2MethodId: 29632,
    observedQuoteGbp: "3.04",
  },
  /** Sendcloud broker (transactional) contract returned by route-aware catalog. */
  canonicalContractId: "116816",
  canonicalContractName: "Royal Mail Transactional Contract",
  /** Catalog requirements.fields empty; SP not required for V1 home-delivery options. */
  catalogRequiredFields: [] as const,
  servicePointRequired: false,
  /** functionalities.direct_contract_only === false · contract type broker. */
  directContractOnly: false,
  sendcloudPrenegotiated: true,
  /**
   * Broker announce must transmit the route-proven contract_id.
   * Omitting it lets Sendcloud fall back to a different default contract.
   */
  announceRequiresContractId: true,
  /**
   * Small Parcel band limits from live V3 option weight / max_dimensions
   * for royal_mailv2:tracked_24|48/size=s (unit kg / cm).
   * MAX_DIMENSION_SUM not returned by Sendcloud for these options.
   */
  smallParcelLimits: {
    maxWeightKg: "2.001",
    maxLengthCm: "45.00",
    maxWidthCm: "35.00",
    maxHeightCm: "16.00",
    maxDimensionSumCm: null as string | null,
  },
  returnsSupportedOnSelectedServices: false,
  multicollo: false,
  /** Announce requests PDF; live label bytes not certified without Owner auth. */
  requestedLabelMimeType: "application/pdf",
  /** Out of scope product-code prefixes (do not certify / do not prefer in V1). */
  outOfScopeProductCodePrefixes: [
    "royal_mailv2:servicepoint24",
    "royal_mailv2:servicepoint48",
  ] as const,
  /**
   * Prior Owner-authorized live label attempt (2026-08-14):
   * billable announce was NEVER sent to Sendcloud — Cursor Smart Mode approval skipped.
   * Therefore there is no Sendcloud HTTP status / error code / payload to diagnose.
   * Classification: operational billing-safety gate — not A–G carrier defects.
   */
  previousLiveAnnounceFailure: {
    sendcloudRequestExecuted: false,
    endpointIntended: "POST /api/v3/shipments/announce",
    httpStatus: null,
    sendcloudErrorCode: null,
    sendcloudErrorMessage: null,
    shippingOptionCodeIntended: "royal_mailv2:tracked_24/size=s",
    contractIdIntended: "116816",
    rootCause:
      "BILLING_SAFETY_APPROVAL_SKIPPED_BEFORE_SENDCLOUD_ANNOUNCE",
    failureClass: "H_UNKNOWN_FROM_PROVIDER_POV_NOT_EXECUTED",
  },
  /**
   * Non-billable live catalog evidence (read-only POST /shipping-options +
   * /compat/shipping-options + GET /contracts). Never creates a shipment/label.
   */
  nonBillableLiveEvidence: {
    announceLiveTest: "BLOCKED_BY_BILLING_SAFETY",
    billableLabelCreated: false,
    codePathCertified: true,
    liveLabelCertified: false,
  },
} as const;

/** Rejects JSON/HTML error bodies saved as fake PDFs (%PDF required). */
export function isValidRoyalMailLabelPdfBytes(buffer: Uint8Array): boolean {
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

export function isRoyalMailSendcloudShippingOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code.startsWith("royal_mailv2:") ||
    code.startsWith("royal_mail:") ||
    code.startsWith("royalmail:")
  );
}

/** V1 certified home-delivery Tracked 24 / Tracked 48 Small Parcel only. */
export function isCertifiedRoyalMailV1HomeDeliveryOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code ===
      ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked24.shippingOptionCode ||
    code ===
      ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked48.shippingOptionCode
  );
}

export function isRoyalMailServicePointOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return (
    code.includes("servicepoint") ||
    code.includes("local_collect") ||
    code.includes("local-collect")
  );
}
