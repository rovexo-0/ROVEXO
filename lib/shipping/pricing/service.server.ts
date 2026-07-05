import "server-only";

import { shippoAdapter } from "@/lib/shipping/pricing/shippo-adapter";
import type { ShippingProvider, ShippingQuoteRequest, ShippingQuoteResponse } from "@/lib/shipping/pricing/provider";
import type { ShippingPricing, ShippingQuote } from "@/lib/shipping/types";

const providers: ShippingProvider[] = [shippoAdapter];

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

export async function fetchShippingQuotesServer(request: ShippingQuoteRequest): Promise<ShippingPricing> {
  const responses: ShippingQuoteResponse[] = await Promise.all(
    providers.map((provider) => provider.getQuotes(request)),
  );

  const quotes = markRecommendations(responses.flatMap((response) => response.quotes));
  const providerAvailable = responses.some((response) => response.available);

  return {
    quotes,
    selectedQuoteId: quotes[0]?.id ?? null,
    currency: "GBP",
    providerAvailable,
  };
}

export function getConfiguredProvidersServer(): { id: string; name: string; configured: boolean }[] {
  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    configured: provider.isConfigured(),
  }));
}

export function getPrimaryProviderServer(): ShippingProvider {
  return shippoAdapter;
}
