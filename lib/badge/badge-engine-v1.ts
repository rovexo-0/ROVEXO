/**
 * ROVEXO BADGE ENGINE v1.0 — ABSOLUTE BLOOD CODE
 *
 * ONLY automatic badge assignment / removal.
 * NEVER calculates reputation.
 * NEVER modifies Rating / Reviews / Reputation Engines.
 * Consumes ONLY Reputation Engine verified signals.
 *
 * Absolute law: BADGES ARE EARNED — NEVER MANUALLY AWARDED
 * (except Super Admin emergency override with immutable audit).
 */

export const BADGE_ENGINE_V1 = {
  version: "1.0",
  lock: "lib/badge/badge-engine-v1.ts",
  store: "lib/badge/store.ts",
  apiPath: "/api/badges/[userId]",
  adminApiPath: "/api/admin/badges",
  consumes: "lib/reputation/store.ts",
  absoluteLaw: "BADGES_ARE_EARNED_NEVER_MANUALLY_AWARDED",
  rules: {
    oneEngine: true,
    oneStore: true,
    oneApi: true,
    automaticAssignment: true,
    automaticRemoval: true,
    noReputationCalculation: true,
    noDuplicateCalculations: true,
    superAdminEmergencyOverrideOnly: true,
    immutableAuditLog: true,
    failSafePreserveLastVerified: true,
  },
  doesNotModify: [
    "Rating Engine",
    "Reviews Engine",
    "Reputation Engine",
    "Follow Engine",
    "Orders",
    "Wallet",
    "Payments",
    "Messaging",
    "Homepage",
    "Search",
    "Notifications",
    "Categories",
    "Products",
  ] as const,
} as const;

export const BADGE_IDS = [
  "verified_seller",
  "verified_business",
  "trusted_seller",
  "top_seller",
  "fast_shipper",
  "fast_responder",
  "reliable_buyer",
  "trusted_buyer",
  "community_contributor",
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

export type BadgeDefinition = {
  id: BadgeId;
  label: string;
  tooltip: string;
  audience: "seller" | "buyer" | "both";
  status: "active" | "future";
};

export const BADGE_CATALOG: Record<BadgeId, BadgeDefinition> = {
  verified_seller: {
    id: "verified_seller",
    label: "Verified Seller",
    tooltip: "Identity verification approved.",
    audience: "seller",
    status: "active",
  },
  verified_business: {
    id: "verified_business",
    label: "Verified Business",
    tooltip: "Business verification approved.",
    audience: "seller",
    status: "active",
  },
  trusted_seller: {
    id: "trusted_seller",
    label: "Trusted Seller",
    tooltip: "Strong sales history, high ratings, and low cancellation risk.",
    audience: "seller",
    status: "active",
  },
  top_seller: {
    id: "top_seller",
    label: "Top Seller",
    tooltip: "Top-tier marketplace performance from certified reputation signals.",
    audience: "seller",
    status: "active",
  },
  fast_shipper: {
    id: "fast_shipper",
    label: "Fast Shipper",
    tooltip: "Consistently dispatches orders quickly.",
    audience: "seller",
    status: "active",
  },
  fast_responder: {
    id: "fast_responder",
    label: "Fast Responder",
    tooltip: "High response rate with fast average reply times.",
    audience: "seller",
    status: "active",
  },
  reliable_buyer: {
    id: "reliable_buyer",
    label: "Reliable Buyer",
    tooltip: "Reliable purchase and completion behaviour.",
    audience: "buyer",
    status: "active",
  },
  trusted_buyer: {
    id: "trusted_buyer",
    label: "Trusted Buyer",
    tooltip: "Trusted purchasing history with strong reliability signals.",
    audience: "buyer",
    status: "active",
  },
  community_contributor: {
    id: "community_contributor",
    label: "Community Contributor",
    tooltip: "Optional future community contribution badge.",
    audience: "both",
    status: "future",
  },
};

export type BadgeEngineEventType = "BadgeAwarded" | "BadgeRemoved" | "BadgeOverrideApplied";

export type BadgeEngineEvent = {
  type: BadgeEngineEventType;
  userId: string;
  badgeId: BadgeId;
  at: string;
  reason?: string;
};
