/**
 * One-time Super Admin entrypoint for RVX8343A7C7 orphan shipping repair.
 * Invokes existing repairPaidOrderShippingPersistence only — no Sendcloud / label / refund.
 * Quote override is forbidden; uses the order's existing selected_shipping_quote_id.
 *
 * Permanently separate from /api/super-admin/shipping/repair-rvxc75ca5bb.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { repairPaidOrderShippingPersistence } from "@/lib/orders/repair-paid-order-shipping.server";
import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const optionalBodySchema = z
  .object({
    orderId: z.string().uuid().optional(),
  })
  .strict()
  .optional();

export async function POST(request: Request) {
  // requireApiSuperAdmin(request) applies Super Admin auth + mutation Origin/CSRF guard.
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof optionalBodySchema> = undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const raw = await request.json();
      if (
        raw &&
        typeof raw === "object" &&
        "selectedShippingQuoteId" in (raw as Record<string, unknown>)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Shipping quote override is not authorized for this repair endpoint.",
          },
          { status: 400 },
        );
      }
      body = optionalBodySchema.parse(raw ?? {});
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 },
      );
    }
  }

  if (body?.orderId && body.orderId !== RVX8343A7C7_ORPHAN_REPAIR_V1.orderId) {
    return NextResponse.json(
      { ok: false, error: "Order ID is not authorized for this repair endpoint." },
      { status: 400 },
    );
  }

  const startedAt = new Date().toISOString();
  // Hard-lock: always the locked order UUID; never pass selectedShippingQuoteId.
  const result = await repairPaidOrderShippingPersistence(
    RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
  );

  console.info("[super-admin/shipping/repair-rvx8343a7c7]", {
    orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
    orderNumber: RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
    repairAction: RVX8343A7C7_ORPHAN_REPAIR_V1.action,
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
        status: "failed",
        orderId: result.orderId,
        orderNumber: result.orderNumber ?? RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
        error: result.error,
        shippingSetupStatus: result.shippingSetupStatus ?? null,
        sendcloudCalled: false,
        parcelCreatedExternally: false,
        labelCreated: false,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: "repaired",
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
