import "server-only";

import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { parcel2GoAdapter } from "@/lib/shipping/pricing/parcel2go-adapter";
import { shippoAdapter } from "@/lib/shipping/pricing/shippo-adapter";
import { isShippoConfigured } from "@/lib/shipping/env";
import type { ShippingProvider, ShippingQuoteRequest, ShippingQuoteResponse } from "@/lib/shipping/pricing/provider";
import type { ShippingPricing, ShippingQuote } from "@/lib/shipping/types";

function activeProviders(): ShippingProvider[] {
  const providers: ShippingProvider[] = [];
  if (isParcel2GoConfigured()) providers.push(parcel2GoAdapter);
  if (isShippoConfigured()) providers.push(shippoAdapter);
  return providers;
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

export async function fetchShippingQuotesServer(request: ShippingQuoteRequest): Promise<ShippingPricing> {
  const providers = activeProviders();
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
  return activeProviders().map((provider) => ({
    id: provider.id,
    name: provider.name,
    configured: provider.isConfigured(),
  }));
}

export function getPrimaryProviderServer(): ShippingProvider {
  if (isParcel2GoConfigured()) return parcel2GoAdapter;
  return shippoAdapter;
}
