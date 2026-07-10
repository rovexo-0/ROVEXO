import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { findShippingRecordByTrackingNumber, updateShippingRecordStatus } from "@/lib/shipping/store";
import { onShippingRecordStatusChanged } from "@/lib/commerce-engine/shipping-hooks.server";
import { getSendcloudWebhookSecret, isSendcloudConfigured } from "@/lib/shipping/env";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import { mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";

export function verifySendcloudWebhookRequest(request: Request, rawBody: string): boolean {
  const expected = getSendcloudWebhookSecret();
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const signature = request.headers.get("sendcloud-signature");
  if (!signature) return false;

  const digest = createHmac("sha256", expected).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return signature === digest;
  }
}

export async function handleSendcloudWebhookEvent(
  event: SendcloudWebhookPayload,
): Promise<{ handled: boolean; message: string }> {
  if (!isSendcloudConfigured()) {
    throw new SendcloudError("not_configured", "Sendcloud is not configured.");
  }

  const parcel = event.parcel;
  const trackingNumber = parcel?.tracking_number?.trim();
  if (!trackingNumber) {
    return { handled: false, message: "Missing tracking number in Sendcloud webhook payload" };
  }

  const record = await findShippingRecordByTrackingNumber(trackingNumber);
  if (!record) {
    return { handled: false, message: `No shipping record for tracking number ${trackingNumber}` };
  }

  const status = mapSendcloudTrackingStatus(parcel?.status?.message);
  const statusMessage = parcel?.status?.message ?? "Carrier update";

  await updateShippingRecordStatus({
    orderId: record.orderId,
    status,
    title: `Carrier update: ${status.replace(/_/g, " ")}`,
    description: statusMessage,
  });
  await onShippingRecordStatusChanged({ orderId: record.orderId, status });

  return { handled: true, message: `Updated order ${record.orderId} to ${status}` };
}
