/**
 * ROVEXO STORE HERO CARD v1.0 — SHARE / OG ONLY — HARD FREEZE
 *
 * STATUS: FROZEN · HARD FREEZE · ACTIVE
 * Unlock phrase: END STORE HERO FREEZE
 *
 * External OG / social preview only. Not an in-app Store component.
 * One structure for every seller. Dynamic public data may change.
 * Structure, layout, branding, pipeline, URLs, and security may not.
 */

import {
  STORE_HERO_FEATURED_SLOT_COUNT,
  STORE_HERO_SHARE_CARD,
  STORE_HERO_SHARE_CARD_SIZE,
  STORE_HERO_SHARE_CARD_STRUCTURE_IDS,
  STORE_HERO_STAT_SLOT_COUNT,
  STORE_HERO_TRUST_SLOT_COUNT,
} from "@/lib/store-sharing/store-hero-share-card-v1";
import { STORE_SHARE_PRODUCTION_URL_PREFIX } from "@/lib/store-sharing/store-share-v1";

export const STORE_HERO_SHARE_CARD_FREEZE = "ACTIVE" as const;
export const STORE_HERO_SHARE_CARD_FREEZE_NAME = "STORE_HERO_SHARE_CARD_v1.0" as const;
export const STORE_HERO_SHARE_CARD_FREEZE_STATUS =
  "ROVEXO STORE HERO CARD v1.0 — SHARE / OG ONLY — FROZEN" as const;
export const STORE_HERO_SHARE_CARD_END_PHRASE = "END STORE HERO FREEZE" as const;
export const STORE_HERO_SHARE_CARD_SCOPE = "SHARE_OG_ONLY" as const;

export const STORE_HERO_SHARE_CARD_CANONICAL = {
  renderer: "lib/store-sharing/store-hero-share-card-v1.ts",
  ssot: "lib/store-sharing/store-share-v1.ts",
  ogRoute: "app/api/seo/og/route.ts",
  metadata: "lib/seo/engine/metadata.ts",
  publicProfile: "app/(platform)/user/[username]/page.tsx",
  id: STORE_HERO_SHARE_CARD,
  size: STORE_HERO_SHARE_CARD_SIZE,
  structureIds: STORE_HERO_SHARE_CARD_STRUCTURE_IDS,
  featuredSlots: STORE_HERO_FEATURED_SLOT_COUNT,
  trustSlots: STORE_HERO_TRUST_SLOT_COUNT,
  statSlots: STORE_HERO_STAT_SLOT_COUNT,
} as const;

export const STORE_HERO_WEB_OG_URL_PREFIX = STORE_SHARE_PRODUCTION_URL_PREFIX;
export const STORE_HERO_NATIVE_SHOP_SHARE_PATH_PREFIX = "/store/" as const;

export const STORE_HERO_SHARE_CARD_FORBIDDEN_DUPLICATES = [
  "StoreHeroShareCardV2",
  "StoreHeroShareCardNew",
  "PremiumStoreHeroCard",
  "BusinessStoreHeroCard",
  "VerifiedStoreHeroCard",
  "SocialStoreCard",
  "WhatsAppStoreCard",
  "FacebookStoreCard",
  "XStoreCard",
] as const;

export const STORE_HERO_SHARE_CARD_LOCKED = [
  "visual composition",
  "1200×630 dimensions",
  "typography hierarchy",
  "spacing",
  "layout",
  "seller identity placement",
  "avatar/logo placement",
  "cover image placement",
  "rating placement",
  "statistics placement",
  "trust indicators",
  "featured listings placement",
  "ROVEXO branding",
  "image rendering architecture",
  "OG rendering architecture",
  "image generation pipeline",
  "public-data model",
  "security rules",
  "fallback behavior",
  "caching behavior",
  "URL behavior",
  "metadata behavior",
] as const;
