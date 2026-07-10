import type { ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";
import type { ShippingPricing } from "@/lib/shipping/types";

/** Client-safe shipping pricing facade — live quotes resolve via server API routes. */
export async function fetchShippingQuotes(request: ShippingQuoteRequest): Promise<ShippingPricing> {
  void request;
  return {
    quotes: [],
    selectedQuoteId: null,
    currency: "GBP",
    providerAvailable: Boolean(
      process.env.SENDCLOUD_PUBLIC_KEY?.trim() && process.env.SENDCLOUD_SECRET_KEY?.trim(),
    ),
  };
}

export function getConfiguredProviders(): { id: string; name: string; configured: boolean }[] {
  return [
    {
      id: "sendcloud",
      name: "Sendcloud",
      configured: Boolean(
        process.env.SENDCLOUD_PUBLIC_KEY?.trim() && process.env.SENDCLOUD_SECRET_KEY?.trim(),
      ),
    },
  ];
}
