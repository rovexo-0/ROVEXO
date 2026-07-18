import "server-only";

import { fetchShippingQuotesRouted } from "@/lib/shipping/providers/router";
import { sendcloudAdapter } from "@/lib/shipping/pricing/sendcloud-adapter";
import { demoShippingAdapter } from "@/lib/shipping/pricing/demo-adapter";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { mustUseDemoShipping } from "@/lib/full-demo/security";
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
  if (mustUseDemoShipping()) return [demoShippingAdapter];
  return isSendcloudConfigured() ? [sendcloudAdapter] : [];
}
