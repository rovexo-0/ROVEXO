import { NextResponse } from "next/server";
import { isShippoConfigured } from "@/lib/shipping/env";
import { isShippoError } from "@/lib/shipping/shippo/errors";
import { handleShippoWebhookEvent, verifyShippoWebhookRequest } from "@/lib/shipping/shippo/webhooks";
import type { ShippoWebhookEvent } from "@/lib/shipping/shippo/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  if (!isShippoConfigured()) {
    return NextResponse.json({ error: "Shippo is not configured." }, { status: 503 });
  }

  if (!verifyShippoWebhookRequest(request)) {
    return NextResponse.json({ error: "Invalid Shippo webhook token." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ShippoWebhookEvent | null;
  if (!body?.event) {
    return NextResponse.json({ error: "Invalid Shippo webhook payload." }, { status: 400 });
  }

  try {
    const result = await handleShippoWebhookEvent(body);
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error) {
    if (isShippoError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ error: "Shippo webhook handler failed." }, { status: 500 });
  }
}
