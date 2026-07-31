import { NextResponse } from "next/server";

import { getSendcloudWebhookSecret, isSendcloudConfigured } from "@/lib/shipping/env";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import {
  handleSendcloudWebhookEvent,
  verifySendcloudWebhookRequest,
} from "@/lib/shipping/sendcloud/webhooks";
import { SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1 } from "@/lib/shipping/sendcloud/webhook-idempotency-v1";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebhookLogFields = {
  reason: string;
  signature_valid: boolean | "n/a";
  body_present: boolean;
  event: string | null;
  tracking: string | null;
};

/** One structured production-safe line. No secrets · no HMAC · no payload dump. */
function logWebhook(fields: WebhookLogFields): void {
  console.info(
    `[Sendcloud Webhook] reason=${fields.reason} signature_valid=${fields.signature_valid} body_present=${fields.body_present} event=${fields.event ?? "null"} tracking=${fields.tracking ?? "null"}`,
  );
}

function reject(
  status: number,
  reason: string,
  fields: Omit<WebhookLogFields, "reason"> & { code: string },
): NextResponse {
  logWebhook({
    reason,
    signature_valid: fields.signature_valid,
    body_present: fields.body_present,
    event: fields.event,
    tracking: fields.tracking,
  });
  return NextResponse.json(
    { success: false, reason, code: fields.code },
    { status },
  );
}

function ok(
  reason: string,
  extra: Record<string, unknown>,
  fields: Omit<WebhookLogFields, "reason">,
): NextResponse {
  logWebhook({
    reason,
    signature_valid: fields.signature_valid,
    body_present: fields.body_present,
    event: fields.event,
    tracking: fields.tracking,
  });
  return NextResponse.json({ success: true, reason, ...extra }, { status: 200 });
}

export async function GET() {
  return reject(405, "Method Not Allowed — use POST.", {
    code: "method_not_allowed",
    signature_valid: "n/a",
    body_present: false,
    event: null,
    tracking: null,
  });
}

export async function POST(request: Request) {
  if (!isSendcloudConfigured()) {
    return reject(
      503,
      "Sendcloud is not configured (SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY missing).",
      {
        code: "sendcloud_not_configured",
        signature_valid: "n/a",
        body_present: false,
        event: null,
        tracking: null,
      },
    );
  }

  if (!getSendcloudWebhookSecret()) {
    return reject(
      503,
      "SENDCLOUD_WEBHOOK_SECRET is not configured — unsigned webhooks are rejected.",
      {
        code: "webhook_secret_not_configured",
        signature_valid: false,
        body_present: false,
        event: null,
        tracking: null,
      },
    );
  }

  const rawBody = await request.text();
  const bodyPresent = Boolean(rawBody.trim());
  if (!bodyPresent) {
    return reject(400, "Webhook body is empty.", {
      code: "empty_body",
      signature_valid: "n/a",
      body_present: false,
      event: null,
      tracking: null,
    });
  }

  const hasSignature = Boolean(request.headers.get("sendcloud-signature"));
  const signatureValid = verifySendcloudWebhookRequest(request, rawBody);
  if (!signatureValid) {
    return reject(
      401,
      hasSignature ? "Signature mismatch" : "Missing Sendcloud-Signature header",
      {
        code: hasSignature ? "invalid_signature" : "missing_signature",
        signature_valid: false,
        body_present: true,
        event: null,
        tracking: null,
      },
    );
  }

  let body: SendcloudWebhookPayload | null = null;
  try {
    body = JSON.parse(rawBody) as SendcloudWebhookPayload;
  } catch {
    return reject(400, "Webhook body is not valid JSON.", {
      code: "invalid_json",
      signature_valid: true,
      body_present: true,
      event: null,
      tracking: null,
    });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return reject(400, "Webhook JSON must be an object.", {
      code: "invalid_payload",
      signature_valid: true,
      body_present: true,
      event: null,
      tracking: null,
    });
  }

  const eventAction =
    typeof body.action === "string" && body.action.trim() ? body.action.trim() : null;
  const trackingPreview =
    typeof body.parcel?.tracking_number === "string"
      ? body.parcel.tracking_number.trim() || null
      : null;

  /**
   * ROOT CAUSE FIX — Official Sendcloud panel "Test API Webhook":
   * action = `test_webhook` (JouwWeb/Sendcloud SDK TYPE_TEST).
   * Parcel is optional. Requiring parcel caused HTTP 400 missing_parcel.
   * Acknowledge signature-verified test without commerce side effects.
   */
  if (eventAction === SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1.testAction) {
    return ok(
      "Test webhook acknowledged",
      { received: true, action: eventAction },
      {
        signature_valid: true,
        body_present: true,
        event: eventAction,
        tracking: trackingPreview,
      },
    );
  }

  if (!body.parcel || typeof body.parcel !== "object") {
    return reject(400, "Missing parcel", {
      code: "missing_parcel",
      signature_valid: true,
      body_present: true,
      event: eventAction,
      tracking: null,
    });
  }

  try {
    const result = await handleSendcloudWebhookEvent(body);
    return ok(
      result.duplicate
        ? "Duplicate webhook ignored"
        : result.handled
          ? "Webhook processed"
          : result.message,
      {
        received: true,
        handled: result.handled,
        duplicate: Boolean(result.duplicate),
        message: result.message,
      },
      {
        signature_valid: true,
        body_present: true,
        event: eventAction ?? result.message,
        tracking: trackingPreview,
      },
    );
  } catch (error) {
    if (isSendcloudError(error)) {
      const status =
        typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 500;
      logWebhook({
        reason: error.message,
        signature_valid: true,
        body_present: true,
        event: eventAction,
        tracking: trackingPreview,
      });
      return NextResponse.json(
        { success: false, reason: error.message, code: error.code },
        { status },
      );
    }
    logWebhook({
      reason: "handler_failed",
      signature_valid: true,
      body_present: true,
      event: eventAction,
      tracking: trackingPreview,
    });
    return NextResponse.json(
      { success: false, reason: "Sendcloud webhook handler failed.", code: "handler_failed" },
      { status: 500 },
    );
  }
}
