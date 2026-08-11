/**
 * Super Admin read-only diagnostic: V2 method 29631 → V3 shipping_option_code.
 * Calls POST /api/v3/compat/shipping-options only — no shipment/parcel/label/DB write.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import { lookupSendcloudV3CompatShippingOption29631 } from "@/lib/shipping/sendcloud/client";
import { SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1 } from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHOD_ID = SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1.methodId;

/** Empty body or explicit locked method id only — no arbitrary method IDs. */
const optionalBodySchema = z
  .object({
    methodId: z.literal(METHOD_ID).optional(),
    shipping_method_ids: z.tuple([z.literal(METHOD_ID)]).optional(),
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
            error: "Only locked methodId 29631 is allowed for this diagnostic.",
          },
          { status: 400 },
        );
      }
    }
  }

  if (!isSendcloudConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Sendcloud is not configured.", methodId: METHOD_ID },
      { status: 503 },
    );
  }

  try {
    const result = await lookupSendcloudV3CompatShippingOption29631();
    const { shippingOptionCode, contractId, rawMappingConfirmed } = result.mapping;

    console.info("[super-admin/shipping/diagnostic-v3-option-29631]", {
      actorUserId: auth.user.id,
      methodId: METHOD_ID,
      rawMappingConfirmed,
      hasShippingOptionCode: Boolean(shippingOptionCode),
      hasContractId: contractId != null,
      timestamp: new Date().toISOString(),
    });

    if (!rawMappingConfirmed || !shippingOptionCode) {
      return NextResponse.json(
        {
          ok: false,
          methodId: METHOD_ID,
          shippingOptionCode: null,
          contractId: null,
          rawMappingConfirmed: false,
          error: "Sendcloud returned no shipping_option_code for method 29631.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      methodId: METHOD_ID,
      shippingOptionCode,
      contractId,
      rawMappingConfirmed: true,
    });
  } catch (error) {
    const message = isSendcloudError(error)
      ? error.message
      : "Unable to resolve V3 shipping option for method 29631.";

    console.info("[super-admin/shipping/diagnostic-v3-option-29631]", {
      actorUserId: auth.user.id,
      methodId: METHOD_ID,
      ok: false,
      errorCode: isSendcloudError(error) ? error.code : "unknown",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        ok: false,
        methodId: METHOD_ID,
        shippingOptionCode: null,
        contractId: null,
        rawMappingConfirmed: false,
        error: message,
      },
      { status: isSendcloudError(error) && error.statusCode === 404 ? 404 : 502 },
    );
  }
}
