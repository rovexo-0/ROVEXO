/**
 * ROVEXO Checkout — Delivery UI capabilities (visual feature flags).
 *
 * Collection Point remains fully implemented in Checkout; this flag only
 * controls whether the Collection Point option is rendered.
 *
 * Flip `collectionPoint` to `true` when the Collection Point module is
 * production-ready — no Checkout rewrite required.
 */

export type CheckoutDeliveryCapabilities = {
  /** TEMPORARY HIDE — set `true` to restore Collection Point in Checkout UI. */
  collectionPoint: boolean;
  shipToHome: boolean;
};

export const CHECKOUT_DELIVERY_CAPABILITIES: CheckoutDeliveryCapabilities = {
  collectionPoint: false,
  shipToHome: true,
};

export function isCheckoutCollectionPointEnabled(): boolean {
  return CHECKOUT_DELIVERY_CAPABILITIES.collectionPoint;
}
