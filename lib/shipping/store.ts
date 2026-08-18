import "server-only";

import { randomUUID } from "node:crypto";

import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectParcelTier, mapLegacyParcelSize } from "@/lib/shipping/parcels";
import { mapToLegacyShipmentStatus } from "@/lib/shipping/status";
import { createTrackingEvent } from "@/lib/shipping/tracking";
import type {
  LegacyParcelSize,
  ParcelTier,
  ShippingAddress,
  ShippingLabelArtifact,
  ShippingPricing,
  ShippingQuote,
  ShippingQuotePayload,
  ShippingRecord,
  ShippingStatus,
  ShippingTrackingEvent,
} from "@/lib/shipping/types";
import {
  shippingQuoteFromPayloadRow,
  buildShippingQuotePayload,
  coerceShippingQuotePayload,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import {
  estimateDeliveryDate,
  isValidTrackingNumber,
  type UkCarrier,
} from "@/lib/shipping/carriers";
import { createOrderShipment, getOrderShipment } from "@/lib/shipping/service";
import { attachLabelToParcel, createShipmentParcel, listShipmentParcelsForOrder } from "@/lib/shipping/parcels-repository";
import type { ShipmentParcel } from "@/lib/shipping/types";
import { logShippingPersistenceFailure } from "@/lib/shipping/shipping-persistence-failure-log-v1";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type RecordRow = {
  id: string;
  order_id: string;
  parcel_tier: ParcelTier;
  status: ShippingStatus;
  carrier: string | null;
  tracking_number: string | null;
  collection_address: ShippingAddress | null;
  delivery_address: ShippingAddress | null;
  selected_quote_id: string | null;
  created_at: string;
  updated_at: string;
};

type LabelRow = {
  tracking_number: string | null;
  barcode: string | null;
  qr_payload: string | null;
  pdf_storage_path: string | null;
  carrier: string;
  label_status: string;
};

type EventRow = {
  id: string;
  status: ShippingStatus;
  title: string;
  description: string | null;
  location: string | null;
  occurred_at: string;
  source: ShippingTrackingEvent["source"];
};

type QuoteRow = {
  id: string;
  provider_id: string;
  carrier: string;
  service_name: string;
  price_pence: number;
  currency: string;
  estimated_days_min: number;
  estimated_days_max: number;
  recommended: string | null;
  expires_at: string | null;
  quote_payload?: ShippingQuotePayload | { externalQuoteId?: string } | null;
};

function mapLabel(row: LabelRow | null): ShippingLabelArtifact | null {
  if (!row) return null;
  return {
    trackingNumber: row.tracking_number,
    barcode: row.barcode,
    qrPayload: row.qr_payload,
    pdfUrl: row.pdf_storage_path,
    carrier: row.carrier,
    status: row.label_status === "ready" ? "ready" : row.label_status === "void" ? "void" : "pending",
  };
}

function mapPricing(quotes: QuoteRow[], selectedQuoteId: string | null): ShippingPricing | null {
  if (quotes.length === 0) return null;
  return {
    quotes: quotes.map((quote) =>
      shippingQuoteFromPayloadRow({
        id: quote.id,
        providerId: quote.provider_id,
        carrier: quote.carrier,
        serviceName: quote.service_name,
        pricePence: quote.price_pence,
        currency: quote.currency,
        estimatedDaysMin: quote.estimated_days_min,
        estimatedDaysMax: quote.estimated_days_max,
        recommended: quote.recommended,
        expiresAt: quote.expires_at,
        quotePayload: quote.quote_payload ?? null,
      }),
    ),
    selectedQuoteId,
    currency: "GBP",
    providerAvailable: quotes.length > 0,
  };
}

function mapRecord(
  row: RecordRow,
  label: LabelRow | null,
  events: EventRow[],
  quotes: QuoteRow[],
  parcels: ShipmentParcel[],
): ShippingRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    parcelTier: row.parcel_tier,
    status: row.status,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    collectionAddress: row.collection_address,
    deliveryAddress: row.delivery_address,
    pricing: mapPricing(quotes, row.selected_quote_id),
    label: mapLabel(label),
    parcels,
    trackingEvents: events.map((event) => ({
      id: event.id,
      status: event.status,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      occurredAt: event.occurred_at,
      source: event.source,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getShippingRecord(orderId: string): Promise<ShippingRecord | null> {
  const admin = createShippingAdminClient();
  const { data: row } = await admin
    .from("shipping_records")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!row) return null;

  const recordRow = row as unknown as RecordRow;
  const parcels = await listShipmentParcelsForOrder(orderId);
  const labelResult = await admin
    .from("shipping_labels_v1")
    .select("*")
    .eq("shipping_record_id", recordRow.id)
    .order("parcel_number", { ascending: true })
    .limit(1)
    .maybeSingle();
  const eventsResult = (await admin
    .from("shipping_tracking_events")
    .select("*")
    .eq("shipping_record_id", recordRow.id)
    .order("occurred_at", { ascending: true })) as unknown as { data: EventRow[] | null };
  const quotesResult = (await admin
    .from("shipping_quotes")
    .select("*")
    .eq("shipping_record_id", recordRow.id)
    .order("created_at", { ascending: false })) as unknown as { data: QuoteRow[] | null };

  return mapRecord(
    recordRow,
    (labelResult.data as LabelRow | null) ?? null,
    eventsResult.data ?? [],
    quotesResult.data ?? [],
    parcels,
  );
}

export async function findShippingRecordByTrackingNumber(
  trackingNumber: string,
): Promise<ShippingRecord | null> {
  const admin = createShippingAdminClient();
  const { data: row } = await admin
    .from("shipping_records")
    .select("order_id")
    .eq("tracking_number", trackingNumber.trim())
    .maybeSingle();

  const orderId = (row as { order_id?: string } | null)?.order_id;
  if (!orderId) return null;
  return getShippingRecord(orderId);
}

export async function ensureShippingRecord(input: {
  orderId: string;
  orderNumber?: string | null;
  legacyParcelSize?: LegacyParcelSize | null;
  categorySlug?: string | null;
  manualTier?: ParcelTier | null;
  carrier?: string | null;
  selectedQuoteId?: string | null;
  collectionAddress?: ShippingAddress | null;
  deliveryAddress?: ShippingAddress | null;
}): Promise<ShippingRecord | null> {
  const existing = await getShippingRecord(input.orderId);
  if (existing) {
    const admin = createShippingAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.carrier && !existing.carrier) patch.carrier = input.carrier;
    if (input.selectedQuoteId && !existing.pricing?.selectedQuoteId) {
      patch.selected_quote_id = input.selectedQuoteId;
    }
    if (input.collectionAddress && !existing.collectionAddress) {
      patch.collection_address = input.collectionAddress;
    }
    if (input.deliveryAddress && !existing.deliveryAddress) {
      patch.delivery_address = input.deliveryAddress;
    }
    if (Object.keys(patch).length > 0) {
      await admin.from("shipping_records").update(patch).eq("order_id", input.orderId);
      return getShippingRecord(input.orderId);
    }
    return existing;
  }

  const detection = detectParcelTier({
    legacyParcelSize: input.legacyParcelSize ?? null,
    categorySlug: input.categorySlug ?? null,
    manualTier: input.manualTier ?? null,
  });

  const admin = createShippingAdminClient();
  const { data, error } = await admin
    .from("shipping_records")
    .insert({
      order_id: input.orderId,
      parcel_tier: detection.appliedTier,
      ai_recommended_tier: detection.recommendedTier,
      manual_override_tier: input.manualTier ?? null,
      category_slug: input.categorySlug ?? null,
      status: "preparing",
      carrier: input.carrier ?? null,
      selected_quote_id: input.selectedQuoteId ?? null,
      ...(input.collectionAddress ? { collection_address: input.collectionAddress } : {}),
      ...(input.deliveryAddress ? { delivery_address: input.deliveryAddress } : {}),
    })
    .select("*")
    .single();

  if (error || !data) {
    // Concurrent webhook / retry: unique(order_id) → re-read existing (idempotent).
    if (error && /duplicate key|unique/i.test(error.message)) {
      const raced = await getShippingRecord(input.orderId);
      if (raced) return raced;
    }
    const code = (error as { code?: string } | null)?.code ?? null;
    const message = error?.message ?? "no_data";
    // P5.5 — structured, credential-free failure diagnostics (console-only).
    logShippingPersistenceFailure({
      failureStage: "shipping_records.insert",
      orderId: input.orderId,
      orderNumber: input.orderNumber ?? null,
      selectedShippingQuoteId: input.selectedQuoteId ?? null,
      shippingRecordOperation: "insert",
      error: error ?? { message: "no_data" },
    });
    // Keep legacy search string for log greps.
    console.error("[shipping] ensureShippingRecord insert failed", {
      orderId: input.orderId,
      orderNumber: input.orderNumber ?? null,
      failureStage: "shipping_records.insert",
      code,
      message,
    });
    // Never convert INSERT failure into a silent null "success" — callers must fail closed.
    throw new Error(
      `Failed to insert shipping_records for order ${input.orderId}: ${message}${
        code ? ` (code=${code})` : ""
      }`,
    );
  }

  const recordRow = data as RecordRow;
  const initialEvent = createTrackingEvent({ status: "preparing", title: "Order preparing for dispatch" });
  await admin.from("shipping_tracking_events").insert({
    shipping_record_id: recordRow.id,
    status: initialEvent.status,
    title: initialEvent.title,
    description: initialEvent.description,
    location: initialEvent.location,
    occurred_at: initialEvent.occurredAt,
    source: initialEvent.source,
  });

  return getShippingRecord(input.orderId);
}

export async function updateShippingRecordStatus(input: {
  orderId: string;
  status: ShippingStatus;
  title?: string;
  description?: string;
}): Promise<ShippingRecord | null> {
  const record = await getShippingRecord(input.orderId);
  if (!record) return null;

  const admin = createShippingAdminClient();
  const event = createTrackingEvent({
    status: input.status,
    title: input.title,
    description: input.description,
  });

  await admin.from("shipping_records").update({ status: input.status }).eq("id", record.id);
  await admin.from("shipping_tracking_events").insert({
    shipping_record_id: record.id,
    status: event.status,
    title: event.title,
    description: event.description,
    location: event.location,
    occurred_at: event.occurredAt,
    source: event.source,
  });

  const legacyStatus = mapToLegacyShipmentStatus(input.status);
  const shipment = await getOrderShipment(input.orderId);
  if (shipment) {
    const coreAdmin = createAdminClient();
    await coreAdmin
      .from("order_shipments")
      .update({ status: legacyStatus, last_event: event.title })
      .eq("id", shipment.id);
  }

  return getShippingRecord(input.orderId);
}

export async function attachShippingTracking(input: {
  orderId: string;
  carrier: UkCarrier;
  trackingNumber: string;
  dispatchDays?: number;
}): Promise<{ record: ShippingRecord | null; error?: string }> {
  if (!isValidTrackingNumber(input.carrier, input.trackingNumber)) {
    return { record: null, error: "Invalid tracking number format for selected carrier." };
  }

  await ensureShippingRecord({ orderId: input.orderId });
  const shipmentResult = await createOrderShipment(input);
  if (shipmentResult.error) return { record: null, error: shipmentResult.error };

  const record = await getShippingRecord(input.orderId);
  if (!record) {
    return { record: null };
  }

  const admin = createShippingAdminClient();
  await admin
    .from("shipping_records")
    .update({
      carrier: input.carrier,
      tracking_number: input.trackingNumber,
      status: "collected",
    })
    .eq("id", record.id);

  await updateShippingRecordStatus({
    orderId: input.orderId,
    status: "collected",
    title: "Parcel collected",
    description: `Tracking number ${input.trackingNumber} added.`,
  });

  const estimated = estimateDeliveryDate(input.carrier, input.dispatchDays ?? 2);
  void estimated;

  return { record: await getShippingRecord(input.orderId) };
}

export async function saveShippingQuotes(input: {
  orderId: string;
  pricing: ShippingPricing;
}): Promise<ShippingRecord | null> {
  const record = await ensureShippingRecord({ orderId: input.orderId });
  if (!record) return null;

  const admin = createShippingAdminClient();
  await admin.from("shipping_quotes").delete().eq("shipping_record_id", record.id);

  if (input.pricing.quotes.length > 0) {
    const { error: insertError } = await admin.from("shipping_quotes").insert(
      input.pricing.quotes.map((quote) => {
        const externalId = String(quote.id);
        const rowId = isUuid(externalId) ? externalId : randomUUID();
        return {
          id: rowId,
          shipping_record_id: record.id,
          provider_id: quote.providerId,
          carrier: String(quote.carrier),
          service_name: quote.serviceName,
          price_pence: quote.pricePence,
          currency: quote.currency,
          estimated_days_min: quote.estimatedDays.min,
          estimated_days_max: quote.estimatedDays.max,
          recommended: quote.recommended ?? null,
          expires_at: quote.expiresAt ?? null,
          quote_payload: isUuid(externalId) ? null : buildShippingQuotePayload(quote),
        };
      }),
    );
    if (insertError) {
      console.error("[shipping] saveShippingQuotes insert failed:", insertError.message);
      throw new Error(`Failed to save shipping quotes: ${insertError.message}`);
    }
  }

  const { error: selectError } = await admin
    .from("shipping_records")
    .update({ selected_quote_id: input.pricing.selectedQuoteId })
    .eq("id", record.id);
  if (selectError) {
    console.error("[shipping] saveShippingQuotes select update failed:", selectError.message);
    throw new Error(`Failed to select shipping quote: ${selectError.message}`);
  }

  return getShippingRecord(input.orderId);
}

/**
 * Insert one additional quote and select it.
 * Never deletes or updates existing shipping_quotes rows.
 */
export async function appendAndSelectShippingQuoteWithoutReplacing(input: {
  orderId: string;
  quote: ShippingQuote;
}): Promise<ShippingRecord | null> {
  const record = await ensureShippingRecord({ orderId: input.orderId });
  if (!record) return null;

  const admin = createShippingAdminClient();
  const orders = createAdminClient();
  const externalId = String(input.quote.id);
  const rowId = isUuid(externalId) ? externalId : randomUUID();

  const { error: insertError } = await admin.from("shipping_quotes").insert({
    id: rowId,
    shipping_record_id: record.id,
    provider_id: input.quote.providerId,
    carrier: String(input.quote.carrier),
    service_name: input.quote.serviceName,
    price_pence: input.quote.pricePence,
    currency: input.quote.currency,
    estimated_days_min: input.quote.estimatedDays.min,
    estimated_days_max: input.quote.estimatedDays.max,
    recommended: input.quote.recommended ?? null,
    expires_at: input.quote.expiresAt ?? null,
    quote_payload: isUuid(externalId) ? null : buildShippingQuotePayload(input.quote),
  });
  if (insertError) {
    throw new Error(`Failed to append shipping quote: ${insertError.message}`);
  }

  const { error: selectError } = await admin
    .from("shipping_records")
    .update({ selected_quote_id: externalId })
    .eq("id", record.id);
  if (selectError) {
    throw new Error(`Failed to select appended shipping quote: ${selectError.message}`);
  }

  const { error: orderError } = await orders
    .from("orders")
    .update({ selected_shipping_quote_id: externalId })
    .eq("id", input.orderId);
  if (orderError) {
    throw new Error(`Failed to select order shipping quote: ${orderError.message}`);
  }

  return getShippingRecord(input.orderId);
}

/**
 * Overlay confirmed V3 metadata onto the existing selected shipping_quotes row.
 * Never inserts a second quote. Never changes selected_quote_id.
 */
export async function updateShippingQuotePayloadWithoutReplacing(input: {
  orderId: string;
  quote: ShippingQuote;
}): Promise<ShippingRecord | null> {
  const record = await getShippingRecord(input.orderId);
  if (!record?.id) return null;

  const admin = createShippingAdminClient();
  const { data: rows } = await admin
    .from("shipping_quotes")
    .select("id, quote_payload")
    .eq("shipping_record_id", record.id);

  const externalId = String(input.quote.id);
  const match = ((rows ?? []) as Array<{ id?: string; quote_payload?: unknown }>).find((row) => {
    if (input.quote.quoteRowId && row.id === input.quote.quoteRowId) return true;
    const payload = coerceShippingQuotePayload(row.quote_payload ?? null);
    return Boolean(payload?.externalQuoteId && payload.externalQuoteId === externalId);
  });

  if (!match?.id) {
    throw new Error("Selected shipping quote row not found for V3 payload update.");
  }

  const { error } = await admin
    .from("shipping_quotes")
    .update({ quote_payload: buildShippingQuotePayload(input.quote) })
    .eq("id", match.id)
    .eq("shipping_record_id", record.id);
  if (error) {
    throw new Error(`Failed to update shipping quote payload: ${error.message}`);
  }

  return getShippingRecord(input.orderId);
}

export async function saveShippingLabel(input: {
  orderId: string;
  parcelId?: string;
  label: ShippingLabelArtifact;
  internalPlatformFeePence: number;
  providerId?: string;
  providerParcelId?: number | null;
}): Promise<ShippingRecord | null> {
  const record = await ensureShippingRecord({ orderId: input.orderId });
  if (!record) return null;

  let parcelId = input.parcelId;
  if (!parcelId) {
    const parcels = await listShipmentParcelsForOrder(input.orderId);
    parcelId = parcels[0]?.id;
  }
  if (!parcelId) {
    const created = await createShipmentParcel({ orderId: input.orderId });
    parcelId = created?.id;
  }
  if (!parcelId) return null;

  await attachLabelToParcel({
    parcelId,
    shippingRecordId: record.id,
    providerId: input.providerId ?? "sendcloud",
    providerParcelId: input.providerParcelId,
    label: {
      trackingNumber: input.label.trackingNumber,
      carrier: String(input.label.carrier),
      pdfUrl: input.label.pdfUrl,
      labelUrl: input.label.pdfUrl,
      status: input.label.status,
    },
    internalPlatformFeePence: input.internalPlatformFeePence,
  });

  return getShippingRecord(input.orderId);
}

export { mapLegacyParcelSize };
