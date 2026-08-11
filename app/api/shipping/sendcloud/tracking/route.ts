import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/session";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { assertSendcloudTrackingRefreshAccess } from "@/lib/shipping/assert-order-shipping-access.server";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { updateShippingRecordStatus } from "@/lib/shipping/store";
import { onShippingRecordStatusChanged } from "@/lib/commerce-engine/shipping-hooks.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sendcloud tracking refresh — authenticated buyer/seller only.
 * Ownership is proven from ROVEXO order/shipping records BEFORE any Sendcloud call
 * and BEFORE any shipping-status mutation (fail closed / no IDOR).
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isSendcloudConfigured()) {
    return NextResponse.json({ error: "Sendcloud is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orderIdParam = searchParams.get("orderId");
  const trackingNumberParam = searchParams.get("trackingNumber");

  if (!trackingNumberParam?.trim()) {
    return NextResponse.json({ error: "trackingNumber is required." }, { status: 400 });
  }

  const access = await assertSendcloudTrackingRefreshAccess({
    userId: auth.user.id,
    orderId: orderIdParam,
    trackingNumber: trackingNumberParam,
  });

  if (!access.ok) {
    return NextResponse.json({ error: "Tracking not found." }, { status: 404 });
  }

  const tracking = await SendcloudService.getTracking(access.trackingNumber);

  // Status writes only for the authorized order. Re-bind to access.orderId — never client orderId alone.
  if (orderIdParam?.trim()) {
    if (orderIdParam.trim() !== access.orderId) {
      return NextResponse.json({ error: "Tracking not found." }, { status: 404 });
    }

    await updateShippingRecordStatus({
      orderId: access.orderId,
      status: tracking.status,
      title: `Tracking refresh: ${tracking.status.replace(/_/g, " ")}`,
      description: tracking.events.at(-1)?.statusDetails ?? undefined,
    });
    await onShippingRecordStatusChanged({ orderId: access.orderId, status: tracking.status });
  }

  return NextResponse.json({ ok: true, tracking });
}
