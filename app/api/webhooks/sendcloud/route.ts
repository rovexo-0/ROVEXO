import { NextResponse } from "next/server";

import { isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import {
  handleSendcloudWebhookEvent,
  verifySendcloudWebhookRequest,
} from "@/lib/shipping/sendcloud/webhooks";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  if (!isSendcloudConfigured()) {
    return NextResponse.json({ error: "Sendcloud is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifySendcloudWebhookRequest(request, rawBody)) {
    return NextResponse.json({ error: "Invalid Sendcloud webhook signature." }, { status: 401 });
  }

  const body = (() => {
    try {
      return JSON.parse(rawBody) as SendcloudWebhookPayload;
    } catch {
      return null;
    }
  })();

  if (!body?.parcel) {
    return NextResponse.json({ error: "Invalid Sendcloud webhook payload." }, { status: 400 });
  }

  try {
    const result = await handleSendcloudWebhookEvent(body);
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error) {
    if (isSendcloudError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ error: "Sendcloud webhook handler failed." }, { status: 500 });
  }
}
