import type {
  Label,
  Shipment,
  ShipmentStatus,
  ShippingAddress,
  ShippingQuote,
  ShippingRate,
  TrackingEvent,
  TrackingStatus,
} from "@/src/services/shipping/types";
import { encodeParcel2GoQuoteId } from "@/src/services/shipping/parcel2go/quote-id";
import {
  transitDaysBetweenIsoDates,
} from "@/lib/shipping/delivery-estimate";
import type {
  Parcel2GoApiAddress,
  Parcel2GoApiCreateOrderResponse,
  Parcel2GoApiLabelResponse,
  Parcel2GoApiPayOrderResponse,
  Parcel2GoApiQuote,
  Parcel2GoApiQuoteResponse,
  Parcel2GoApiTrackingResponse,
} from "@/src/services/shipping/parcel2go/types";

const COUNTRY_CODE_MAP: Record<string, string> = {
  "united kingdom": "GBR",
  uk: "GBR",
  gb: "GBR",
  gbr: "GBR",
};

const COUNTRY_ISO2_MAP: Record<string, string> = {
  GBR: "GB",
};

/** Parcel2Go orders use ISO-3 on CountryIsoCode per official API docs. */
const COUNTRY_ISO_FOR_ORDERS_MAP: Record<string, string> = {
  GBR: "GBR",
};

const COUNTRY_ID_MAP: Record<string, number> = {
  GBR: 0,
};

/** Parcel2Go orders require ISO alpha-3 on CollectionAddress/DeliveryAddress. */
export function mapCountryIsoCodeToParcel2Go(country: string): string {
  const alpha3 = mapCountryToParcel2Go(country);
  return COUNTRY_ISO_FOR_ORDERS_MAP[alpha3] ?? alpha3;
}

function mapCountryIdToParcel2Go(country: string): number | undefined {
  const alpha3 = mapCountryToParcel2Go(country);
  return COUNTRY_ID_MAP[alpha3];
}

export function mapCountryToParcel2Go(country: string): string {
  const normalized = country.trim().toLowerCase();
  return COUNTRY_CODE_MAP[normalized] ?? country.toUpperCase();
}

export function mapAddressToParcel2Go(address: ShippingAddress): Parcel2GoApiAddress {
  const [property, ...rest] = address.line1.trim().split(/\s+/);
  const street = rest.length > 0 ? rest.join(" ") : address.line1;
  const country = mapCountryToParcel2Go(address.country);
  const countryId = mapCountryIdToParcel2Go(address.country);

  return {
    ContactName: address.fullName,
    Street: street,
    Property: rest.length > 0 ? property : undefined,
    Street2: address.line2,
    Town: address.city,
    Postcode: address.postcode,
    Country: country,
    CountryIsoCode: mapCountryIsoCodeToParcel2Go(address.country),
    ...(countryId !== undefined ? { CountryId: countryId } : {}),
    Phone: address.phone,
    Email: address.email,
  };
}

function splitName(fullName: string): { forename: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { forename: "ROVEXO", surname: "User" };
  if (parts.length === 1) return { forename: parts[0]!, surname: "User" };
  return { forename: parts[0]!, surname: parts.slice(1).join(" ") };
}

function estimateDaysFromDate(isoDate: string | null | undefined): number | null {
  if (!isoDate?.trim()) return null;
  const delivery = parseDateOnlyUtc(isoDate);
  if (!delivery) return null;
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0),
  );
  const diffMs = delivery.getTime() - todayUtc.getTime();
  return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

function parseDateOnlyUtc(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const parsed = new Date(`${match[1]}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function mapParcel2GoQuoteToRate(quote: Parcel2GoApiQuote, index: number): ShippingRate {
  const serviceSlug = quote.Service?.Slug ?? `service-${index}`;
  const estimatedDays =
    transitDaysBetweenIsoDates(quote.Collection, quote.EstimatedDeliveryDate) ??
    estimateDaysFromDate(quote.EstimatedDeliveryDate);

  return {
    id: encodeParcel2GoQuoteId(quote),
    providerRateId: serviceSlug,
    carrier: quote.Service?.CourierName ?? "unknown",
    serviceName: quote.Service?.Name ?? "Standard",
    serviceCode: serviceSlug,
    amount: Number(quote.TotalPrice ?? 0),
    currency: quote.CurrencyCode ?? "GBP",
    vatAmount: quote.TotalVat != null ? Number(quote.TotalVat) : null,
    priceExVat: quote.TotalPriceExVat != null ? Number(quote.TotalPriceExVat) : null,
    estimatedDays,
    estimatedDeliveryAt: quote.EstimatedDeliveryDate ?? null,
    expiresAt: quote.CutOff ?? null,
  };
}

export function mapParcel2GoQuotesResponse(response: Parcel2GoApiQuoteResponse): ShippingQuote[] {
  const createdAt = new Date().toISOString();
  const quotes = response.Quotes ?? [];

  return quotes.map((quote, index) => {
    const rates = [mapParcel2GoQuoteToRate(quote, index)];
    return {
      id: rates[0]!.id,
      provider: "parcel2go",
      rates,
      createdAt,
      expiresAt: quote.CutOff ?? null,
    };
  });
}

export function mapParcel2GoOrderStatus(status?: string): ShipmentStatus {
  const normalized = (status ?? "").trim().toLowerCase();

  switch (normalized) {
    case "draft":
      return "draft";
    case "pending":
    case "pendingpayment":
    case "pending_payment":
      return "pending_payment";
    case "paid":
      return "paid";
    case "labelready":
    case "label_ready":
      return "label_ready";
    case "dispatched":
    case "shipped":
      return "dispatched";
    case "intransit":
    case "in_transit":
      return "in_transit";
    case "outfordelivery":
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "returned":
    case "return":
      return "returned";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "failed":
    case "exception":
      return "failed";
    default:
      return "draft";
  }
}

export function mapParcel2GoCreateOrderToShipment(
  response: Parcel2GoApiCreateOrderResponse,
  reference: string,
): Shipment {
  const now = new Date().toISOString();
  const firstLine = response.OrderlineIdMap?.[0];

  return {
    id: response.OrderId ?? "unknown",
    provider: "parcel2go",
    providerOrderId: response.OrderId ?? "unknown",
    providerReference: reference,
    orderLineId: firstLine?.OrderLineId ?? null,
    orderLineIdHmac: firstLine?.OrderLineIdHmac ?? firstLine?.Hash ?? null,
    paymentHash: response.Hash ?? null,
    status: "pending_payment",
    trackingNumber: null,
    carrier: null,
    shippingPrice: response.TotalPrice ?? null,
    insurancePrice: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapParcel2GoPayOrderToShipment(
  existing: Shipment,
  response: Parcel2GoApiPayOrderResponse,
): Shipment {
  return {
    ...existing,
    status: mapParcel2GoOrderStatus(response.Status ?? "paid"),
    trackingNumber: response.TrackingNumber ?? existing.trackingNumber,
    updatedAt: new Date().toISOString(),
  };
}

export function mapParcel2GoLabelResponse(
  response: Parcel2GoApiLabelResponse,
  shipment: Shipment,
): Label {
  const format = (response.Format ?? "pdf").toLowerCase();
  const normalizedFormat = format === "png" || format === "zpl" ? format : "pdf";

  return {
    id: shipment.orderLineId ?? shipment.id,
    shipmentId: shipment.id,
    format: normalizedFormat,
    url: response.LabelUrl ?? response.Url ?? null,
    dataBase64: response.Data ?? null,
    trackingNumber: response.TrackingNumber ?? shipment.trackingNumber,
    trackingUrl: null,
    carrier: shipment.carrier,
  };
}

export function mapParcel2GoTrackingEvent(event: { EventId?: string; Status?: string; Description?: string; Location?: string; Date?: string }, index: number): TrackingEvent {
  return {
    id: event.EventId ?? `event-${index}`,
    status: event.Status ?? "unknown",
    description: event.Description ?? event.Status ?? "Update",
    location: event.Location ?? null,
    occurredAt: event.Date ?? new Date().toISOString(),
  };
}

export function mapParcel2GoTrackingToStatus(
  response: Parcel2GoApiTrackingResponse,
  shipmentId: string,
): TrackingStatus {
  const events = (response.Events ?? []).map(mapParcel2GoTrackingEvent);

  return {
    shipmentId,
    trackingNumber: response.TrackingNumber ?? response.OrderLineId ?? "unknown",
    carrier: response.CourierName ?? null,
    status: mapParcel2GoOrderStatus(response.Status),
    events,
    estimatedDeliveryAt: response.EstimatedDeliveryDate ?? null,
    lastUpdatedAt: response.LastUpdated ?? events.at(-1)?.occurredAt ?? new Date().toISOString(),
  };
}

/**
 * Maps every documented Parcel2Go webhook event type to an internal shipment
 * status. Returns null for generic/unknown events (ShipmentUpdated, Unknown)
 * so they are logged and tracked without forcing an incorrect status change.
 *
 * Supported: ShipmentCreated, ShipmentUpdated, InTransit, OutForDelivery,
 * Delivered, Exception, Cancelled, Return, Unknown.
 */
export function mapParcel2GoWebhookStatus(eventType: string): ShipmentStatus | null {
  const normalized = eventType.trim().toLowerCase().replace(/[\s._-]/g, "");

  // Order matters: "outfordelivery" must be checked before "delivered".
  if (normalized.includes("outfordelivery")) return "out_for_delivery";
  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("created")) return "paid";
  if (normalized.includes("label")) return "label_ready";
  if (normalized.includes("intransit") || normalized.includes("transit")) return "in_transit";
  if (normalized.includes("return")) return "returned";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("exception") || normalized.includes("failed")) return "failed";
  return null;
}

export function customerDetailsFromAddress(address: ShippingAddress) {
  const { forename, surname } = splitName(address.fullName);
  return {
    Email: address.email ?? "shipping@rovexo.co.uk",
    Forename: forename,
    Surname: surname,
  };
}
