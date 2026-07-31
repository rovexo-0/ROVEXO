import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { findShippingRecordByTrackingNumber, updateShippingRecordStatus } from "@/lib/shipping/store";
import { onShippingRecordStatusChanged } from "@/lib/commerce-engine/shipping-hooks.server";
import { getSendcloudWebhookSecret, isSendcloudConfigured } from "@/lib/shipping/env";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import { mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";
import {
  claimSendcloudWebhookEvent,
  completeSendcloudWebhookEvent,
  extractSendcloudWebhookEventId,
  releaseSendcloudWebhookEvent,
} from "@/lib/shipping/sendcloud/webhook-idempotency-v1";

/**
 * Fail-closed: SENDCLOUD_WEBHOOK_SECRET is required in every environment.
 * Missing secret or missing/invalid signature → reject (never process unsigned).
 * CERTIFIED — do not modify HMAC verification.
 */
export function verifySendcloudWebhookRequest(request: Request, rawBody: string): boolean {
  const expected = getSendcloudWebhookSecret();
  if (!expected) {
    return false;
  }

  const signature = request.headers.get("sendcloud-signature");
  if (!signature) return false;

  const digest = createHmac("sha256", expected).update(rawBody).digest("hex");
  try {
    const left = Buffer.from(signature);
    const right = Buffer.from(digest);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export type HandleSendcloudWebhookResult = {
  handled: boolean;
  message: string;
  duplicate?: boolean;
};

/**
 * Sendcloud webhook handler with atomic idempotency v1.0.
 * Business side effects run only after a successful unique claim.
 */
export async function handleSendcloudWebhookEvent(
  event: SendcloudWebhookPayload,
): Promise<HandleSendcloudWebhookResult> {
  if (!isSendcloudConfigured()) {
    throw new SendcloudError("not_configured", "Sendcloud is not configured.");
  }

  // Fail-closed identity (official parcel.id + status.id + timestamp).
  const identity = extractSendcloudWebhookEventId(event);

  const claim = await claimSendcloudWebhookEvent(identity);
  if (claim.outcome === "duplicate") {
    return {
      handled: true,
      duplicate: true,
      message: `Duplicate Sendcloud webhook ignored (${claim.webhookEventId})`,
    };
  }

  const trackingNumber = event.parcel?.tracking_number?.trim() || identity.trackingNumber;
  if (!trackingNumber) {
    await releaseSendcloudWebhookEvent(claim.webhookEventId);
    return { handled: false, message: "Missing tracking number in Sendcloud webhook payload" };
  }

  try {
    const record = await findShippingRecordByTrackingNumber(trackingNumber);
    if (!record) {
      await releaseSendcloudWebhookEvent(claim.webhookEventId);
      return { handled: false, message: `No shipping record for tracking number ${trackingNumber}` };
    }

    const status = mapSendcloudTrackingStatus(event.parcel?.status?.message);
    const statusMessage = event.parcel?.status?.message ?? "Carrier update";

    await updateShippingRecordStatus({
      orderId: record.orderId,
      status,
      title: `Carrier update: ${status.replace(/_/g, " ")}`,
      description: statusMessage,
    });
    await onShippingRecordStatusChanged({ orderId: record.orderId, status });

    await completeSendcloudWebhookEvent({
      webhookEventId: claim.webhookEventId,
      orderId: record.orderId,
      trackingNumber,
    });

    return { handled: true, message: `Updated order ${record.orderId} to ${status}` };
  } catch (error) {
    await releaseSendcloudWebhookEvent(claim.webhookEventId);
    throw error;
  }
}
