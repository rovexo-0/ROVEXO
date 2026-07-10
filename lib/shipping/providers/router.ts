import "server-only";

import { sendcloudAdapter } from "@/lib/shipping/pricing/sendcloud-adapter";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import type {
  ProviderHealthStatus,
  ShippingProviderId,
  ShippingProvidersSnapshot,
} from "@/lib/shipping/providers/types";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
} from "@/lib/shipping/pricing/provider";
import type { ShippingPricing, ShippingQuote } from "@/lib/shipping/types";

const PROVIDER_ID: ShippingProviderId = "sendcloud";
const PROVIDER_TIMEOUT_MS = 30_000;

export type RoutedQuoteResult = ShippingPricing & {
  providerId: ShippingProviderId;
};

export type RoutedLabelResult = ShippingLabelResponse & {
  providerId: ShippingProviderId;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Shipping provider request timed out")), ms);
    }),
  ]);
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

function toPricing(quotes: ShippingQuote[], providerId: ShippingProviderId): RoutedQuoteResult {
  const marked = markRecommendations(quotes);
  return {
    quotes: marked,
    selectedQuoteId: marked[0]?.id ?? null,
    currency: "GBP",
    providerAvailable: marked.length > 0,
    providerId,
  };
}

/**
 * Canonical quote fetch — Sendcloud only.
 */
export async function fetchShippingQuotesRouted(
  request: ShippingQuoteRequest,
): Promise<RoutedQuoteResult> {
  if (!isSendcloudConfigured()) {
    return toPricing([], PROVIDER_ID);
  }

  try {
    const response = await withTimeout(sendcloudAdapter.getQuotes(request), PROVIDER_TIMEOUT_MS);
    if (response.available && response.quotes.length > 0) {
      return toPricing(response.quotes, PROVIDER_ID);
    }
    return toPricing([], PROVIDER_ID);
  } catch (error) {
    console.error("[shipping/router] Quote request failed:", error);
    return toPricing([], PROVIDER_ID);
  }
}

/**
 * Canonical label creation — Sendcloud only.
 */
export async function createShippingLabelRouted(
  request: ShippingLabelRequest,
): Promise<RoutedLabelResult> {
  if (!isSendcloudConfigured()) {
    return {
      available: false,
      trackingNumber: null,
      barcode: null,
      qrPayload: null,
      pdfUrl: null,
      carrier: null,
      reason: "provider_not_configured",
      providerId: PROVIDER_ID,
    };
  }

  try {
    const response = await withTimeout(sendcloudAdapter.createLabel(request), PROVIDER_TIMEOUT_MS);
    return { ...response, providerId: PROVIDER_ID };
  } catch (error) {
    console.error("[shipping/router] Label creation failed:", error);
    return {
      available: false,
      trackingNumber: null,
      barcode: null,
      qrPayload: null,
      pdfUrl: null,
      carrier: null,
      reason: "quote_expired",
      providerId: PROVIDER_ID,
    };
  }
}

async function buildProviderHealth(provider: ShippingProvider): Promise<ProviderHealthStatus> {
  const configured = provider.isConfigured();
  if (!configured) {
    return {
      id: PROVIDER_ID,
      name: provider.name,
      priority: 1,
      configured: false,
      status: "unavailable",
      quoteStatus: "unavailable",
      labelStatus: "unavailable",
      trackingStatus: "unavailable",
      message: "Not configured",
    };
  }

  const health = await SendcloudService.checkHealth();
  const ok = health.status === "healthy";
  return {
    id: PROVIDER_ID,
    name: provider.name,
    priority: 1,
    configured: true,
    status: ok ? "healthy" : "degraded",
    quoteStatus: ok ? "healthy" : "degraded",
    labelStatus: ok ? "healthy" : "degraded",
    trackingStatus: ok ? "healthy" : "degraded",
    latencyMs: health.latencyMs,
    message: health.baseUrl,
  };
}

export async function getShippingProvidersSnapshot(): Promise<ShippingProvidersSnapshot> {
  const provider = await buildProviderHealth(sendcloudAdapter);
  return { provider };
}

export function getPrimaryProviderServer(): ShippingProvider {
  return sendcloudAdapter;
}
