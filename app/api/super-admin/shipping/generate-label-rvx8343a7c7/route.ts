/**
 * Super Admin P7: ONE controlled label generation for RVX8343A7C7 only.
 * Preflight + canonical generateShippingLabelForOrder — no parallel shipping stack.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { RVX8343A7C7_CONTROLLED_LABEL_V1 } from "@/lib/orders/rvx8343a7c7-controlled-label-v1";
import { generateControlledLabelForRvx8343a7c7 } from "@/lib/shipping/generate-label-rvx8343a7c7.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK = RVX8343A7C7_CONTROLLED_LABEL_V1;

const optionalBodySchema = z
  .object({
    orderId: z.literal(LOCK.orderId).optional(),
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
            error: "Only locked RVX8343A7C7 is allowed for this controlled label endpoint.",
          },
          { status: 400 },
        );
      }
    }
  }

  const result = await generateControlledLabelForRvx8343a7c7();

  console.info("[super-admin/shipping/generate-label-rvx8343a7c7]", {
    actorUserId: auth.user.id,
    orderId: LOCK.orderId,
    orderNumber: LOCK.orderNumber,
    action: LOCK.action,
    status: result.status,
    ok: result.ok,
    sendcloudCalled: result.sendcloudCalled,
    labelCreated: result.labelCreated,
    idempotent: result.idempotent,
    timestamp: new Date().toISOString(),
  });

  const body = {
    ok: result.ok,
    P7_STATUS: result.status,
    ORDER_ID: result.orderId,
    ORDER_NUMBER: result.orderNumber,
    SHIPPING_SETUP_STATUS: result.shippingSetupStatus,
    SHIPPING_OPTION_CODE: result.shippingOptionCode,
    SHIPPING_RECORD_ID: result.shippingRecordId,
    SHIPPING_QUOTE_ROW_ID: result.shippingQuoteRowId,
    SENDCLOUD_CALLED: result.sendcloudCalled,
    SENDCLOUD_HTTP_STATUS: result.sendcloudHttpStatus,
    SHIPMENT_CREATED: result.shipmentCreated,
    PARCEL_CREATED_EXTERNALLY: result.parcelCreatedExternally,
    LABEL_CREATED: result.labelCreated,
    SHIPMENT_ID: result.shipmentId,
    PARCEL_ID: result.parcelId,
    LABEL_ID: result.labelId,
    TRACKING_NUMBER: result.trackingNumber,
    IDEMPOTENT: result.idempotent,
    DUPLICATE_SHIPMENT_PREVENTED: result.duplicateShipmentPrevented,
    ORDER_AMOUNT_MUTATED: result.orderAmountMutated,
    PAYMENT_MUTATED: result.paymentMutated,
    OTHER_ORDERS_MUTATED: result.otherOrdersMutated,
    FINAL_RESULT: result.status,
    ...(result.error ? { error: result.error } : {}),
    ...(result.preflightFailures ? { preflightFailures: result.preflightFailures } : {}),
  };

  if (result.status === "preflight_blocked") {
    return NextResponse.json(body, { status: 422 });
  }
  if (!result.ok) {
    const http =
      result.sendcloudHttpStatus &&
      result.sendcloudHttpStatus >= 400 &&
      result.sendcloudHttpStatus < 600
        ? result.sendcloudHttpStatus === 404
          ? 404
          : result.sendcloudHttpStatus === 422
            ? 422
            : 502
        : 422;
    return NextResponse.json(body, { status: http });
  }

  return NextResponse.json(body);
}
