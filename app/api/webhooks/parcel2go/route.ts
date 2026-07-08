import { NextResponse } from "next/server";

import { enforceRateLimit } from "@/lib/api/rate-limit";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { isShippingError } from "@/src/services/shipping/errors";
import { processParcel2GoWebhook } from "@/src/services/shipping/parcel2go/webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "parcel2go-webhook", 120, 60_000);
  if (limited) return limited;  if (!isParcel2GoConfigured()) {
    return NextResponse.json({ error: "Parcel2Go is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-parcel2go-signature");

  try {
    const result = await processParcel2GoWebhook({
      rawBody,
      signatureHeader,
    });

    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error) {
    if (isShippingError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: "Parcel2Go webhook handler failed." }, { status: 500 });
  }
}
