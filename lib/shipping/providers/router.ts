import "server-only";

import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { parcel2GoAdapter } from "@/lib/shipping/pricing/parcel2go-adapter";
import { shippoAdapter } from "@/lib/shipping/pricing/shippo-adapter";
import { isShippoConfigured } from "@/lib/shipping/env";
import { isParcel2GoQuoteId } from "@/lib/shipping/pricing/parcel2go-mappers";
import { parseShippoQuoteId } from "@/lib/shipping/pricing/shippo-mappers";
import { ShippoService } from "@/lib/shipping/shippo/service";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import { isShippoFallbackForced } from "@/lib/shipping/providers/fallback-config";
import {
  listRecentFallbackEvents,
  logShippingFallbackEvent,
  mapFallbackEventRow,
} from "@/lib/shipping/providers/fallback-events";
import type {
  FallbackReason,
  ProviderHealthStatus,
  ShippingProviderId,
  ShippingProvidersSnapshot,
} from "@/lib/shipping/providers/types";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from "@/lib/shipping/pricing/provider";
import type { ShippingPricing, ShippingQuote } from "@/lib/shipping/types";

const PRIMARY_ID: ShippingProviderId = "parcel2go";
const FALLBACK_ID: ShippingProviderId = "shippo";
const PROVIDER_TIMEOUT_MS = 30_000;

export type RoutedQuoteResult = ShippingPricing & {
  providerId: ShippingProviderId;
  usedFallback: boolean;
  fallbackReason?: FallbackReason;
};

export type RoutedLabelResult = ShippingLabelResponse & {
  providerId: ShippingProviderId;
  usedFallback: boolean;
  fallbackReason?: FallbackReason;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Shipping provider request timed out")), ms);
    }),
  ]);
}

function mapQuoteFailureToFallback(reason?: ShippingQuoteResponse["reason"]): FallbackReason | null {
  switch (reason) {
    case "no_services":
      return "service_unavailable";
    case "invalid_address":
      return "carrier_unavailable";
    case "provider_not_configured":
      return "api_unavailable";
    default:
      return "api_unavailable";
  }
}

function mapLabelFailureToFallback(reason?: ShippingLabelResponse["reason"]): FallbackReason {
  return reason === "quote_expired" ? "service_unavailable" : "api_unavailable";
}

function markRecommendations(quotes: ShippingQuote[]): ShippingQuote[] {
  if (quotes.length === 0) return quotes;

  const cheapest = [...quotes].sort((a, b) => a.pricePence - b.pricePence)[0];
  const fastest = [...quotes].sort(
    (a, b) => a.estimatedDays.min - b.estimatedDays.min || a.pricePence - b.pricePence,
  )[0];

  return quotes.map((quote) => ({
    ...quote,
    recommended:
      quote.id === cheapest?.id
        ? "cheapest"
        : quote.id === fastest?.id
          ? "fastest"
          : undefined,
  }));
}

function toPricing(
  quotes: ShippingQuote[],
  providerId: ShippingProviderId,
  usedFallback: boolean,
  fallbackReason?: FallbackReason,
): RoutedQuoteResult {
  const marked = markRecommendations(quotes);
  return {
    quotes: marked,
    selectedQuoteId: marked[0]?.id ?? null,
    currency: "GBP",
    providerAvailable: marked.length > 0,
    providerId,
    usedFallback,
    fallbackReason,
  };
}

async function runFallbackQuotes(
  request: ShippingQuoteRequest,
  reason: FallbackReason,
): Promise<RoutedQuoteResult | null> {
  if (!isShippoConfigured()) return null;

  await logShippingFallbackEvent({
    operation: "quote",
    reason,
    primaryProvider: PRIMARY_ID,
    fallbackProvider: FALLBACK_ID,
    errorMessage: `Parcel2Go unavailable — activating Shippo fallback (${reason})`,
  });

  const response = await withTimeout(shippoAdapter.getQuotes(request), PROVIDER_TIMEOUT_MS);
  if (!response.available || response.quotes.length === 0) {
    return toPricing([], FALLBACK_ID, true, reason);
  }

  return toPricing(response.quotes, FALLBACK_ID, true, reason);
}

/**
 * Canonical quote fetch — Parcel2Go FIRST, Shippo ONLY on fallback.
 */
export async function fetchShippingQuotesRouted(
  request: ShippingQuoteRequest,
): Promise<RoutedQuoteResult> {
  const forcedFallback = await isShippoFallbackForced();

  if (forcedFallback) {
    const fallback = await runFallbackQuotes(request, "manual_override");
    if (fallback) return fallback;
  }

  if (!isParcel2GoConfigured()) {
    const fallback = await runFallbackQuotes(request, "primary_not_configured");
    return fallback ?? toPricing([], PRIMARY_ID, false);
  }

  try {
    const primary = await withTimeout(parcel2GoAdapter.getQuotes(request), PROVIDER_TIMEOUT_MS);
    if (primary.available && primary.quotes.length > 0) {
      return toPricing(primary.quotes, PRIMARY_ID, false);
    }

    const reason = mapQuoteFailureToFallback(primary.reason) ?? "api_unavailable";
    const fallback = await runFallbackQuotes(request, reason);
    if (fallback) return fallback;

    return toPricing([], PRIMARY_ID, false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const reason: FallbackReason = message.includes("timed out") ? "timeout" : "api_unavailable";
    const fallback = await runFallbackQuotes(request, reason);
    if (fallback) return fallback;
    return toPricing([], PRIMARY_ID, false);
  }
}

async function resolveShippoLabelQuote(
  request: ShippingLabelRequest,
): Promise<string | null> {
  if (parseShippoQuoteId(request.quoteId)) return request.quoteId;

  const quotes = await fetchShippingQuotesRouted({
    parcelTier: request.parcelTier,
    collectionAddress: request.collectionAddress,
    deliveryAddress: request.deliveryAddress,
    declaredValueGbp: request.declaredValueGbp,
  });

  const shippoQuote = quotes.quotes.find((quote) => quote.providerId === FALLBACK_ID);
  return shippoQuote?.id ?? quotes.quotes[0]?.id ?? null;
}

async function runFallbackLabel(
  request: ShippingLabelRequest,
  reason: FallbackReason,
): Promise<RoutedLabelResult | null> {
  if (!isShippoConfigured()) return null;

  await logShippingFallbackEvent({
    operation: "label",
    reason,
    primaryProvider: PRIMARY_ID,
    fallbackProvider: FALLBACK_ID,
    orderId: request.orderId,
    parcelId: request.parcelId,
    errorMessage: `Parcel2Go label failed — activating Shippo fallback (${reason})`,
  });

  const shippoQuoteId = await resolveShippoLabelQuote(request);
  if (!shippoQuoteId) {
    return {
      available: false,
      trackingNumber: null,
      barcode: null,
      qrPayload: null,
      pdfUrl: null,
      carrier: null,
      reason: "quote_expired",
      providerId: FALLBACK_ID,
      usedFallback: true,
      fallbackReason: reason,
    };
  }

  const response = await withTimeout(
    shippoAdapter.createLabel({ ...request, quoteId: shippoQuoteId }),
    PROVIDER_TIMEOUT_MS,
  );

  return {
    ...response,
    providerId: FALLBACK_ID,
    usedFallback: true,
    fallbackReason: reason,
  };
}

/**
 * Canonical label creation — Parcel2Go FIRST, Shippo ONLY on fallback.
 */
export async function createShippingLabelRouted(
  request: ShippingLabelRequest,
): Promise<RoutedLabelResult> {
  const forcedFallback = await isShippoFallbackForced();

  if (forcedFallback) {
    const fallback = await runFallbackLabel(request, "manual_override");
    if (fallback) return fallback;
  }

  // Explicit Shippo quote — only valid when fallback already selected
  if (parseShippoQuoteId(request.quoteId) && !isParcel2GoQuoteId(request.quoteId)) {
    const response = await withTimeout(shippoAdapter.createLabel(request), PROVIDER_TIMEOUT_MS);
    return { ...response, providerId: FALLBACK_ID, usedFallback: true };
  }

  if (!isParcel2GoConfigured()) {
    const fallback = await runFallbackLabel(request, "primary_not_configured");
    if (fallback) return fallback;
    return {
      available: false,
      trackingNumber: null,
      barcode: null,
      qrPayload: null,
      pdfUrl: null,
      carrier: null,
      reason: "provider_not_configured",
      providerId: PRIMARY_ID,
      usedFallback: false,
    };
  }

  try {
    const primary = await withTimeout(parcel2GoAdapter.createLabel(request), PROVIDER_TIMEOUT_MS);
    if (primary.available) {
      return { ...primary, providerId: PRIMARY_ID, usedFallback: false };
    }

    const reason = mapLabelFailureToFallback(primary.reason);
    const fallback = await runFallbackLabel(request, reason);
    if (fallback) return fallback;

    return { ...primary, providerId: PRIMARY_ID, usedFallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const reason: FallbackReason = message.includes("timed out") ? "timeout" : "api_unavailable";
    const fallback = await runFallbackLabel(request, reason);
    if (fallback) return fallback;

    return {
      available: false,
      trackingNumber: null,
      barcode: null,
      qrPayload: null,
      pdfUrl: null,
      carrier: null,
      reason: "quote_expired",
      providerId: PRIMARY_ID,
      usedFallback: false,
    };
  }
}

async function buildProviderHealth(
  provider: ShippingProvider,
  priority: number,
): Promise<ProviderHealthStatus> {
  const configured = provider.isConfigured();
  if (!configured) {
    return {
      id: provider.id as ShippingProviderId,
      name: provider.name,
      priority,
      configured: false,
      status: "unavailable",
      quoteStatus: "unavailable",
      labelStatus: "unavailable",
      trackingStatus: "unavailable",
      message: "Not configured",
    };
  }

  if (provider.id === PRIMARY_ID) {
    const health = await parcel2GoProvider.healthCheck().catch(() => null);
    const ok = health?.status === "healthy" || health?.oauthOk === true;
    return {
      id: PRIMARY_ID,
      name: provider.name,
      priority,
      configured: true,
      status: ok ? "healthy" : "degraded",
      quoteStatus: ok ? "healthy" : "degraded",
      labelStatus: ok ? "healthy" : "degraded",
      trackingStatus: ok ? "healthy" : "degraded",
      latencyMs: health?.latencyMs,
      message: health?.environment,
    };
  }

  const health = await ShippoService.checkHealth();
  return {
    id: FALLBACK_ID,
    name: provider.name,
    priority,
    configured: true,
    status: health.status === "healthy" ? "healthy" : "degraded",
    quoteStatus: health.status === "healthy" ? "healthy" : "degraded",
    labelStatus: health.status === "healthy" ? "healthy" : "degraded",
    trackingStatus: health.status === "healthy" ? "healthy" : "degraded",
    latencyMs: health.latencyMs,
    message: health.message,
  };
}

export async function getShippingProvidersSnapshot(): Promise<ShippingProvidersSnapshot> {
  const [primary, fallback, shippoFallbackForced, events] = await Promise.all([
    buildProviderHealth(parcel2GoAdapter, 1),
    buildProviderHealth(shippoAdapter, 2),
    isShippoFallbackForced(),
    listRecentFallbackEvents(25),
  ]);

  return {
    primary,
    fallback,
    shippoFallbackForced,
    recentFallbackEvents: events.map(mapFallbackEventRow),
  };
}

/** @deprecated Use fetchShippingQuotesRouted — kept for adapter tests. */
export function getPrimaryProviderServer(): ShippingProvider {
  return parcel2GoAdapter;
}
