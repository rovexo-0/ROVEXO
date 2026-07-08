import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/session";
import { appendParcel2GoTrackingEvent } from "@/lib/shipping/parcel2go-store";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isParcel2GoConfigured()) {
    return NextResponse.json({ error: "Parcel2Go is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const trackingNumber = searchParams.get("trackingNumber");
  const shipmentId = searchParams.get("shipmentId") ?? orderId;

  if (!shipmentId) {
    return NextResponse.json({ error: "shipmentId or orderId is required." }, { status: 400 });
  }

  const tracking = await parcel2GoProvider.getTracking({
    shipmentId,
    trackingNumber: trackingNumber ?? undefined,
  });

  if (orderId) {
    await appendParcel2GoTrackingEvent({
      orderId,
      tracking,
      source: "parcel2go-api",
    });
  }

  return NextResponse.json({ ok: true, tracking });
}
