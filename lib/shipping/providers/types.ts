/**
 * ROVEXO Shipping Provider Architecture — canonical types.
 *
 * Hierarchy: ShippingEngine → ShippingProvider (router) → Adapters
 *   Parcel2GoAdapter (priority 1)
 *   ShippoAdapter    (priority 2 — fallback only)
 */

export const SHIPPING_PROVIDER_IDS = ["parcel2go", "shippo"] as const;
export type ShippingProviderId = (typeof SHIPPING_PROVIDER_IDS)[number];

export const FALLBACK_REASONS = [
  "api_unavailable",
  "timeout",
  "carrier_unavailable",
  "service_unavailable",
  "manual_override",
  "primary_not_configured",
] as const;

export type FallbackReason = (typeof FALLBACK_REASONS)[number];

export type ShippingOperation = "quote" | "label" | "tracking";

export type FallbackEventInput = {
  operation: ShippingOperation;
  reason: FallbackReason;
  primaryProvider: ShippingProviderId;
  fallbackProvider: ShippingProviderId;
  orderId?: string;
  parcelId?: string;
  errorMessage?: string;
};

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
  primary: ProviderHealthStatus;
  fallback: ProviderHealthStatus;
  shippoFallbackForced: boolean;
  recentFallbackEvents: Array<{
    id: string;
    operation: ShippingOperation;
    reason: FallbackReason;
    primaryProvider: ShippingProviderId;
    fallbackProvider: ShippingProviderId;
    orderId: string | null;
    parcelId: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
};
