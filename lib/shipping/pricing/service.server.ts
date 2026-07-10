import "server-only";

import { fetchShippingQuotesRouted } from "@/lib/shipping/providers/router";
import { sendcloudAdapter } from "@/lib/shipping/pricing/sendcloud-adapter";
import { isSendcloudConfigured } from "@/lib/shipping/env";
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
  return [
    {
      id: sendcloudAdapter.id,
      name: sendcloudAdapter.name,
      configured: sendcloudAdapter.isConfigured(),
      priority: 1,
    },
  ];
}

export function activeProviders(): ShippingProvider[] {
  return isSendcloudConfigured() ? [sendcloudAdapter] : [];
}
