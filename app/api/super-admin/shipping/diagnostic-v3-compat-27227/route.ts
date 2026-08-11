/**
 * Super Admin read-only forensic: RVX8343A7C7 / method 27227 → V3 compat mapping.
 * Calls POST /compat/shipping-options via fetchSendcloudV3CompatMappingsForMethodIds only.
 * No shipment/parcel/label/DB write. Safe mapping fields only — never raw secrets.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import { fetchSendcloudV3CompatMappingsForMethodIds } from "@/lib/shipping/sendcloud/v3-catalog-v1";
import {
  SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1,
  buildSendcloudV3Compat27227BlockedReport,
  classifySendcloudV3Compat27227Mapping,
} from "@/lib/shipping/sendcloud/v3-compat-option-27227-diagnostic-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK = SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1;
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
    const blocked = buildSendcloudV3Compat27227BlockedReport();
    return NextResponse.json(
      {
        ok: false,
        v2MethodId: METHOD_ID,
        legacyQuoteId: LOCK.legacyQuoteId,
        compatHttpStatus: null,
        mapping: blocked.mapping,
        classification: blocked.classification,
        confirmedShippingOptionCode: null,
        error: "Sendcloud is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    const mappings = await fetchSendcloudV3CompatMappingsForMethodIds([METHOD_ID]);
    const mapping = mappings.get(METHOD_ID);
    const report = classifySendcloudV3Compat27227Mapping(mapping);

    console.info("[super-admin/shipping/diagnostic-v3-compat-27227]", {
      actorUserId: auth.user.id,
      orderNumber: LOCK.orderNumber,
      v2MethodId: METHOD_ID,
      path: LOCK.path,
      classification: report.classification,
      hasConfirmedCode: Boolean(report.confirmedShippingOptionCode),
      timestamp: new Date().toISOString(),
    });

    const body = {
      ok: report.classification === "V3_EXACT_COUNTERPART_FOUND",
      v2MethodId: report.v2MethodId,
      legacyQuoteId: report.legacyQuoteId,
      compatHttpStatus: 200,
      mapping: report.mapping,
      classification: report.classification,
      ...(report.confirmedShippingOptionCode
        ? { confirmedShippingOptionCode: report.confirmedShippingOptionCode }
        : { confirmedShippingOptionCode: null }),
    };

    if (report.classification === "V3_EXACT_COUNTERPART_FOUND") {
      return NextResponse.json(body);
    }

    return NextResponse.json(
      {
        ...body,
        error:
          report.classification === "V3_AMBIGUOUS"
            ? "V3_AMBIGUOUS: Sendcloud returned ambiguous V3 counterparts for method 27227. No code selected."
            : "V3_NO_COUNTERPART: Sendcloud returned no V3 shipping_option_code for method 27227.",
      },
      { status: 422 },
    );
  } catch (error) {
    const blocked = buildSendcloudV3Compat27227BlockedReport();
    const statusCode = isSendcloudError(error) ? error.statusCode : undefined;
    const message = isSendcloudError(error)
      ? error.message
      : "Unable to query Sendcloud V3 compat for method 27227.";

    console.info("[super-admin/shipping/diagnostic-v3-compat-27227]", {
      actorUserId: auth.user.id,
      orderNumber: LOCK.orderNumber,
      v2MethodId: METHOD_ID,
      ok: false,
      classification: blocked.classification,
      errorCode: isSendcloudError(error) ? error.code : "unknown",
      timestamp: new Date().toISOString(),
    });

    const httpStatus =
      typeof statusCode === "number" && statusCode >= 400 && statusCode < 600
        ? statusCode === 404
          ? 404
          : statusCode === 422
            ? 422
            : 502
        : 502;

    return NextResponse.json(
      {
        ok: false,
        v2MethodId: METHOD_ID,
        legacyQuoteId: LOCK.legacyQuoteId,
        compatHttpStatus: typeof statusCode === "number" ? statusCode : null,
        mapping: blocked.mapping,
        classification: blocked.classification,
        confirmedShippingOptionCode: null,
        error: message,
      },
      { status: httpStatus },
    );
  }
}
