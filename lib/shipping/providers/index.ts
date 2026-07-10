export type {
  ProviderHealthStatus,
  ShippingOperation,
  ShippingProviderId,
  ShippingProvidersSnapshot,
} from "@/lib/shipping/providers/types";

export {
  createShippingLabelRouted,
  fetchShippingQuotesRouted,
  getPrimaryProviderServer,
  getShippingProvidersSnapshot,
} from "@/lib/shipping/providers/router";

export type { RoutedLabelResult, RoutedQuoteResult } from "@/lib/shipping/providers/router";
