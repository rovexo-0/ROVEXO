import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { mapParcel2GoWebhookStatus } from "@/src/services/shipping/parcel2go/mapper";
import {
  appendParcel2GoTrackingEvent,
  saveParcel2GoShipment,
  saveParcel2GoWebhookEvent,
} from "@/lib/shipping/parcel2go-store";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { getParcel2GoWebhookSecret } from "@/src/services/shipping/env";
import { WebhookError } from "@/src/services/shipping/errors";
import { ShippingLogger } from "@/src/services/shipping/logger";

export type Parcel2GoWebhookPayload = {
  eventId?: string;
  eventType?: string;
  orderId?: string;
  orderLineId?: string;
  trackingNumber?: string;
  status?: string;
  occurredAt?: string;
  timestamp?: string;
  carrier?: string;
  trackingUrl?: string;
  [key: string]: unknown;
};

export type VerifiedParcel2GoWebhook = {
  payload: Parcel2GoWebhookPayload;
  correlationId: string;
  signature: string;
};

export type Parcel2GoWebhookResult = {
  handled: boolean;
  message: string;
  eventType?: string;
  duplicate?: boolean;
};

/** Replay protection window: reject events older/newer than this many ms. */
export const PARCEL2GO_WEBHOOK_REPLAY_WINDOW_MS = 5 * 60_000;

/**
 * Every Parcel2Go webhook event ROVEXO recognises. Matching is normalised
 * (case-insensitive, punctuation-insensitive) so provider variants like
 * "ShipmentCreated", "shipment.created" and "shipment_created" all resolve.
 */
const SUPPORTED_EVENTS = [
  "shipmentcreated",
  "shipmentupdated",
  "labelgenerated",
  "intransit",
  "outfordelivery",
  "delivered",
  "exception",
  "cancelled",
  "return",
] as const;

function normalizeEventType(eventType: string): string {
  return eventType.trim().toLowerCase().replace(/[\s._-]/g, "");
}

function parseSignatureHeader(header: string | null): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("=");
  if (parts.length === 2 && parts[0]?.toLowerCase() === "sha256") {
    return parts[1] ?? null;
  }

  return trimmed;
}

export function verifyParcel2GoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): string {
  const secret = getParcel2GoWebhookSecret();
  if (!secret) {
    throw new WebhookError(
      "PARCEL2GO_WEBHOOK_SECRET is not configured. Webhook verification is required in production.",
    );
  }

  const provided = parseSignatureHeader(signatureHeader);
  if (!provided) {
    throw new WebhookError("Missing Parcel2Go webhook signature");
  }

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new WebhookError("Invalid Parcel2Go webhook signature");
  }

  return expected;
}

/**
 * PHASE 2 replay protection: reject events whose timestamp falls outside the
 * accepted window. Events without a timestamp are allowed (dedup still applies).
 */
export function assertParcel2GoWebhookNotReplayed(
  payload: Parcel2GoWebhookPayload,
  now: number = Date.now(),
): void {
  const rawTimestamp = payload.timestamp ?? payload.occurredAt;
  if (!rawTimestamp) return;

  const eventTime = new Date(rawTimestamp).getTime();
  if (!Number.isFinite(eventTime)) return;

  if (Math.abs(now - eventTime) > PARCEL2GO_WEBHOOK_REPLAY_WINDOW_MS) {
    throw new WebhookError("Parcel2Go webhook rejected: timestamp outside replay window");
  }
}

export function parseParcel2GoWebhookPayload(rawBody: string): Parcel2GoWebhookPayload {
  try {
    const payload = JSON.parse(rawBody) as Parcel2GoWebhookPayload;
    if (!payload || typeof payload !== "object") {
      throw new WebhookError("Parcel2Go webhook payload must be a JSON object");
    }
    return payload;
  } catch (error) {
    if (error instanceof WebhookError) throw error;
    throw new WebhookError("Parcel2Go webhook payload is not valid JSON", { cause: error });
  }
}

export function handleParcel2GoWebhookRequest(input: {
  rawBody: string;
  signatureHeader: string | null;
  correlationId?: string;
}): VerifiedParcel2GoWebhook {
  const logger = new ShippingLogger("parcel2go", input.correlationId);
  const signature = verifyParcel2GoWebhookSignature(input.rawBody, input.signatureHeader);
  const payload = parseParcel2GoWebhookPayload(input.rawBody);
  assertParcel2GoWebhookNotReplayed(payload);

  logger.log({
    level: "info",
    provider: "parcel2go",
    correlationId: logger.correlationId,
    event: "request",
    message: `Webhook received: ${payload.eventType ?? "unknown"}`,
  });

  return {
    payload,
    correlationId: logger.correlationId,
    signature,
  };
}

export async function processParcel2GoWebhook(input: {
  rawBody: string;
  signatureHeader: string | null;
  correlationId?: string;
}): Promise<Parcel2GoWebhookResult> {
  const verified = handleParcel2GoWebhookRequest(input);
  const payload = verified.payload;
  const eventType = String(payload.eventType ?? payload.status ?? "unknown");

  const { inserted } = await saveParcel2GoWebhookEvent({
    eventType,
    payload: payload as Record<string, unknown>,
    correlationId: verified.correlationId,
    signature: verified.signature,
    eventId: typeof payload.eventId === "string" ? payload.eventId : null,
    eventTimestamp: payload.timestamp ?? payload.occurredAt ?? null,
    orderId: payload.orderId ?? null,
    orderLineId: typeof payload.orderLineId === "string" ? payload.orderLineId : null,
    trackingNumber: payload.trackingNumber ?? null,
  });

  // PHASE 2: duplicate-event protection — skip re-processing already-seen events.
  if (!inserted) {
    return {
      handled: false,
      duplicate: true,
      message: `Duplicate Parcel2Go webhook ${eventType} ignored`,
      eventType,
    };
  }

  const orderId = await resolveOrderIdFromWebhook(payload);
  if (!orderId) {
    return {
      handled: false,
      message: `No ROVEXO order mapped for Parcel2Go webhook ${eventType}`,
      eventType,
    };
  }

  const mappedStatus = mapParcel2GoWebhookStatus(eventType);
  if (mappedStatus) {
    await saveParcel2GoShipment({
      orderId,
      shipment: {
        id: payload.orderId ?? "unknown",
        provider: "parcel2go",
        providerOrderId: payload.orderId ?? "unknown",
        providerReference: null,
        orderLineId: typeof payload.orderLineId === "string" ? payload.orderLineId : null,
        orderLineIdHmac: null,
        status: mappedStatus,
        trackingNumber: payload.trackingNumber ?? null,
        carrier: typeof payload.carrier === "string" ? payload.carrier : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      trackingUrl: typeof payload.trackingUrl === "string" ? payload.trackingUrl : null,
    });
  }

  if (payload.trackingNumber) {
    await appendParcel2GoTrackingEvent({
      orderId,
      tracking: {
        shipmentId: payload.orderId ?? "unknown",
        trackingNumber: payload.trackingNumber,
        carrier: typeof payload.carrier === "string" ? payload.carrier : null,
        status: mappedStatus ?? "in_transit",
        events: [
          {
            id: verified.correlationId,
            status: eventType,
            description: `Parcel2Go webhook: ${eventType}`,
            location: null,
            occurredAt: payload.occurredAt ?? new Date().toISOString(),
          },
        ],
        lastUpdatedAt: new Date().toISOString(),
      },
      source: "parcel2go-webhook",
    });
  }

  return {
    handled: true,
    message: `Processed Parcel2Go webhook ${eventType}`,
    eventType,
  };
}

async function resolveOrderIdFromWebhook(payload: Parcel2GoWebhookPayload): Promise<string | null> {
  const admin = createShippingAdminClient();
  const parcel2goOrderId = payload.orderId;
  if (!parcel2goOrderId) return null;

  const { data } = await admin
    .from("shipping_records")
    .select("order_id")
    .eq("parcel2go_order_id", parcel2goOrderId)
    .maybeSingle();

  const row = data as { order_id?: string } | null;
  return row?.order_id ?? null;
}

export function isSupportedParcel2GoWebhookEvent(eventType: string): boolean {
  const normalized = normalizeEventType(eventType);
  return SUPPORTED_EVENTS.some((event) => normalized.includes(event));
}

export function assertParcel2GoWebhookConfigured(): void {
  if (!process.env.PARCEL2GO_WEBHOOK_SECRET?.trim()) {
    throw new WebhookError("PARCEL2GO_WEBHOOK_SECRET is not configured");
  }
}
