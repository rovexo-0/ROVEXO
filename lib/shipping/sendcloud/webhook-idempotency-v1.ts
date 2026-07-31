/**
 * Sendcloud Webhook Idempotency v1.0
 *
 * Identity (official Sendcloud fields — no invented UUIDs):
 *   webhook_event_id = `{parcel.id}:{status.id}:{timestamp}`
 *
 * Sendcloud parcel-status-changed has no dedicated event UUID.
 * Docs require timestamp for delivery ordering; parcel.id + status.id
 * are official parcel / status identifiers on the webhook payload.
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
 * Fail-closed extraction of the official delivery identity.
 * Missing parcel.id | status.id | timestamp → reject (never guess).
 */
export function extractSendcloudWebhookEventId(
  event: SendcloudWebhookPayload,
): SendcloudWebhookEventClaim {
  const parcelId = event.parcel?.id;
  const statusId = event.parcel?.status?.id;
  const timestamp = event.timestamp;

  if (
    typeof parcelId !== "number" ||
    !Number.isFinite(parcelId) ||
    typeof statusId !== "number" ||
    !Number.isFinite(statusId) ||
    typeof timestamp !== "number" ||
    !Number.isFinite(timestamp)
  ) {
    throw new SendcloudError(
      "webhook_invalid",
      "Sendcloud webhook missing official event identity (parcel.id, status.id, timestamp).",
      { statusCode: 400 },
    );
  }

  const webhookEventId = `${parcelId}:${statusId}:${timestamp}`;
  const trackingNumber = event.parcel?.tracking_number?.trim() || null;
  const eventType = event.action?.trim() || event.parcel?.status?.message?.trim() || "parcel_status_changed";
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
