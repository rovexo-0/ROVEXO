import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/session";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { updateShippingRecordStatus } from "@/lib/shipping/store";
import { onShippingRecordStatusChanged } from "@/lib/commerce-engine/shipping-hooks.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isSendcloudConfigured()) {
    return NextResponse.json({ error: "Sendcloud is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const trackingNumber = searchParams.get("trackingNumber");

  if (!trackingNumber) {
    return NextResponse.json({ error: "trackingNumber is required." }, { status: 400 });
  }

  const tracking = await SendcloudService.getTracking(trackingNumber);

  if (orderId) {
    await updateShippingRecordStatus({
      orderId,
      status: tracking.status,
      title: `Tracking refresh: ${tracking.status.replace(/_/g, " ")}`,
      description: tracking.events.at(-1)?.statusDetails ?? undefined,
    });
    await onShippingRecordStatusChanged({ orderId, status: tracking.status });
  }

  return NextResponse.json({ ok: true, tracking });
}
