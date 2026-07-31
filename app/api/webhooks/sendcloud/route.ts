import { NextResponse } from "next/server";

import { getSendcloudWebhookSecret, isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import {
  handleSendcloudWebhookEvent,
  verifySendcloudWebhookRequest,
} from "@/lib/shipping/sendcloud/webhooks";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reject(
  status: number,
  code: string,
  reason: string,
): NextResponse {
  console.error(`[sendcloud-webhook] REJECTED status=${status} code=${code} reason=${reason}`);
  return NextResponse.json({ error: reason, code }, { status });
}

export async function GET() {
  return reject(405, "method_not_allowed", "Method Not Allowed — use POST.");
}

export async function POST(request: Request) {
  if (!isSendcloudConfigured()) {
    return reject(
      503,
      "sendcloud_not_configured",
      "Sendcloud is not configured (SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY missing).",
    );
  }

  if (!getSendcloudWebhookSecret()) {
    return reject(
      503,
      "webhook_secret_not_configured",
      "SENDCLOUD_WEBHOOK_SECRET is not configured — unsigned webhooks are rejected.",
    );
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return reject(400, "empty_body", "Webhook body is empty.");
  }

  if (!verifySendcloudWebhookRequest(request, rawBody)) {
    const hasSignature = Boolean(request.headers.get("sendcloud-signature"));
    return reject(
      401,
      hasSignature ? "invalid_signature" : "missing_signature",
      hasSignature
        ? "Invalid Sendcloud-Signature (HMAC-SHA256 mismatch against SENDCLOUD_WEBHOOK_SECRET)."
        : "Missing Sendcloud-Signature header.",
    );
  }

  let body: SendcloudWebhookPayload | null = null;
  try {
    body = JSON.parse(rawBody) as SendcloudWebhookPayload;
  } catch {
    return reject(400, "invalid_json", "Webhook body is not valid JSON.");
  }

  if (!body || typeof body !== "object") {
    return reject(400, "invalid_payload", "Webhook JSON must be an object.");
  }

  if (!body.parcel || typeof body.parcel !== "object") {
    return reject(
      400,
      "missing_parcel",
      "Webhook payload missing required field: parcel.",
    );
  }

  try {
    const result = await handleSendcloudWebhookEvent(body);
    if (result.duplicate) {
      return NextResponse.json(
        { received: true, duplicate: true, handled: result.handled, message: result.message },
        { status: 200 },
      );
    }
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error) {
    if (isSendcloudError(error)) {
      const status =
        typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 500;
      console.error(
        `[sendcloud-webhook] HANDLER_ERROR status=${status} code=${error.code} reason=${error.message}`,
      );
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[sendcloud-webhook] HANDLER_FAILED reason=${message}`);
    return NextResponse.json(
      { error: "Sendcloud webhook handler failed.", code: "handler_failed", reason: message },
      { status: 500 },
    );
  }
}
