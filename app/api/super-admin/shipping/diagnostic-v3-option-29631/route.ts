/**
 * Super Admin read-only forensic: RVXC75CA5BB / method 29631 → V3 shipping-options.
 * Calls POST /api/v3/shipping-options only — no shipment/parcel/label/DB write.
 * Returns safe candidate fields only — never raw authenticated Sendcloud payloads.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import { discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic } from "@/lib/shipping/sendcloud/client";
import { SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1 } from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK = SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1;
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
            error: "Only locked RVXC75CA5BB / methodId 29631 is allowed for this diagnostic.",
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
    const result = await discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic();
    const { forensic } = result;

    console.info("[super-admin/shipping/diagnostic-v3-option-29631]", {
      actorUserId: auth.user.id,
      orderNumber: LOCK.orderNumber,
      methodId: METHOD_ID,
      path: result.requestUrlPath,
      result: forensic.result,
      exactMatchCount: forensic.exactMatchCount,
      exactMatchReason: forensic.exactMatchReason,
      mappingConfirmed: forensic.mappingConfirmed,
      candidateCount: forensic.candidateCount,
      hasShippingOptionCode: Boolean(forensic.shippingOptionCode),
      timestamp: new Date().toISOString(),
    });

    const base = {
      methodId: METHOD_ID,
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      quoteId: LOCK.quoteId,
      candidateCount: forensic.candidateCount,
      candidates: forensic.candidates,
      exactMatchCount: forensic.exactMatchCount,
      exactMatchReason: forensic.exactMatchReason,
      mappingConfirmed: forensic.mappingConfirmed,
      result: forensic.result,
      shippingOptionCode: forensic.shippingOptionCode,
      contractId: forensic.contractId,
      // Explicit aliases retained for Owner forensic checklist
      SHIPPING_OPTION_CODE: forensic.shippingOptionCode,
      CONTRACT_ID: forensic.contractId,
      CANDIDATE_COUNT: forensic.candidateCount,
      EXACT_MATCH_COUNT: forensic.exactMatchCount,
      EXACT_MATCH_REASON: forensic.exactMatchReason,
      MAPPING_CONFIRMED: forensic.mappingConfirmed,
      RESULT: forensic.result,
    };

    if (forensic.result === "MAPPING_CONFIRMED" && forensic.shippingOptionCode) {
      return NextResponse.json({
        ok: true,
        ...base,
      });
    }

    const error =
      forensic.result === "NO_V3_COUNTERPART"
        ? forensic.exactMatchReason === "EXACT_MATCH_MISSING_SHIPPING_OPTION_CODE"
          ? "Exact Royal Mail Tracked 48 - Large Letter found without shipping_option_code. NO_V3_COUNTERPART. No code guessed."
          : "No exact Royal Mail Tracked 48 - Large Letter V3 counterpart. NO_V3_COUNTERPART. No code guessed."
        : "Multiple exact Royal Mail Tracked 48 - Large Letter candidates. AMBIGUOUS_EXACT_MATCHES. No code selected.";

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
      : "Unable to discover V3 shipping option for RVXC75CA5BB.";

    console.info("[super-admin/shipping/diagnostic-v3-option-29631]", {
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
        candidateCount: 0,
        candidates: [],
        exactMatchCount: 0,
        exactMatchReason: "NO_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER",
        mappingConfirmed: false,
        result: "NO_V3_COUNTERPART",
        shippingOptionCode: null,
        contractId: null,
        SHIPPING_OPTION_CODE: null,
        CONTRACT_ID: null,
        CANDIDATE_COUNT: 0,
        EXACT_MATCH_COUNT: 0,
        EXACT_MATCH_REASON: "NO_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER",
        MAPPING_CONFIRMED: false,
        RESULT: "NO_V3_COUNTERPART",
        error: message,
      },
      { status },
    );
  }
}
