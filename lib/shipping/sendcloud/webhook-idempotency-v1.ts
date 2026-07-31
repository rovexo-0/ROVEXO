/**
 * Sendcloud Webhook Idempotency v1.0
 *
 * Identity (official Sendcloud fields — no invented UUIDs):
 *   webhook_event_id = `{parcel.id}:{status.id}:{timestamp}`
 *
 * Sendcloud parcel-status-changed has no dedicated event UUID.
 * Docs require timestamp for delivery ordering; parcel.id + status.id
 * are official parcel / status identifiers on the webhook payload.
 *
 * Official timestamp (JouwWeb/Sendcloud SDK + panel): unix epoch **milliseconds** (number).
 * Official Test API Webhook action: `test_webhook` (may omit parcel).
 */

import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";

export const SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1 = {
  id: "sendcloud-webhook-idempotency-v1",
  version: "1.0.0",
  table: "sendcloud_webhook_events",
  /** Official composite — not a hashed payload, not a random UUID. */
  identityFormula: "{parcel.id}:{status.id}:{timestamp}",
  source: "sendcloud",
  /** Official Sendcloud panel "Test API Webhook" action. */
  testAction: "test_webhook",
} as const;

export type SendcloudWebhookEventClaim = {
  webhookEventId: string;
  trackingNumber: string | null;
  eventType: string;
  parcelId: number;
  statusId: number;
  timestamp: number;
  payloadHash: string | null;
};

/**
 * Official Sendcloud timestamp is unix epoch milliseconds (number).
 * Numeric strings are coerced; ISO date strings are rejected (not official).
 */
export function normalizeSendcloudWebhookTimestamp(
  value: unknown,
): { ok: true; timestamp: number } | { ok: false; reason: string } {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { ok: true, timestamp: value };
  }
  if (typeof value === "string" && value.trim() !== "") {
    const trimmed = value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return {
        ok: false,
        reason: "timestamp must be unix epoch milliseconds (number), not an ISO date string",
      };
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return { ok: false, reason: "timestamp is not a finite number" };
    }
    return { ok: true, timestamp: parsed };
  }
  if (value === undefined || value === null) {
    return { ok: false, reason: "Missing timestamp" };
  }
  return { ok: false, reason: "timestamp must be a number (unix epoch milliseconds)" };
}

/**
 * Fail-closed extraction of the official delivery identity.
 * Returns precise field-level reasons (never a generic missing-identity blob).
 */
export function extractSendcloudWebhookEventId(
  event: SendcloudWebhookPayload,
): SendcloudWebhookEventClaim {
  const parcelId = event.parcel?.id;
  const statusId = event.parcel?.status?.id;
  const ts = normalizeSendcloudWebhookTimestamp(event.timestamp);

  if (typeof parcelId !== "number" || !Number.isFinite(parcelId)) {
    throw new SendcloudError("webhook_invalid", "Missing parcel.id", { statusCode: 400 });
  }
  if (typeof statusId !== "number" || !Number.isFinite(statusId)) {
    throw new SendcloudError("webhook_invalid", "Missing parcel.status.id", { statusCode: 400 });
  }
  if (!ts.ok) {
    throw new SendcloudError("webhook_invalid", ts.reason, { statusCode: 400 });
  }

  const timestamp = ts.timestamp;
  const webhookEventId = `${parcelId}:${statusId}:${timestamp}`;
  const trackingNumber = event.parcel?.tracking_number?.trim() || null;
  const eventType =
    event.action?.trim() || event.parcel?.status?.message?.trim() || "parcel_status_changed";
  const payloadHash = createHash("sha256").update(webhookEventId).digest("hex");

  return {
    webhookEventId,
    trackingNumber,
    eventType,
    parcelId,
    statusId,
    timestamp,
    payloadHash,
  };
}

export type ClaimSendcloudWebhookResult =
  | { outcome: "claimed"; webhookEventId: string }
  | { outcome: "duplicate"; webhookEventId: string };

/**
 * Atomic registration. UNIQUE(webhook_event_id) ensures only one concurrent
 * delivery continues. Duplicate insert → duplicate (no side effects).
 */
export async function claimSendcloudWebhookEvent(
  claim: SendcloudWebhookEventClaim,
): Promise<ClaimSendcloudWebhookResult> {
  const admin = createAdminClient();
  const { error } = await admin.from("sendcloud_webhook_events").insert({
    webhook_event_id: claim.webhookEventId,
    tracking_number: claim.trackingNumber,
    order_id: null,
    event_type: claim.eventType,
    payload_hash: claim.payloadHash,
    source: SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1.source,
    status: "processing",
    metadata: {
      parcelId: claim.parcelId,
      statusId: claim.statusId,
      timestamp: claim.timestamp,
    },
  });

  if (error) {
    if (error.code === "23505") {
      return { outcome: "duplicate", webhookEventId: claim.webhookEventId };
    }
    throw new SendcloudError(
      "api_error",
      "Unable to register Sendcloud webhook delivery (database unavailable).",
      { statusCode: 503, details: { code: error.code, message: error.message } },
    );
  }

  return { outcome: "claimed", webhookEventId: claim.webhookEventId };
}

export async function completeSendcloudWebhookEvent(input: {
  webhookEventId: string;
  orderId: string | null;
  trackingNumber: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("sendcloud_webhook_events")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
      order_id: input.orderId,
      tracking_number: input.trackingNumber,
    })
    .eq("webhook_event_id", input.webhookEventId);

  if (error) {
    throw new SendcloudError(
      "api_error",
      "Unable to commit Sendcloud webhook delivery claim.",
      { statusCode: 503, details: { code: error.code, message: error.message } },
    );
  }
}

/** Release claim so Sendcloud retries can re-process after recoverable failure. */
export async function releaseSendcloudWebhookEvent(webhookEventId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("sendcloud_webhook_events").delete().eq("webhook_event_id", webhookEventId);
}
