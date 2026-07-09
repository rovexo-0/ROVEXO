import "server-only";

import { fetchShippingQuotesRouted } from "@/lib/shipping/providers/router";import { parcel2GoAdapter } from "@/lib/shipping/pricing/parcel2go-adapter";
import { shippoAdapter } from "@/lib/shipping/pricing/shippo-adapter";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { isShippoConfigured } from "@/lib/shipping/env";
import type { ShippingProvider, ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";
import type { ShippingPricing } from "@/lib/shipping/types";

export {
  createShippingLabelRouted,
  fetchShippingQuotesRouted,
  getPrimaryProviderServer,
  getShippingProvidersSnapshot,
} from "@/lib/shipping/providers/router";

/** @deprecated Internal — use fetchShippingQuotesRouted */
export async function fetchShippingQuotesServer(request: ShippingQuoteRequest): Promise<ShippingPricing> {
  const result = await fetchShippingQuotesRouted(request);
  return {
    quotes: result.quotes,
    selectedQuoteId: result.selectedQuoteId,
    currency: result.currency,
    providerAvailable: result.providerAvailable,
  };
}

export function getConfiguredProvidersServer(): { id: string; name: string; configured: boolean; priority: number }[] {
  const providers: Array<{ provider: ShippingProvider; priority: number }> = [
    { provider: parcel2GoAdapter, priority: 1 },
    { provider: shippoAdapter, priority: 2 },
  ];

  return providers.map(({ provider, priority }) => ({
    id: provider.id,
    name: provider.name,
    configured: provider.isConfigured(),
    priority,
  }));
}

export function activeProviders(): ShippingProvider[] {
  const providers: ShippingProvider[] = [];
  if (isParcel2GoConfigured()) providers.push(parcel2GoAdapter);
  if (isShippoConfigured()) providers.push(shippoAdapter);
  return providers;
}
