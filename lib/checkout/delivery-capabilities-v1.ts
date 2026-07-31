/**
 * ROVEXO Checkout — Delivery UI capabilities (visual feature flags).
 *
 * Collection Point / Service Point delivery is frozen behind
 * SERVICE POINT ENGINE v1.0 Gate 0 (`SERVICE_POINT_ENGINE_ENABLED`).
 *
 * Even if `collectionPoint` is flipped true for UI readiness, the option
 * stays hidden until Gate 0 PASS (Sendcloud API integration certified).
 */

import { isServicePointEngineEnabled } from "@/lib/shipping/service-point-engine-v1";

export type CheckoutDeliveryCapabilities = {
  /**
   * UI readiness for Collection Point / Service Point delivery.
   * Still requires SERVICE_POINT_ENGINE_ENABLED=true (Gate 0).
   */
  collectionPoint: boolean;
  shipToHome: boolean;
};

export const CHECKOUT_DELIVERY_CAPABILITIES: CheckoutDeliveryCapabilities = {
  collectionPoint: false,
  shipToHome: true,
};

/** Service Point / Collection Point delivery — Gate 0 fail closed. */
export function isCheckoutCollectionPointEnabled(): boolean {
  return (
    CHECKOUT_DELIVERY_CAPABILITIES.collectionPoint && isServicePointEngineEnabled()
  );
}
