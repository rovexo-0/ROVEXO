/**
 * One-time Super Admin entrypoint for RVXC75CA5BB orphan shipping repair.
 * Invokes existing repairPaidOrderShippingPersistence only — no Sendcloud / label / refund.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { repairPaidOrderShippingPersistence } from "@/lib/orders/repair-paid-order-shipping.server";
import { RVXC75CA5BB_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvxc75ca5bb-orphan-shipping-repair-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const optionalBodySchema = z
  .object({
    orderId: z.string().uuid().optional(),
    selectedShippingQuoteId: z.string().optional(),
  })
  .strict()
  .optional();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof optionalBodySchema> = undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const raw = await request.json();
      body = optionalBodySchema.parse(raw ?? {});
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 },
      );
    }
  }

  if (body?.orderId && body.orderId !== RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId) {
    return NextResponse.json(
      { ok: false, error: "Order ID is not authorized for this repair endpoint." },
      { status: 400 },
    );
  }

  if (
    body?.selectedShippingQuoteId &&
    body.selectedShippingQuoteId !== RVXC75CA5BB_ORPHAN_REPAIR_V1.selectedShippingQuoteId
  ) {
    return NextResponse.json(
      { ok: false, error: "Shipping quote ID is not authorized for this repair endpoint." },
      { status: 400 },
    );
  }

  const startedAt = new Date().toISOString();
  const result = await repairPaidOrderShippingPersistence(
    RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId,
    {
      selectedShippingQuoteId: RVXC75CA5BB_ORPHAN_REPAIR_V1.selectedShippingQuoteId,
    },
  );

  console.info("[super-admin/shipping/repair-rvxc75ca5bb]", {
    orderId: RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId,
    orderNumber: RVXC75CA5BB_ORPHAN_REPAIR_V1.orderNumber,
    repairAction: RVXC75CA5BB_ORPHAN_REPAIR_V1.action,
    selectedQuoteId: RVXC75CA5BB_ORPHAN_REPAIR_V1.selectedShippingQuoteId,
    actorUserId: auth.user.id,
    resultOk: result.ok,
    result: result.ok
      ? {
          shippingSetupStatus: result.shippingSetupStatus,
          shippingRecordId: result.shippingRecordId,
          selectedQuoteId: result.selectedQuoteId,
          idempotent: result.idempotent,
          sendcloudCalled: result.sendcloudCalled,
          parcelCreatedExternally: result.parcelCreatedExternally,
          labelCreated: result.labelCreated,
        }
      : {
          error: result.error,
          shippingSetupStatus: result.shippingSetupStatus ?? null,
          sendcloudCalled: result.sendcloudCalled,
        },
    timestamp: startedAt,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        orderId: result.orderId,
        orderNumber: result.orderNumber ?? RVXC75CA5BB_ORPHAN_REPAIR_V1.orderNumber,
        error: result.error,
        shippingSetupStatus: result.shippingSetupStatus ?? null,
        sendcloudCalled: false,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    shippingSetupStatus: result.shippingSetupStatus,
    shippingRecordId: result.shippingRecordId,
    selectedQuoteId: result.selectedQuoteId,
    idempotent: result.idempotent,
    sendcloudCalled: false,
    parcelCreatedExternally: false,
    labelCreated: false,
  });
}
