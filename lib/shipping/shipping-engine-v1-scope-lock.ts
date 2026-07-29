/**
 * ROVEXO SHIPPING ENGINE — V1.0 SCOPE LOCK
 *
 * OWNER APPROVED · SCOPE LOCKED · CLUSTER 3
 * Cod Sânge — Cluster 3 Shipping Engine
 *
 * Locks the smallest complete Shipping Engine for ROVEXO v1.0 Production Ready.
 * Preserves schema/APIs for v1.1 multi-parcel and advanced surfaces.
 *
 * Parent architecture freeze: `.cursor/rules/shipping-engine-v1-freeze.mdc`
 * Provider SSOT: `lib/shipping/providers/router.ts` → Sendcloud (+ Demo)
 */

export const SHIPPING_ENGINE_V1_SCOPE_LOCK = {
  version: "1.0",
  cluster: "CLUSTER_3_SHIPPING_ENGINE",
  status: "OWNER_APPROVED_SCOPE_LOCKED_PRODUCTION_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  productionReady: true,
  freezeApplied: true,

  equation:
    "CHECKOUT QUOTES + SENDCLOUD + AUTO SINGLE PARCEL + HUB LABEL + VIEWER + TRACKING = V1.0 SHIPPING",

  /**
   * Only these surfaces may be treated as live v1.0 shipping.
   * Everything else is Internal, Deferred, Legacy, or Future.
   */
  canonicalLive: [
    "Checkout Shipping Quotes",
    "Sendcloud Runtime",
    "Demo Shipping Adapter",
    "Auto Single Parcel",
    "Label Generation API",
    "ShippingLabelViewer",
    "Conversation Hub PRINT LABEL",
    "Conversation Hub VIEW LABEL",
    "Tracking Timeline",
    "Sendcloud Webhooks",
    "Tracking Sync",
    "Address fail-closed validation",
  ] as const,

  deferredToV1_1: [
    "ShipmentWizard UI",
    "Multi-Parcel Seller UI",
    "ShippingEngineHub",
    "ROVEXO Delivery",
    "EU / International carriers",
    "Shipping analytics",
    "Carrier comparison",
    "Advanced parcel workflows",
  ] as const,

  /** Keep — do not delete. Not marketed as live v1.0 UI. */
  preserveInternal: [
    "shipment_parcels schema",
    "shipment parcel APIs",
    "optional parcelId on label API",
    "post-payment auto parcel seed",
    "commerce parcel mappers",
  ] as const,

  ssot: {
    scopeLock: "lib/shipping/shipping-engine-v1-scope-lock.ts",
    providerRouter: "lib/shipping/providers/router.ts",
    labelGeneration: "lib/shipping/label-generation.server.ts",
    labelApi: "app/api/shipping/labels/route.ts",
    labelViewer: "features/shipping/components/ShippingLabelViewer.tsx",
    conversationHub: "features/inbox/components/ConversationHub.tsx",
    trackingBuilder: "lib/shipping/tracking.ts",
    webhooks: "lib/shipping/sendcloud/webhooks.ts",
    trackingSync: "lib/shipping/sendcloud-tracking-sync.server.ts",
    checkoutQuotes: "lib/checkout/shipping-quotes.server.ts",
    demoAdapter: "lib/shipping/pricing/demo-adapter.ts",
    addresses: "lib/shipping/addresses.ts",
  } as const,

  /**
   * Cluster 3 independent release package (INCLUDE-only when shipping).
   * Conversation Hub is a frozen Cluster 2 dependency — do not redesign Hub for this lock.
   */
  releaseInclude: [
    "lib/shipping/**",
    "lib/shipping/shipping-engine-v1-scope-lock.ts",
    "app/api/shipping/**",
    "app/api/webhooks/sendcloud/**",
    "app/api/cron/shipping/**",
    "app/api/checkout/shipping-quotes/**",
    "lib/checkout/shipping-quotes.server.ts",
    "features/shipping/components/ShippingLabelViewer.tsx",
    "styles/rovexo/shipping-label-viewer-v1.css",
    "tests/shipping-*.test.ts",
    "tests/sendcloud-*.test.ts",
    "tests/shipment-parcels-canonical.test.ts",
    "tests/blood-iv-shipping-lifecycle-v1.test.ts",
    "tests/phase6-shipping.test.ts",
    "tests/shipping-engine-v1-scope-lock.test.ts",
  ] as const,

  /** Deferred / orphan UI — exclude from Cluster 3 Production Release package. */
  releaseExclude: [
    "features/shipping/ShippingEngineHub.tsx",
    "features/shipping/components/ShipmentWizard.tsx",
    "features/shipping/components/ParcelCard.tsx",
    "features/shipping/components/ShipmentSummary.tsx",
    "features/orders/components/SellerOrderFulfillment.tsx",
    "features/shipping/components/ShippingCard.tsx",
    "features/shipping/components/TrackingCard.tsx",
    "features/shipping/components/LabelCard.tsx",
    "features/shipping/components/ShippingSummary.tsx",
    "features/shipping/components/ShippingTrackingTimeline.tsx",
    "styles/rovexo/shipping-engine.css",
  ] as const,

  rules: {
    oneLiveLabelPath: "Conversation Hub PRINT/VIEW → /api/shipping/labels → ShippingLabelViewer",
    oneProviderPath: "providers/router.ts → Sendcloud (or Demo)",
    autoSingleParcel: true,
    multiParcelUiForbiddenInV1: true,
    doNotDeleteSchemaOrApis: true,
    shippingHubNotLiveDestination: true,
    cluster2HubDependency: true,
  } as const,
} as const;

export type ShippingEngineV1ScopeLock = typeof SHIPPING_ENGINE_V1_SCOPE_LOCK;

export function assertShippingEngineV1ScopeLock(): typeof SHIPPING_ENGINE_V1_SCOPE_LOCK {
  if (!SHIPPING_ENGINE_V1_SCOPE_LOCK.approvedByOwner) {
    throw new Error("Shipping Engine v1.0 scope lock requires Owner approval.");
  }
  if (!SHIPPING_ENGINE_V1_SCOPE_LOCK.scopeLocked) {
    throw new Error("Shipping Engine v1.0 scope is not locked.");
  }
  return SHIPPING_ENGINE_V1_SCOPE_LOCK;
}
