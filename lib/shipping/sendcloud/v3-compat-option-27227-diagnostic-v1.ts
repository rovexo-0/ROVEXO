/**
 * Locked Super Admin diagnostic SSOT:
 * RVX8343A7C7 / V2 method 27227 → read-only POST /compat/shipping-options.
 * Classification uses ONLY the canonical Sendcloud compat mapping.
 * Never guesses InPost / Royal Mail / Tracked substitutes.
 * No persistence. No shipment/parcel/label.
 */

import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";
import { isConfirmedSendcloudV3ShippingOptionCode } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import type { SendcloudV3MethodMapping } from "@/lib/shipping/sendcloud/v3-catalog-types-v1";

export const SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1 = {
  methodId: 27227,
  legacyQuoteId: "sendcloud:27227",
  orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
  orderNumber: RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
  /** Official V2→V3 compatibility endpoint (not catalog, not announce). */
  path: "/compat/shipping-options",
} as const;

export type SendcloudV3Compat27227Classification =
  | "V3_EXACT_COUNTERPART_FOUND"
  | "V3_NO_COUNTERPART"
  | "V3_AMBIGUOUS"
  | "DIAGNOSTIC_BLOCKED";

export type SendcloudV3Compat27227SafeMapping = {
  v2MethodId: typeof SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.methodId;
  shippingOptionCode: string | null;
  result: "MAPPING_CONFIRMED" | "NO_V3_COUNTERPART" | "AMBIGUOUS";
};

export type SendcloudV3Compat27227DiagnosticReport = {
  v2MethodId: typeof SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.methodId;
  legacyQuoteId: typeof SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.legacyQuoteId;
  mapping: SendcloudV3Compat27227SafeMapping;
  classification: SendcloudV3Compat27227Classification;
  confirmedShippingOptionCode: string | null;
};

/**
 * Classify ambiguous/exact/null from distinct confirmed V3 codes only.
 * Multiple confirmed codes → V3_AMBIGUOUS (never pick one).
 */
export function classifySendcloudV3Compat27227Codes(
  codes: Array<string | null | undefined>,
): SendcloudV3Compat27227DiagnosticReport {
  const methodId = SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.methodId;
  const confirmed = [
    ...new Set(
      codes
        .filter((c): c is string =>
          isConfirmedSendcloudV3ShippingOptionCode(c, methodId),
        )
        .map((c) => c.trim()),
    ),
  ];

  if (confirmed.length > 1) {
    return {
      v2MethodId: methodId,
      legacyQuoteId: SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.legacyQuoteId,
      mapping: {
        v2MethodId: methodId,
        shippingOptionCode: null,
        result: "AMBIGUOUS",
      },
      classification: "V3_AMBIGUOUS",
      confirmedShippingOptionCode: null,
    };
  }

  if (confirmed.length === 1) {
    const code = confirmed[0]!;
    return {
      v2MethodId: methodId,
      legacyQuoteId: SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.legacyQuoteId,
      mapping: {
        v2MethodId: methodId,
        shippingOptionCode: code,
        result: "MAPPING_CONFIRMED",
      },
      classification: "V3_EXACT_COUNTERPART_FOUND",
      confirmedShippingOptionCode: code,
    };
  }

  return {
    v2MethodId: methodId,
    legacyQuoteId: SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.legacyQuoteId,
    mapping: {
      v2MethodId: methodId,
      shippingOptionCode: null,
      result: "NO_V3_COUNTERPART",
    },
    classification: "V3_NO_COUNTERPART",
    confirmedShippingOptionCode: null,
  };
}

/**
 * Classify from the canonical Map entry returned by
 * fetchSendcloudV3CompatMappingsForMethodIds([27227]).
 */
export function classifySendcloudV3Compat27227Mapping(
  mapping: SendcloudV3MethodMapping | null | undefined,
): SendcloudV3Compat27227DiagnosticReport {
  const methodId = SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.methodId;
  const code =
    mapping && mapping.v2MethodId === methodId
      ? mapping.shippingOptionCode
      : null;
  return classifySendcloudV3Compat27227Codes([code]);
}

export function buildSendcloudV3Compat27227BlockedReport(): SendcloudV3Compat27227DiagnosticReport {
  const methodId = SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.methodId;
  return {
    v2MethodId: methodId,
    legacyQuoteId: SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.legacyQuoteId,
    mapping: {
      v2MethodId: methodId,
      shippingOptionCode: null,
      result: "NO_V3_COUNTERPART",
    },
    classification: "DIAGNOSTIC_BLOCKED",
    confirmedShippingOptionCode: null,
  };
}
