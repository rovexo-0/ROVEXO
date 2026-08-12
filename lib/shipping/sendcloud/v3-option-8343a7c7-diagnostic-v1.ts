/**
 * Locked Super Admin diagnostic SSOT:
 * RVX8343A7C7 → read-only V3 POST /shipping-options route+parcel forensic.
 * Exact match only by locked shipping_option_code (never invents substitutes).
 * No persistence. No shipment/parcel/label/announce.
 */

import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";
import {
  parseSendcloudV3ShippingOptionCandidates,
  type SendcloudV3ShippingOptionCandidate,
} from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";

export const SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1 = {
  methodId: 27227,
  quoteId: "sendcloud:27227",
  orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
  orderNumber: RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
  /** Official current V3 catalog endpoint (not compat, not announce). */
  path: "/shipping-options",
  absolutePathHint: "/api/v3/shipping-options",
  /** P6.2 locked V3 identity — availability is what this diagnostic proves. */
  lockedShippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
} as const;

export type SendcloudV3Option8343SafeCandidate = {
  shipping_option_code: string | null;
  carrier: string | null;
  carrier_code: string | null;
  service_name: string | null;
  product_name: string | null;
  product_code: string | null;
  contract_id: string | null;
  contract_name: string | null;
  quote_price: string | null;
  currency: string | null;
  requirements: { direct_contract_only?: boolean } | null;
};

export type SendcloudV3Option8343ExactMatchReason =
  | "EXACT_LOCKED_SHIPPING_OPTION_CODE"
  | "NO_EXACT_LOCKED_SHIPPING_OPTION_CODE"
  | "MULTIPLE_EXACT_LOCKED_SHIPPING_OPTION_CODE"
  | "EXACT_MATCH_MISSING_SHIPPING_OPTION_CODE";

export type SendcloudV3Option8343ForensicResult =
  | "LOCKED_OPTION_AVAILABLE"
  | "LOCKED_OPTION_UNAVAILABLE_FOR_ROUTE_PARCEL"
  | "AMBIGUOUS_EXACT_MATCHES"
  | "CONTRACT_ID_REQUIRED_AND_MISSING";

export type SendcloudV3Option8343FailureClass =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "NOT_PROVABLE_FROM_DIAGNOSTIC";

export type SendcloudV3Option8343ForensicReport = {
  methodId: typeof SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1.methodId;
  lockedShippingOptionCode: typeof SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1.lockedShippingOptionCode;
  candidateCount: number;
  availableOptions: SendcloudV3Option8343SafeCandidate[];
  matchingOptionFound: boolean;
  matchingOptionIdentity: string | null;
  matchingOptionDetails: SendcloudV3Option8343SafeCandidate | null;
  exactMatchCount: number;
  exactMatchReason: SendcloudV3Option8343ExactMatchReason;
  result: SendcloudV3Option8343ForensicResult;
  shippingOptionCode: string | null;
  contractId: string | null;
  v3OptionAvailableForThisRoute: "YES" | "NO" | "UNKNOWN";
  failureClass: SendcloudV3Option8343FailureClass;
  rootCause: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function safeRequirements(
  requirements: unknown,
): { direct_contract_only?: boolean } | null {
  const req = asRecord(requirements);
  if (!req || !("direct_contract_only" in req)) return null;
  if (typeof req.direct_contract_only !== "boolean") return null;
  return { direct_contract_only: req.direct_contract_only };
}

export function toSafe8343Candidate(
  candidate: SendcloudV3ShippingOptionCandidate,
): SendcloudV3Option8343SafeCandidate {
  return {
    shipping_option_code: candidate.code,
    carrier: candidate.carrier_name ?? candidate.carrier_code,
    carrier_code: candidate.carrier_code,
    service_name: candidate.name,
    product_name: candidate.product_name,
    product_code: candidate.product_code,
    contract_id: candidate.contract_id,
    contract_name: candidate.contract_name,
    quote_price: candidate.quote_price,
    currency: candidate.currency,
    requirements: safeRequirements(candidate.requirements),
  };
}

/** Exact identity match only — never infer from name/product. */
export function isExactLocked8343ShippingOption(
  candidate: SendcloudV3ShippingOptionCandidate,
): boolean {
  return (
    candidate.code?.trim() ===
    SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1.lockedShippingOptionCode
  );
}

/**
 * Forensic report for RVX8343A7C7 locked option vs route/parcel catalog.
 * Never invents or selects a replacement shipping_option_code.
 */
export function buildV3Option8343a7c7ForensicReport(
  body: unknown,
): SendcloudV3Option8343ForensicReport {
  const lock = SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1;
  const all = parseSendcloudV3ShippingOptionCandidates(body);
  const availableOptions = all.map(toSafe8343Candidate);
  const exact = all.filter(isExactLocked8343ShippingOption);

  let exactMatchReason: SendcloudV3Option8343ExactMatchReason;
  let result: SendcloudV3Option8343ForensicResult;
  let shippingOptionCode: string | null = null;
  let contractId: string | null = null;
  let matchingOptionDetails: SendcloudV3Option8343SafeCandidate | null = null;
  let matchingOptionFound = false;
  let v3OptionAvailableForThisRoute: "YES" | "NO" | "UNKNOWN" = "UNKNOWN";
  let failureClass: SendcloudV3Option8343FailureClass = "NOT_PROVABLE_FROM_DIAGNOSTIC";
  let rootCause = "NOT_PROVABLE_FROM_DIAGNOSTIC";

  if (exact.length === 0) {
    exactMatchReason = "NO_EXACT_LOCKED_SHIPPING_OPTION_CODE";
    result = "LOCKED_OPTION_UNAVAILABLE_FOR_ROUTE_PARCEL";
    matchingOptionFound = false;
    v3OptionAvailableForThisRoute = "NO";
    failureClass = "B";
    rootCause =
      "Locked shipping_option_code not present in V3 shipping-options for this from/to/parcel context.";
  } else if (exact.length > 1) {
    exactMatchReason = "MULTIPLE_EXACT_LOCKED_SHIPPING_OPTION_CODE";
    result = "AMBIGUOUS_EXACT_MATCHES";
    matchingOptionFound = true;
    matchingOptionDetails = toSafe8343Candidate(exact[0]!);
    v3OptionAvailableForThisRoute = "UNKNOWN";
    failureClass = "E";
    rootCause =
      "Multiple catalog rows share the locked shipping_option_code; identity ambiguous for announce.";
  } else if (!exact[0]?.code) {
    exactMatchReason = "EXACT_MATCH_MISSING_SHIPPING_OPTION_CODE";
    result = "LOCKED_OPTION_UNAVAILABLE_FOR_ROUTE_PARCEL";
    matchingOptionFound = false;
    v3OptionAvailableForThisRoute = "NO";
    failureClass = "E";
    rootCause =
      "Catalog row matched locked identity shape but shipping_option_code was empty.";
  } else {
    const hit = exact[0]!;
    const safe = toSafe8343Candidate(hit);
    exactMatchReason = "EXACT_LOCKED_SHIPPING_OPTION_CODE";
    matchingOptionFound = true;
    matchingOptionDetails = safe;
    shippingOptionCode = hit.code;
    contractId = hit.contract_id;

    const directOnly = safe.requirements?.direct_contract_only === true;
    if (directOnly && !hit.contract_id) {
      result = "CONTRACT_ID_REQUIRED_AND_MISSING";
      v3OptionAvailableForThisRoute = "UNKNOWN";
      failureClass = "D";
      rootCause =
        "Locked option returned for this route/parcel but requirements.direct_contract_only=true and contract_id is missing.";
    } else {
      result = "LOCKED_OPTION_AVAILABLE";
      v3OptionAvailableForThisRoute = "YES";
      failureClass = "A";
      rootCause =
        "Locked shipping_option_code is present in V3 shipping-options for this from/to/parcel context.";
    }
  }

  return {
    methodId: lock.methodId,
    lockedShippingOptionCode: lock.lockedShippingOptionCode,
    candidateCount: availableOptions.length,
    availableOptions,
    matchingOptionFound,
    matchingOptionIdentity: matchingOptionFound
      ? lock.lockedShippingOptionCode
      : null,
    matchingOptionDetails,
    exactMatchCount: exact.length,
    exactMatchReason,
    result,
    shippingOptionCode:
      result === "LOCKED_OPTION_AVAILABLE" || result === "CONTRACT_ID_REQUIRED_AND_MISSING"
        ? shippingOptionCode
        : null,
    contractId:
      result === "LOCKED_OPTION_AVAILABLE" || result === "CONTRACT_ID_REQUIRED_AND_MISSING"
        ? contractId
        : null,
    v3OptionAvailableForThisRoute,
    failureClass,
    rootCause,
  };
}
