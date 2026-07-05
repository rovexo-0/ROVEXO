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
  ShippingRecord,
  ShippingStatus,
  ShippingTrackingEvent,
} from "@/lib/shipping/types";
import {
  estimateDeliveryDate,
  isValidTrackingNumber,
  type UkCarrier,
} from "@/lib/shipping/carriers";
import { createOrderShipment, getOrderShipment } from "@/lib/shipping/service";

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
    quotes: quotes.map((quote) => ({
      id: quote.id,
      providerId: quote.provider_id,
      carrier: quote.carrier,
      serviceName: quote.service_name,
      pricePence: quote.price_pence,
      currency: "GBP",
      estimatedDays: { min: quote.estimated_days_min, max: quote.estimated_days_max },
      recommended: quote.recommended === "cheapest" || quote.recommended === "fastest" ? quote.recommended : undefined,
      expiresAt: quote.expires_at ?? undefined,
    })),
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
  const labelResult = await admin
    .from("shipping_labels_v1")
    .select("*")
    .eq("shipping_record_id", recordRow.id)
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
  legacyParcelSize?: LegacyParcelSize | null;
  categorySlug?: string | null;
  manualTier?: ParcelTier | null;
}): Promise<ShippingRecord | null> {
  const existing = await getShippingRecord(input.orderId);
  if (existing) return existing;

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
    })
    .select("*")
    .single();

  if (error || !data) return null;

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
    await admin.from("shipping_quotes").insert(
      input.pricing.quotes.map((quote) => ({
        id: quote.id,
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
      })),
    );
  }

  await admin
    .from("shipping_records")
    .update({ selected_quote_id: input.pricing.selectedQuoteId })
    .eq("id", record.id);

  return getShippingRecord(input.orderId);
}

export async function saveShippingLabel(input: {
  orderId: string;
  label: ShippingLabelArtifact;
  internalPlatformFeePence: number;
}): Promise<ShippingRecord | null> {
  const record = await ensureShippingRecord({ orderId: input.orderId });
  if (!record) return null;

  const admin = createShippingAdminClient();
  await admin.from("shipping_labels_v1").upsert(
    {
      shipping_record_id: record.id,
      tracking_number: input.label.trackingNumber,
      barcode: input.label.barcode,
      qr_payload: input.label.qrPayload,
      pdf_storage_path: input.label.pdfUrl,
      carrier: String(input.label.carrier),
      label_status: input.label.status,
      internal_platform_fee_pence: input.internalPlatformFeePence,
    },
    { onConflict: "shipping_record_id" },
  );

  return getShippingRecord(input.orderId);
}

export { mapLegacyParcelSize };
