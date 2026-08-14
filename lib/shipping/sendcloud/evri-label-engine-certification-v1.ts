/**
 * ROVEXO — EVRi (Sendcloud hermes_c2c_gb) label engine certification lock.
 *
 * Audited against live Sendcloud V2 methods + V3 compat + route-aware
 * POST /shipping-options for GB→GB small_parcel 2kg / 45×10×10.
 *
 * EVRi is the first certified carrier baseline. Do not force InPost/Royal Mail
 * through these codes — carrier-specific rules stay carrier-scoped.
 */

export const EVRI_LABEL_ENGINE_CERTIFICATION_V1 = {
  version: "1.0",
  carrierDisplayName: "Evri",
  sendcloudCarrierCode: "hermes_c2c_gb",
  /** Canonical domestic address→address C2C option (route-proven). */
  canonicalShippingOptionCode: "hermes_c2c_gb:a2a/pickup",
  /** Sendcloud broker (bulk) contract returned by route-aware catalog. */
  canonicalContractId: "38704",
  /** Example V2 method id for 1–2kg Address to Address band. */
  canonicalV2MethodId: 3650,
  /** Alternate drop-off product — same broker contract. */
  shopToAddressShippingOptionCode: "hermes_c2c_gb:s2a/dropoff",
  /** Catalog requirements.fields for a2a/pickup — empty (no mandatory phone/email). */
  catalogRequiredFields: [] as const,
  servicePointRequired: false,
  directContractOnly: false,
  /**
   * Broker announce must transmit the route-proven contract_id.
   * Omitting it lets Sendcloud fall back to a different default contract.
   */
  announceRequiresContractId: true,
  /**
   * Unlike InPost GB, EVRi does not require InPost-style recipient phone
   * normalization or sender-phone omission (catalog fields empty; keep generic).
   */
  inpostPhoneRulesApply: false,
} as const;

export function isEvriSendcloudShippingOptionCode(
  shippingOptionCode: string | null | undefined,
): boolean {
  const code = shippingOptionCode?.trim().toLowerCase() ?? "";
  return code.startsWith("hermes_c2c_gb:") || code.startsWith("evri:");
}
