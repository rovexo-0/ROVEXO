/**
 * ROVEXO FOLLOW NOTIFICATIONS ENGINE v1.0 — ABSOLUTE BLOOD CODE
 *
 * ONLY generates follow-related notifications.
 * NEVER creates follow relationships.
 * NEVER modifies Follow Engine.
 * Consumes certified Follow / listing / badge events only.
 *
 * Delivery SSOT remains lib/notifications (emitSmartNotification).
 */

export const FOLLOW_NOTIFICATIONS_ENGINE_V1 = {
  version: "1.0",
  lock: "lib/follow-notifications/follow-notifications-engine-v1.ts",
  store: "lib/follow-notifications/store.ts",
  apiPath: "/api/follow-notifications",
  delivery: "lib/notifications/events.ts",
  absoluteLaw: "FOLLOW_ENGINE_CREATES_EVENTS_NOTIFICATION_ENGINE_CONSUMES",
  rules: {
    oneEngine: true,
    oneStore: true,
    oneApi: true,
    oneNotificationSource: true,
    neverCreateFollowRelationships: true,
    neverInspectFollowDatabaseDirectly: true,
    consumeFollowEventsOnly: true,
    noSpamThrottle: true,
    groupingSupported: true,
    readUnreadArchived: true,
    queueRetry: true,
    marketingOffByDefault: true,
    marketplaceOnByDefault: true,
  },
  supportedEvents: [
    "FollowCreated",
    "FollowRemoved",
    "NewListingPublished",
    "ListingRelisted",
    "PriceReduced",
    "SellerBadgeAwarded",
    "SellerVerified",
  ] as const,
  doesNotModify: [
    "Follow Engine",
    "Rating Engine",
    "Reviews Engine",
    "Reputation Engine",
    "Badge Engine",
    "Orders",
    "Wallet",
    "Payments",
    "Messaging",
    "Homepage",
    "Search",
    "Products",
    "Categories",
  ] as const,
} as const;

export type FollowNotificationEventType =
  (typeof FOLLOW_NOTIFICATIONS_ENGINE_V1.supportedEvents)[number];
