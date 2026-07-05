import "server-only";

import { findShippingRecordByTrackingNumber, updateShippingRecordStatus } from "@/lib/shipping/store";
import { getShippoWebhookToken, isShippoConfigured } from "@/lib/shipping/env";
import { ShippoError } from "@/lib/shipping/shippo/errors";
import { mapShippoCarrierToken, mapShippoTrackingStatus } from "@/lib/shipping/shippo/status-mapper";
import type { ShippoWebhookEvent } from "@/lib/shipping/shippo/types";

export function verifyShippoWebhookRequest(request: Request): boolean {
  const expected = getShippoWebhookToken();
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const headerToken = request.headers.get("x-shippo-webhook-token");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const queryToken = new URL(request.url).searchParams.get("token");

  return [headerToken, bearerToken, queryToken].some((value) => value === expected);
}

export async function handleShippoWebhookEvent(event: ShippoWebhookEvent): Promise<{ handled: boolean; message: string }> {
  if (!isShippoConfigured()) {
    throw new ShippoError("not_configured", "Shippo is not configured.");
  }

  switch (event.event) {
    case "track_updated":
      return handleTrackUpdated(event);
    case "transaction_created":
    case "transaction_updated":
      return handleTransactionEvent(event);
    default:
      return { handled: false, message: `Ignored unsupported event: ${event.event}` };
  }
}

async function handleTrackUpdated(event: ShippoWebhookEvent): Promise<{ handled: boolean; message: string }> {
  const data = event.data ?? {};
  const trackingNumber = typeof data.tracking_number === "string" ? data.tracking_number : null;
  if (!trackingNumber) {
    return { handled: false, message: "Missing tracking number in track_updated payload" };
  }

  const record = await findShippingRecordByTrackingNumber(trackingNumber);
  if (!record) {
    return { handled: false, message: `No shipping record for tracking number ${trackingNumber}` };
  }

  const trackingStatus =
    typeof data.tracking_status === "object" && data.tracking_status !== null
      ? (data.tracking_status as { status?: string }).status
      : undefined;

  const status = mapShippoTrackingStatus(trackingStatus);
  const latestEvent =
    Array.isArray(data.tracking_history) && data.tracking_history.length > 0
      ? (data.tracking_history as Array<{ status_details?: string; location?: string }>)[
          data.tracking_history.length - 1
        ]
      : null;

  await updateShippingRecordStatus({
    orderId: record.orderId,
    status,
    title: `Carrier update: ${status.replace(/_/g, " ")}`,
    description: latestEvent?.status_details ?? undefined,
  });

  return { handled: true, message: `Updated order ${record.orderId} to ${status}` };
}

async function handleTransactionEvent(event: ShippoWebhookEvent): Promise<{ handled: boolean; message: string }> {
  const data = event.data ?? {};
  const trackingNumber = typeof data.tracking_number === "string" ? data.tracking_number : null;
  const status = typeof data.status === "string" ? data.status : null;

  if (!trackingNumber) {
    return { handled: false, message: "Missing tracking number in transaction payload" };
  }

  const record = await findShippingRecordByTrackingNumber(trackingNumber);
  if (!record) {
    return { handled: false, message: `No shipping record for tracking number ${trackingNumber}` };
  }

  if (status === "SUCCESS") {
    await updateShippingRecordStatus({
      orderId: record.orderId,
      status: "collected",
      title: "Shipping label created",
      description: `Shippo label ready for ${trackingNumber}.`,
    });
    return { handled: true, message: `Label transaction recorded for order ${record.orderId}` };
  }

  return { handled: false, message: `Ignored transaction status ${status ?? "unknown"}` };
}

export function normalizeShippoCarrierForTracking(carrier: string): string {
  return mapShippoCarrierToken(carrier);
}
