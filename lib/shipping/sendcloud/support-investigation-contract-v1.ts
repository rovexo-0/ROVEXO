/**
 * Sendcloud Support investigation — preparation contract only.
 *
 * SENDCLOUD_SUPPORT_INTEGRATION_ENABLED is FALSE until Owner confirms
 * Support API entitlement for ROVEXO / broker 38704 / hermes_c2c_gb.
 *
 * Compatibility for broker 38704 is UNKNOWN. Do not claim it.
 * This module never calls Sendcloud, Evri, or Stripe.
 */

export const SENDCLOUD_SUPPORT_INTEGRATION_ENABLED = false as const;

export const SENDCLOUD_SUPPORT_TRANSPORT = "sendcloudV3Request" as const;

export const SENDCLOUD_SUPPORT_PATHS = {
  lostTicket: "/dsf/tickets/lost",
  damageTicket: "/dsf/tickets/damage",
  getTicket: "/dsf/tickets/{id}",
  uploadFile: "/dsf/files",
} as const;

export const SENDCLOUD_SUPPORT_FINANCIAL = {
  carrierDependentCompensation: true,
  rovexoPlatformGuarantee: false,
  compensationPayoutApi: false,
  inventedCoverageForbidden: true,
  inventedSignatureForbidden: true,
  inventedPayoutForbidden: true,
  forbiddenCompensationSources: [
    "orders.total",
    "total_order_value",
    "declared_value_gbp_fallback_50",
  ] as const,
} as const;

export const SELLER_INVESTIGATION_COPY = {
  preparing: "ROVEXO is preparing the carrier investigation.",
  opened: "Carrier investigation opened.",
  inProgress: "Carrier investigation in progress.",
  actionRequired: "Additional information required.",
  resolved: "Carrier investigation resolved.",
  compensationSubjectToTerms:
    "Carrier compensation is subject to the carrier's applicable terms.",
} as const;

export type RovexoCarrierTicketState =
  | "WAITING_FOR_CARRIER"
  | "CARRIER_INVESTIGATION_OPEN"
  | "CARRIER_ACTION_REQUIRED"
  | "CARRIER_RESOLVED";

export type SendcloudTicketStatusExample =
  | "waiting_for_carrier"
  | "in_progress"
  | "action_required"
  | "solved"
  | "claim_paid";

export type EvidenceAvailability = "MAPPED" | "PARTIAL" | "MISSING_REQUIRED_EVIDENCE";

export type LostTicketFieldKey =
  | "tracking_number"
  | "contents_sales_price"
  | "contents_description"
  | "parcel_exterior_description"
  | "parcel_dimensions"
  | "additional_remarks"
  | "sales_invoice"
  | "purchase_invoice"
  | "customer_confirmation"
  | "carrier_claim_form";

export type DamageTicketFieldKey =
  | LostTicketFieldKey
  | "exterior_photo"
  | "interior_photo"
  | "damage_photo_1"
  | "damage_photo_2"
  | "package_photo"
  | "entire_product_photo";

export type MappedEvidenceField = {
  field: string;
  availability: EvidenceAvailability;
  rovexoSource: string | null;
  uiRequestIfMissing: boolean;
};

/** Fields ROVEXO may already hold. Never invent missing values. */
export type RovexoAvailableInvestigationEvidence = {
  trackingNumber?: string | null;
  listingTitle?: string | null;
  listingDescription?: string | null;
  listingOrItemPriceGbp?: number | null;
  parcelLengthCm?: number | null;
  parcelWidthCm?: number | null;
  parcelHeightCm?: number | null;
  labelPdfUrl?: string | null;
  unclassifiedEvidenceUrls?: readonly string[] | null;
};

export type VerifiedCarrierResolution = {
  amount?: number | null;
  currency?: string | null;
  outcome?: string | null;
};

export type ConceptualCarrierClaimPatch = {
  provider: "sendcloud";
  external_reference: string;
  status: RovexoCarrierTicketState | "UNMAPPED";
  metadata: {
    ticket_type: "lost" | "damage";
    stage: string | null;
    requested_actions: unknown;
    resolution: VerifiedCarrierResolution | null;
  };
  amount_approved: number | null;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

function hasPositiveMoney(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function field(
  key: string,
  availability: EvidenceAvailability,
  rovexoSource: string | null,
): MappedEvidenceField {
  return {
    field: key,
    availability,
    rovexoSource,
    uiRequestIfMissing: availability !== "MAPPED",
  };
}

export function mapLostTicketEvidence(
  available: RovexoAvailableInvestigationEvidence,
): MappedEvidenceField[] {
  const description = hasText(available.listingTitle) || hasText(available.listingDescription);
  const dimensions =
    typeof available.parcelLengthCm === "number" ||
    typeof available.parcelWidthCm === "number" ||
    typeof available.parcelHeightCm === "number";

  return [
    field(
      "tracking_number",
      hasText(available.trackingNumber) ? "MAPPED" : "MISSING_REQUIRED_EVIDENCE",
      hasText(available.trackingNumber) ? "shipment_tracking.tracking_number" : null,
    ),
    field(
      "contents_sales_price",
      hasPositiveMoney(available.listingOrItemPriceGbp)
        ? "MAPPED"
        : "MISSING_REQUIRED_EVIDENCE",
      hasPositiveMoney(available.listingOrItemPriceGbp)
        ? "listing_or_item_price"
        : null,
    ),
    field(
      "contents_description",
      description ? "MAPPED" : "MISSING_REQUIRED_EVIDENCE",
      description ? "listing.title_or_description" : null,
    ),
    field("parcel_exterior_description", "MISSING_REQUIRED_EVIDENCE", null),
    field(
      "parcel_dimensions",
      dimensions ? "PARTIAL" : "MISSING_REQUIRED_EVIDENCE",
      dimensions ? "parcel_size_partial" : null,
    ),
    field("additional_remarks", "MISSING_REQUIRED_EVIDENCE", null),
    field("sales_invoice", "MISSING_REQUIRED_EVIDENCE", null),
    field("purchase_invoice", "MISSING_REQUIRED_EVIDENCE", null),
    field("customer_confirmation", "MISSING_REQUIRED_EVIDENCE", null),
    field("carrier_claim_form", "MISSING_REQUIRED_EVIDENCE", null),
  ];
}

export function mapDamageTicketEvidence(
  available: RovexoAvailableInvestigationEvidence,
): MappedEvidenceField[] {
  const unclassified = (available.unclassifiedEvidenceUrls ?? []).some((url) => hasText(url));
  const photoAvailability: EvidenceAvailability = unclassified
    ? "PARTIAL"
    : "MISSING_REQUIRED_EVIDENCE";
  const photoSource = unclassified
    ? "protection_evidence.file_url_unclassified"
    : null;

  return [
    ...mapLostTicketEvidence(available).filter((row) => row.field !== "carrier_claim_form"),
    field("exterior_photo", photoAvailability, photoSource),
    field("interior_photo", photoAvailability, photoSource),
    field("damage_photo_1", photoAvailability, photoSource),
    field("damage_photo_2", photoAvailability, photoSource),
    field("package_photo", photoAvailability, photoSource),
    field("entire_product_photo", photoAvailability, photoSource),
  ];
}

export const DSF_FILE_PIPELINE = {
  executable: false,
  steps: [
    "rovexo_file_url",
    "sendcloud_dsf_upload",
    "file_token",
    "ticket_payload",
  ] as const,
  path: SENDCLOUD_SUPPORT_PATHS.uploadFile,
} as const;

export function mapSendcloudTicketStatusToRovexo(
  status: string | null | undefined,
): RovexoCarrierTicketState | "UNMAPPED" {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "waiting_for_carrier") return "WAITING_FOR_CARRIER";
  if (normalized === "in_progress") return "CARRIER_INVESTIGATION_OPEN";
  if (normalized === "action_required") return "CARRIER_ACTION_REQUIRED";
  if (normalized === "solved" || normalized === "claim_paid") return "CARRIER_RESOLVED";
  return "UNMAPPED";
}

export function waitingForCarrierMeansInvestigationPendingOnly(
  state: RovexoCarrierTicketState,
): boolean {
  return state === "WAITING_FOR_CARRIER";
}

export function actionRequiredBlocksFinalResolution(
  state: RovexoCarrierTicketState | string,
): boolean {
  return state === "CARRIER_ACTION_REQUIRED";
}

export function canStartFinalResolutionProcessing(
  state: RovexoCarrierTicketState | string,
): boolean {
  return state === "CARRIER_RESOLVED";
}

export function compensationAmountFromVerifiedResolution(
  resolution: VerifiedCarrierResolution | null | undefined,
): number | null {
  if (!resolution) return null;
  if (typeof resolution.amount !== "number" || !Number.isFinite(resolution.amount)) {
    return null;
  }
  if (resolution.amount < 0) return null;
  return resolution.amount;
}

export function conceptualCarrierClaimFromOfficialTicket(input: {
  ticketId: string;
  ticketType: "lost" | "damage";
  status?: string | null;
  stage?: string | null;
  requestedActions?: unknown;
  resolution?: VerifiedCarrierResolution | null;
}): ConceptualCarrierClaimPatch | { ok: false; code: "NO_OFFICIAL_TICKET_ID" } {
  const ticketId = input.ticketId.trim();
  if (!ticketId) {
    return { ok: false, code: "NO_OFFICIAL_TICKET_ID" };
  }
  const mapped = mapSendcloudTicketStatusToRovexo(input.status);
  return {
    provider: "sendcloud",
    external_reference: ticketId,
    status: mapped,
    metadata: {
      ticket_type: input.ticketType,
      stage: input.stage ?? null,
      requested_actions: input.requestedActions ?? null,
      resolution: input.resolution ?? null,
    },
    amount_approved: compensationAmountFromVerifiedResolution(input.resolution),
  };
}

export function sellerInvestigationCopy(input: {
  state:
    | "POSSIBLY_LOST"
    | "WAITING_FOR_CARRIER"
    | "CARRIER_INVESTIGATION_OPEN"
    | "CARRIER_ACTION_REQUIRED"
    | "CARRIER_RESOLVED"
    | "CARRIER_CONFIRMED_LOST";
  hasOfficialTicketId?: boolean;
}): string {
  switch (input.state) {
    case "CARRIER_ACTION_REQUIRED":
      return SELLER_INVESTIGATION_COPY.actionRequired;
    case "CARRIER_RESOLVED":
      return SELLER_INVESTIGATION_COPY.resolved;
    case "CARRIER_INVESTIGATION_OPEN":
      return input.hasOfficialTicketId
        ? SELLER_INVESTIGATION_COPY.opened
        : SELLER_INVESTIGATION_COPY.inProgress;
    case "CARRIER_CONFIRMED_LOST":
    case "POSSIBLY_LOST":
    case "WAITING_FOR_CARRIER":
    default:
      return input.hasOfficialTicketId
        ? SELLER_INVESTIGATION_COPY.opened
        : SELLER_INVESTIGATION_COPY.preparing;
  }
}

export function isForbiddenCompensationSource(source: string): boolean {
  return (SENDCLOUD_SUPPORT_FINANCIAL.forbiddenCompensationSources as readonly string[]).includes(
    source,
  );
}
