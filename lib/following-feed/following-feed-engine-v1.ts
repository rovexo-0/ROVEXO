/**
 * ROVEXO HOMEPAGE FOLLOWING FEED ENGINE v1.0 — ABSOLUTE BLOOD CODE
 *
 * Marketplace discovery only — NOT a social network.
 * Consumes Follow Engine APIs · eligible listings · Badge · Verification.
 * Never creates follows · never inspects user_follows directly · never duplicates listing/product logic.
 */

export const FOLLOWING_FEED_ENGINE_V1 = {
  version: "1.0",
  lock: "lib/following-feed/following-feed-engine-v1.ts",
  store: "lib/following-feed/store.ts",
  apiPath: "/api/homepage/following-feed",
  absoluteLaw: "FOLLOW_ENGINE_THEN_FOLLOWING_FEED",
  purpose: "marketplace_discovery",
  rules: {
    oneEngine: true,
    oneStore: true,
    oneApi: true,
    oneFeedSource: true,
    neverCreateFollowRelationships: true,
    neverInspectFollowDatabaseDirectly: true,
    consumeFollowEngineApisOnly: true,
    noSocialStoriesPostsLikesComments: true,
    chronologicalNewestFirst: true,
    personalizedRankingFutureOnly: true,
    infiniteScroll: true,
    groupingSupported: true,
    authenticatedOnly: true,
    failSafeHomepageRemainsFunctional: true,
  },
  visibleEvents: [
    "NEW_LISTING",
    "PRICE_REDUCTION",
    "RELISTED_ITEM",
    "BACK_IN_STOCK",
    "SELLER_VERIFIED",
    "NEW_PUBLIC_BADGE",
    "FEATURED_LISTING",
  ] as const,
  doesNotDisplay: [
    "Stories",
    "Posts",
    "Photos",
    "Status updates",
    "Comments",
    "Likes",
    "Followers activity",
    "Personal messages",
    "Profile edits",
    "Private information",
  ] as const,
  doesNotModify: [
    "Follow Engine",
    "Notification Engine",
    "Rating Engine",
    "Reviews Engine",
    "Reputation Engine",
    "Badge Engine",
    "Orders",
    "Checkout",
    "Wallet",
    "Messaging",
    "Homepage Layout",
    "Search",
    "Categories",
    "Products",
    "Authentication",
  ] as const,
  emptyStateCopy: "Follow sellers to discover their latest listings.",
  failSafeCopy: "Unable to load Following Feed.",
} as const;

export type FollowingFeedEventType =
  (typeof FOLLOWING_FEED_ENGINE_V1.visibleEvents)[number];
