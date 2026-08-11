/**
 * Super Admin P6.2: persist Owner-confirmed V3 shipping_option_code for RVX8343A7C7.
 * Updates shipping_quotes.quote_payload only — no Sendcloud shipment/label/payment.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { RVX8343A7C7_V3_QUOTE_PERSIST_V1 } from "@/lib/orders/rvx8343a7c7-v3-quote-persist-v1";
import { persistRvx8343a7c7ConfirmedV3ShippingOption } from "@/lib/shipping/persist-rvx8343a7c7-v3-shipping-option.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK = RVX8343A7C7_V3_QUOTE_PERSIST_V1;

const optionalBodySchema = z
  .object({
    orderId: z.literal(LOCK.orderId).optional(),
    /** Must match lock exactly when provided — never accept a substitute code. */
    shippingOptionCode: z.literal(LOCK.confirmedShippingOptionCode).optional(),
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
      if (
        raw &&
        typeof raw === "object" &&
        "shippingOptionCode" in (raw as Record<string, unknown>) &&
        (raw as { shippingOptionCode?: unknown }).shippingOptionCode !==
          LOCK.confirmedShippingOptionCode
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Only the Owner-confirmed shipping_option_code inpost_gb:lockertoaddress/dropoff is allowed.",
          },
          { status: 400 },
        );
      }
      const parsed = optionalBodySchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: "Only locked RVX8343A7C7 / confirmed V3 code is allowed for this persist.",
          },
          { status: 400 },
        );
      }
    }
  }

  const result = await persistRvx8343a7c7ConfirmedV3ShippingOption();

  console.info("[super-admin/shipping/persist-v3-option-rvx8343a7c7]", {
    actorUserId: auth.user.id,
    orderId: LOCK.orderId,
    orderNumber: LOCK.orderNumber,
    action: LOCK.action,
    resultOk: result.ok,
    idempotent: result.ok ? result.idempotent : false,
    quotePayloadPersisted: result.ok ? result.quotePayloadPersisted : false,
    sendcloudCalled: false,
    shipmentCreated: false,
    labelCreated: false,
    paymentMutated: false,
    timestamp: new Date().toISOString(),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "failed",
        orderId: result.orderId,
        orderNumber: result.orderNumber ?? LOCK.orderNumber,
        legacyQuoteId: LOCK.legacyQuoteId,
        shippingOptionCode: null,
        quotePayloadPersisted: false,
        error: result.error,
        sendcloudCalled: false,
        shipmentCreated: false,
        labelCreated: false,
        paymentMutated: false,
        orderAmountMutated: false,
        otherOrdersMutated: false,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.idempotent ? "already_persisted" : "persisted",
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    legacyQuoteId: result.legacyQuoteId,
    shippingOptionCode: result.shippingOptionCode,
    quotePayloadPersisted: result.quotePayloadPersisted,
    shippingQuoteRowId: result.shippingQuoteRowId,
    shippingRecordId: result.shippingRecordId,
    shippingSetupStatus: result.shippingSetupStatus,
    idempotent: result.idempotent,
    mutations: result.mutations,
    sendcloudCalled: false,
    shipmentCreated: false,
    labelCreated: false,
    paymentMutated: false,
    orderAmountMutated: false,
    otherOrdersMutated: false,
  });
}
