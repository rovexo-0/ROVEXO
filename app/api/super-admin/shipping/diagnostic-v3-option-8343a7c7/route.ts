/**
 * Super Admin read-only forensic: RVX8343A7C7 → V3 shipping-options route+parcel.
 * Calls POST /api/v3/shipping-options only — no shipment/parcel/label/DB write.
 * Returns safe candidate fields only — never raw authenticated Sendcloud payloads.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import { discoverSendcloudV3OptionForRvx8343a7c7Diagnostic } from "@/lib/shipping/sendcloud/client";
import { SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1 } from "@/lib/shipping/sendcloud/v3-option-8343a7c7-diagnostic-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK = SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1;
const METHOD_ID = LOCK.methodId;

/** Empty body or explicit locked order/method only — no arbitrary IDs. */
const optionalBodySchema = z
  .object({
    orderId: z.literal(LOCK.orderId).optional(),
    methodId: z.literal(METHOD_ID).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let raw: unknown = {};
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }
    if (raw !== null && typeof raw === "object" && Object.keys(raw as object).length > 0) {
      const parsed = optionalBodySchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: "Only locked RVX8343A7C7 / methodId 27227 is allowed for this diagnostic.",
          },
          { status: 400 },
        );
      }
    }
  }

  if (!isSendcloudConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        methodId: METHOD_ID,
        orderNumber: LOCK.orderNumber,
        error: "Sendcloud is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await discoverSendcloudV3OptionForRvx8343a7c7Diagnostic();
    const { forensic, routeContext } = result;

    console.info("[super-admin/shipping/diagnostic-v3-option-8343a7c7]", {
      actorUserId: auth.user.id,
      orderNumber: LOCK.orderNumber,
      methodId: METHOD_ID,
      path: result.requestUrlPath,
      result: forensic.result,
      exactMatchCount: forensic.exactMatchCount,
      exactMatchReason: forensic.exactMatchReason,
      matchingOptionFound: forensic.matchingOptionFound,
      failureClass: forensic.failureClass,
      candidateCount: forensic.candidateCount,
      hasShippingOptionCode: Boolean(forensic.shippingOptionCode),
      timestamp: new Date().toISOString(),
    });

    const base = {
      methodId: METHOD_ID,
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      quoteId: LOCK.quoteId,
      lockedShippingOptionCode: LOCK.lockedShippingOptionCode,
      FROM_COUNTRY_CODE: routeContext.from_country_code,
      TO_COUNTRY_CODE: routeContext.to_country_code,
      FROM_POSTAL_CODE: routeContext.from_postal_code,
      TO_POSTAL_CODE: routeContext.to_postal_code,
      PARCEL_WEIGHT: routeContext.parcel_weight,
      PARCEL_WEIGHT_UNIT: routeContext.parcel_weight_unit,
      PARCEL_LENGTH: routeContext.parcel_length,
      PARCEL_WIDTH: routeContext.parcel_width,
      PARCEL_HEIGHT: routeContext.parcel_height,
      PARCEL_DIMENSION_UNIT: routeContext.parcel_dimension_unit,
      LOCKED_OPTION: LOCK.lockedShippingOptionCode,
      AVAILABLE_OPTIONS: forensic.availableOptions,
      MATCHING_OPTION_FOUND: forensic.matchingOptionFound ? "YES" : "NO",
      MATCHING_OPTION_IDENTITY: forensic.matchingOptionIdentity,
      MATCHING_OPTION_DETAILS: forensic.matchingOptionDetails,
      CONTRACT_ID_IF_RETURNED: forensic.contractId,
      V3_OPTION_AVAILABLE_FOR_THIS_ROUTE: forensic.v3OptionAvailableForThisRoute,
      DIAGNOSTIC_REQUEST_EXECUTED: "YES" as const,
      READ_ONLY: "YES" as const,
      PERSIST_PERFORMED: "NO" as const,
      ANNOUNCE_CALLED: "NO" as const,
      LABEL_CREATED: "NO" as const,
      ORDER_MUTATED: "NO" as const,
      PAYMENT_MUTATED: "NO" as const,
      candidateCount: forensic.candidateCount,
      exactMatchCount: forensic.exactMatchCount,
      exactMatchReason: forensic.exactMatchReason,
      result: forensic.result,
      shippingOptionCode: forensic.shippingOptionCode,
      contractId: forensic.contractId,
      failureClass: forensic.failureClass,
      rootCause: forensic.rootCause,
      EXACT_FAILURE_CLASS: forensic.failureClass,
      ROOT_CAUSE: forensic.rootCause,
    };

    if (forensic.result === "LOCKED_OPTION_AVAILABLE") {
      return NextResponse.json({
        ok: true,
        ...base,
      });
    }

    const error =
      forensic.result === "CONTRACT_ID_REQUIRED_AND_MISSING"
        ? "Locked option returned but contract_id required and missing (class D)."
        : forensic.result === "AMBIGUOUS_EXACT_MATCHES"
          ? "Multiple rows share locked shipping_option_code. AMBIGUOUS_EXACT_MATCHES. No code selected."
          : "Locked shipping_option_code unavailable for this route/parcel context. No code guessed.";

    return NextResponse.json(
      {
        ok: false,
        ...base,
        error,
      },
      { status: 422 },
    );
  } catch (error) {
    const message = isSendcloudError(error)
      ? error.message
      : "Unable to discover V3 shipping option for RVX8343A7C7.";

    console.info("[super-admin/shipping/diagnostic-v3-option-8343a7c7]", {
      actorUserId: auth.user.id,
      orderNumber: LOCK.orderNumber,
      methodId: METHOD_ID,
      ok: false,
      errorCode: isSendcloudError(error) ? error.code : "unknown",
      timestamp: new Date().toISOString(),
    });

    const status =
      isSendcloudError(error) && error.statusCode === 404
        ? 404
        : isSendcloudError(error) && error.statusCode === 422
          ? 422
          : 502;

    return NextResponse.json(
      {
        ok: false,
        methodId: METHOD_ID,
        orderId: LOCK.orderId,
        orderNumber: LOCK.orderNumber,
        LOCKED_OPTION: LOCK.lockedShippingOptionCode,
        AVAILABLE_OPTIONS: [],
        MATCHING_OPTION_FOUND: "NO",
        MATCHING_OPTION_IDENTITY: null,
        MATCHING_OPTION_DETAILS: null,
        CONTRACT_ID_IF_RETURNED: null,
        V3_OPTION_AVAILABLE_FOR_THIS_ROUTE: "UNKNOWN",
        DIAGNOSTIC_REQUEST_EXECUTED: "NO",
        READ_ONLY: "YES",
        PERSIST_PERFORMED: "NO",
        ANNOUNCE_CALLED: "NO",
        LABEL_CREATED: "NO",
        ORDER_MUTATED: "NO",
        PAYMENT_MUTATED: "NO",
        EXACT_FAILURE_CLASS: "NOT_PROVABLE_FROM_DIAGNOSTIC",
        ROOT_CAUSE: "NOT_PROVABLE_FROM_DIAGNOSTIC",
        failureClass: "NOT_PROVABLE_FROM_DIAGNOSTIC",
        rootCause: "NOT_PROVABLE_FROM_DIAGNOSTIC",
        candidateCount: 0,
        exactMatchCount: 0,
        shippingOptionCode: null,
        contractId: null,
        error: message,
      },
      { status },
    );
  }
}
