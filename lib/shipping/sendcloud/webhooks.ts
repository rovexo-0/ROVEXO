import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  findShippingRecordByTrackingNumber,
  recordShippingTrackingDiagnosticEvent,
  updateShippingRecordStatus,
  getShippingRecord,
} from "@/lib/shipping/store";
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
import {
  findOrderIdByParcelTrackingNumber,
  listShipmentParcelsForOrder,
} from "@/lib/shipping/parcels-repository";
import { shouldApplyCarrierTrackingUpdate } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";

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
 * Unrecognized carrier statuses are recorded for diagnostics without lifecycle advance.
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
    let record = await findShippingRecordByTrackingNumber(trackingNumber);
    if (!record) {
      const orderId = await findOrderIdByParcelTrackingNumber(trackingNumber);
      record = orderId ? await getShippingRecord(orderId) : null;
    }
    if (!record) {
      await releaseSendcloudWebhookEvent(claim.webhookEventId);
      return { handled: false, message: `No shipping record for tracking number ${trackingNumber}` };
    }

    const parcels = await listShipmentParcelsForOrder(record.orderId);
    if (!shouldApplyCarrierTrackingUpdate({ trackingNumber, parcels })) {
      await completeSendcloudWebhookEvent({
        webhookEventId: claim.webhookEventId,
        orderId: record.orderId,
        trackingNumber,
      });
      return {
        handled: true,
        message: `Ignored historical parcel tracking update for order ${record.orderId}`,
      };
    }

    const statusMessage = event.parcel?.status?.message ?? null;
    const status = mapSendcloudTrackingStatus(statusMessage);

    if (status == null) {
      // Fail closed: record unknown event for diagnostics; preserve previous valid status.
      await recordShippingTrackingDiagnosticEvent({
        orderId: record.orderId,
        title: "Unrecognized carrier update",
        description: statusMessage?.trim() || "Unrecognized or empty carrier status",
      });

      await completeSendcloudWebhookEvent({
        webhookEventId: claim.webhookEventId,
        orderId: record.orderId,
        trackingNumber,
      });

      return {
        handled: true,
        message: `Recorded unrecognized carrier update for order ${record.orderId} without lifecycle advancement`,
      };
    }

    await updateShippingRecordStatus({
      orderId: record.orderId,
      status,
      title: `Carrier update: ${status.replace(/_/g, " ")}`,
      description: statusMessage ?? "Carrier update",
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
