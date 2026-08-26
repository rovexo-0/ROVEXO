/**
 * ROVEXO Demand Engine V1.0 — frozen configuration.
 * Not UI-configurable. Not a score. Web listing-intent only.
 */

export const DEMAND_ENGINE_V1 = "demand-engine-v1" as const;

export const DEMAND_WINDOW_DAYS = 7 as const;
export const OFFER_THRESHOLD = 1 as const;
export const FAVOURITE_THRESHOLD = 3 as const;
export const QUALIFIED_VIEW_THRESHOLD = 10 as const;

export const MESSAGES_ENABLED = false as const;
export const SEARCH_DEMAND_ENABLED = false as const;
export const CATEGORY_DEMAND_ENABLED = false as const;

export const DEMAND_WINDOW_MS = DEMAND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const DEMAND_CARD_COPY = "🔥 In demand" as const;
export const DEMAND_DETAIL_TITLE_COPY = "🔥 In demand" as const;
export const DEMAND_DETAIL_BODY_COPY =
  "This item is receiving recent interest." as const;

export const DEMAND_ENGINE_CONFIG_V1 = {
  engine: DEMAND_ENGINE_V1,
  windowDays: DEMAND_WINDOW_DAYS,
  windowMs: DEMAND_WINDOW_MS,
  offerThreshold: OFFER_THRESHOLD,
  favouriteThreshold: FAVOURITE_THRESHOLD,
  qualifiedViewThreshold: QUALIFIED_VIEW_THRESHOLD,
  messagesEnabled: MESSAGES_ENABLED,
  searchDemandEnabled: SEARCH_DEMAND_ENABLED,
  categoryDemandEnabled: CATEGORY_DEMAND_ENABLED,
} as const;
