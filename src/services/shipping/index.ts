export type { ShippingProvider } from "@/src/services/shipping/provider";
export { parcel2GoProvider, Parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
export { checkParcel2GoAuthHealth } from "@/src/services/shipping/parcel2go/auth-health";
export {
  isParcel2GoConfigured,
  validateParcel2GoEnvironmentOnStartup,
  PARCEL2GO_PRODUCTION_AUTH_URL,
  PARCEL2GO_PRODUCTION_API_URL,
  PARCEL2GO_SANDBOX_AUTH_URL,
  PARCEL2GO_SANDBOX_API_URL,
} from "@/src/services/shipping/env";
export type {
  ShippingQuote,
  ShippingRate,
  Shipment,
  Label,
  TrackingEvent,
  TrackingStatus,
  ShippingHealthResult,
  ShippingProviderId,
} from "@/src/services/shipping/types";
export {
  AuthenticationError,
  QuoteError,
  ShipmentError,
  TrackingError,
  WebhookError,
  NetworkError,
  RateLimitError,
  ValidationError,
  NotImplementedError,
  isShippingError,
  toShippingError,
} from "@/src/services/shipping/errors";
export { ShippingLogger, createCorrelationId } from "@/src/services/shipping/logger";

import type { ShippingProvider } from "@/src/services/shipping/provider";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";

const PROVIDERS: ShippingProvider[] = [parcel2GoProvider];

export function getShippingProviders(): ShippingProvider[] {
  return PROVIDERS;
}

export function getPrimaryShippingProvider(): ShippingProvider {
  return parcel2GoProvider;
}
