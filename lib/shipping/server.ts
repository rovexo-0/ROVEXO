import "server-only";

import { generateShippingLabel } from "@/lib/shipping/labels/service.server";
import { fetchShippingQuotesServer } from "@/lib/shipping/pricing/service.server";
import { saveShippingLabel, saveShippingQuotes } from "@/lib/shipping/store";
import type { ShippingLabelRequest, ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";

export async function fetchOrderShippingQuotes(orderId: string, request: ShippingQuoteRequest) {
  const pricing = await fetchShippingQuotesServer(request);
  await saveShippingQuotes({ orderId, pricing });
  return pricing;
}

export async function generateOrderShippingLabel(orderId: string, request: ShippingLabelRequest) {
  const { label, internalPlatformFeePence } = await generateShippingLabel(request);
  return saveShippingLabel({ orderId, label, internalPlatformFeePence });
}
