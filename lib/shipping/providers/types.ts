/**
 * ROVEXO Shipping Provider Architecture — canonical types.
 *
 * Hierarchy: ShippingEngine → SendcloudAdapter
 */

export const SHIPPING_PROVIDER_IDS = ["sendcloud"] as const;
export type ShippingProviderId = (typeof SHIPPING_PROVIDER_IDS)[number];

export type ShippingOperation = "quote" | "label" | "tracking";

export type ProviderHealthStatus = {
  id: ShippingProviderId;
  name: string;
  priority: number;
  configured: boolean;
  status: "healthy" | "degraded" | "unavailable";
  quoteStatus: "healthy" | "degraded" | "unavailable";
  labelStatus: "healthy" | "degraded" | "unavailable";
  trackingStatus: "healthy" | "degraded" | "unavailable";
  latencyMs?: number;
  message?: string;
};

export type ShippingProvidersSnapshot = {
  provider: ProviderHealthStatus;
};
