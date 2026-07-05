import type { ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";
import type { ShippingPricing } from "@/lib/shipping/types";

/** Client-safe shipping pricing facade — live quotes resolve via server API routes. */
export async function fetchShippingQuotes(request: ShippingQuoteRequest): Promise<ShippingPricing> {
  void request;
  return {
    quotes: [],
    selectedQuoteId: null,
    currency: "GBP",
    providerAvailable: Boolean(process.env.SHIPPO_API_KEY?.trim()),
  };
}

export function getConfiguredProviders(): { id: string; name: string; configured: boolean }[] {
  return [
    {
      id: "shippo",
      name: "GoShippo",
      configured: Boolean(process.env.SHIPPO_API_KEY?.trim()),
    },
  ];
}
