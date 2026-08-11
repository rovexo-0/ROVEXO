/**
 * Locked Super Admin diagnostic SSOT:
 * RVXC75CA5BB / method 29631 → read-only V3 POST /shipping-options forensic.
 * Exact match only selects Royal Mail Tracked 48 - Large Letter.
 * Forensic candidates list Royal Mail options safely — never guesses a code.
 * No persistence. No shipment/parcel/label.
 */

import { RVXC75CA5BB_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvxc75ca5bb-orphan-shipping-repair-v1";

export const SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1 = {
  methodId: 29631,
  quoteId: "sendcloud:29631",
  orderId: RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId,
  orderNumber: RVXC75CA5BB_ORPHAN_REPAIR_V1.orderNumber,
  /** Official current V3 catalog endpoint (not compat). */
  path: "/shipping-options",
  absolutePathHint: "/api/v3/shipping-options",
  targetServiceName: "Royal Mail Tracked 48 - Large Letter",
  targetCarrierCode: "royal_mail",
} as const;

/** @deprecated Alias kept for import stability during diagnostic evolution. */
export const SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1 =
  SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1;

export type SendcloudV3ShippingOptionCandidate = {
  code: string | null;
  carrier_code: string | null;
  carrier_name: string | null;
  product_code: string | null;
  product_name: string | null;
  name: string | null;
  contract_id: string | null;
  contract_name: string | null;
  quote_price: string | null;
  currency: string | null;
  requirements: unknown;
};

export type SendcloudV3CandidateForensicClass =
  | "exact_tracked_48_large_letter"
  | "tracked_48_without_large_letter"
  | "tracked_24"
  | "other_royal_mail"
  | "non_royal_mail";

export type SendcloudV3SafeForensicCandidate = {
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
  forensic_class: SendcloudV3CandidateForensicClass;
  /** Safe whitelist only — never dump arbitrary provider payloads. */
  requirements: { direct_contract_only?: boolean } | null;
};

export type SendcloudV3ExactMatchReason =
  | "EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER"
  | "NO_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER"
  | "MULTIPLE_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER"
  | "EXACT_MATCH_MISSING_SHIPPING_OPTION_CODE";

export type SendcloudV3OptionForensicResult =
  | "MAPPING_CONFIRMED"
  | "NO_V3_COUNTERPART"
  | "AMBIGUOUS_EXACT_MATCHES";

export type SendcloudV3Option29631ForensicReport = {
  methodId: typeof SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1.methodId;
  candidateCount: number;
  candidates: SendcloudV3SafeForensicCandidate[];
  exactMatchCount: number;
  exactMatchReason: SendcloudV3ExactMatchReason;
  mappingConfirmed: boolean;
  result: SendcloudV3OptionForensicResult;
  shippingOptionCode: string | null;
  contractId: string | null;
};

/** @deprecated Prefer forensic report; retained for legacy match helpers/tests. */
export type SendcloudV3Tracked48LargeLetterMatch = {
  royalMailTracked48Match: boolean;
  candidateCount: number;
  shippingOptionCode: string | null;
  contractId: string | null;
  contractRequired: "YES" | "NO" | "UNKNOWN";
  candidates: SendcloudV3ShippingOptionCandidate[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function candidateHaystack(candidate: SendcloudV3ShippingOptionCandidate): string {
  return [candidate.name, candidate.product_name, candidate.code]
    .filter(Boolean)
    .map((x) => normalizeName(String(x)))
    .join(" | ");
}

export function isRoyalMailCandidate(candidate: SendcloudV3ShippingOptionCandidate): boolean {
  return (
    normalizeName(candidate.carrier_code ?? "") ===
      SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1.targetCarrierCode ||
    normalizeName(candidate.carrier_name ?? "").includes("royal mail")
  );
}

export function parseSendcloudV3ShippingOptionCandidates(
  body: unknown,
): SendcloudV3ShippingOptionCandidate[] {
  const root = asRecord(body);
  const data = Array.isArray(root?.data)
    ? (root!.data as unknown[])
    : Array.isArray(body)
      ? body
      : [];

  const candidates: SendcloudV3ShippingOptionCandidate[] = [];
  for (const item of data) {
    const o = asRecord(item);
    if (!o) continue;
    const carrier = asRecord(o.carrier);
    const product = asRecord(o.product);
    const contract = asRecord(o.contract);
    const quotes = Array.isArray(o.quotes) ? o.quotes : [];
    const firstQuote = asRecord(quotes[0]);
    const priceObj = asRecord(firstQuote?.price) ?? asRecord(o.price);

    candidates.push({
      code: str(o.code),
      name: str(o.name),
      carrier_code: str(carrier?.code),
      carrier_name: str(carrier?.name),
      product_code: str(product?.code),
      product_name: str(product?.name),
      contract_id: str(contract?.id),
      contract_name: str(contract?.name),
      quote_price: str(priceObj?.value) ?? str(firstQuote?.price),
      currency: str(priceObj?.currency) ?? str(firstQuote?.currency),
      requirements: o.requirements ?? null,
    });
  }
  return candidates;
}

/**
 * Exact match only: Royal Mail + Tracked 48 + Large Letter.
 * Rejects Tracked 24 and other Royal Mail substitutes.
 */
export function isExactRoyalMailTracked48LargeLetter(
  candidate: SendcloudV3ShippingOptionCandidate,
): boolean {
  if (!isRoyalMailCandidate(candidate)) return false;

  const hay = candidateHaystack(candidate);
  if (/\btracked\s*24\b/.test(hay)) return false;
  const hasTracked48 = /\btracked\s*48\b/.test(hay);
  const hasLargeLetter = /\blarge\s*letter\b/.test(hay);
  return hasTracked48 && hasLargeLetter;
}

export function classifyRoyalMailForensicCandidate(
  candidate: SendcloudV3ShippingOptionCandidate,
): SendcloudV3CandidateForensicClass {
  if (!isRoyalMailCandidate(candidate)) return "non_royal_mail";
  if (isExactRoyalMailTracked48LargeLetter(candidate)) {
    return "exact_tracked_48_large_letter";
  }
  const hay = candidateHaystack(candidate);
  if (/\btracked\s*24\b/.test(hay)) return "tracked_24";
  if (/\btracked\s*48\b/.test(hay) && !/\blarge\s*letter\b/.test(hay)) {
    return "tracked_48_without_large_letter";
  }
  return "other_royal_mail";
}

function safeRequirements(
  requirements: unknown,
): { direct_contract_only?: boolean } | null {
  const req = asRecord(requirements);
  if (!req || !("direct_contract_only" in req)) return null;
  if (typeof req.direct_contract_only !== "boolean") return null;
  return { direct_contract_only: req.direct_contract_only };
}

export function toSafeForensicCandidate(
  candidate: SendcloudV3ShippingOptionCandidate,
): SendcloudV3SafeForensicCandidate {
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
    forensic_class: classifyRoyalMailForensicCandidate(candidate),
    requirements: safeRequirements(candidate.requirements),
  };
}

/**
 * Forensic report for method 29631.
 * Lists Royal Mail catalog candidates safely. Never invents/selects substitutes.
 */
export function buildV3Option29631ForensicReport(
  body: unknown,
): SendcloudV3Option29631ForensicReport {
  const all = parseSendcloudV3ShippingOptionCandidates(body);
  const royalMail = all.filter(isRoyalMailCandidate);
  const exact = royalMail.filter(isExactRoyalMailTracked48LargeLetter);

  let exactMatchReason: SendcloudV3ExactMatchReason;
  let mappingConfirmed = false;
  let result: SendcloudV3OptionForensicResult;
  let shippingOptionCode: string | null = null;
  let contractId: string | null = null;

  if (exact.length === 0) {
    exactMatchReason = "NO_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER";
    result = "NO_V3_COUNTERPART";
  } else if (exact.length > 1) {
    exactMatchReason = "MULTIPLE_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER";
    result = "AMBIGUOUS_EXACT_MATCHES";
  } else if (!exact[0]?.code) {
    exactMatchReason = "EXACT_MATCH_MISSING_SHIPPING_OPTION_CODE";
    result = "NO_V3_COUNTERPART";
  } else {
    exactMatchReason = "EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER";
    mappingConfirmed = true;
    result = "MAPPING_CONFIRMED";
    shippingOptionCode = exact[0]!.code;
    contractId = exact[0]!.contract_id;
  }

  return {
    methodId: SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1.methodId,
    candidateCount: royalMail.length,
    candidates: royalMail.map(toSafeForensicCandidate),
    exactMatchCount: exact.length,
    exactMatchReason,
    mappingConfirmed,
    result,
    shippingOptionCode: mappingConfirmed ? shippingOptionCode : null,
    contractId: mappingConfirmed ? contractId : null,
  };
}

function resolveContractRequired(
  requirements: unknown,
): "YES" | "NO" | "UNKNOWN" {
  const safe = safeRequirements(requirements);
  if (!safe || typeof safe.direct_contract_only !== "boolean") return "UNKNOWN";
  return safe.direct_contract_only ? "YES" : "NO";
}

/**
 * Select exact Tracked 48 Large Letter candidates from a V3 shipping-options body.
 * Never invents codes. Zero or multiple exact matches → no single code.
 */
export function matchRoyalMailTracked48LargeLetter(
  body: unknown,
): SendcloudV3Tracked48LargeLetterMatch {
  const report = buildV3Option29631ForensicReport(body);
  const exact = parseSendcloudV3ShippingOptionCandidates(body).filter(
    isExactRoyalMailTracked48LargeLetter,
  );

  if (report.mappingConfirmed && report.shippingOptionCode) {
    const hit = exact.find((c) => c.code === report.shippingOptionCode) ?? exact[0]!;
    return {
      royalMailTracked48Match: true,
      candidateCount: report.exactMatchCount,
      shippingOptionCode: report.shippingOptionCode,
      contractId: report.contractId,
      contractRequired: resolveContractRequired(hit.requirements),
      candidates: exact,
    };
  }

  return {
    royalMailTracked48Match: false,
    candidateCount: report.exactMatchCount,
    shippingOptionCode: null,
    contractId: null,
    contractRequired: "UNKNOWN",
    candidates: exact,
  };
}
