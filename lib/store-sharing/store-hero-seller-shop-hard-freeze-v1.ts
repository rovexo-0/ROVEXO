/**
 * ROVEXO STORE HERO + SELLER SHOP — HARD FREEZE v1.0
 *
 * Two frozen surfaces with separated responsibilities.
 * Store Hero = EXTERNAL SHARE / OG ONLY
 * Seller Shop = NATIVE SHOP EXPERIENCE
 * Neither may replace the other.
 *
 * Unlock Store Hero: END STORE HERO FREEZE
 * Unlock Seller Shop: END SELLER SHOP FREEZE
 * Unlock both: both phrases, independently.
 */

import {
  STORE_HERO_NATIVE_SHOP_SHARE_PATH_PREFIX,
  STORE_HERO_SHARE_CARD_CANONICAL,
  STORE_HERO_SHARE_CARD_END_PHRASE,
  STORE_HERO_SHARE_CARD_FREEZE,
  STORE_HERO_SHARE_CARD_FREEZE_STATUS,
  STORE_HERO_WEB_OG_URL_PREFIX,
} from "@/lib/store-sharing/store-hero-share-card-freeze-v1";

export const STORE_HERO_SELLER_SHOP_HARD_FREEZE = "ACTIVE" as const;
export const STORE_HERO_SELLER_SHOP_HARD_FREEZE_STATUS =
  "ROVEXO STORE HERO + SELLER SHOP — HARD FREEZE ACTIVE" as const;

export const SELLER_SHOP_FREEZE_STATUS = "ROVEXO SELLER SHOP — FROZEN" as const;
export const SELLER_SHOP_END_PHRASE = "END SELLER SHOP FREEZE" as const;

export const SELLER_SHOP_CANONICAL = {
  screen: "SellerShopScreen",
  ssot: "apps/rovexo-android/app/src/main/java/com/rovexo/app/shop/NativeAndroidSellerShopV1.kt",
  screenFile: "apps/rovexo-android/app/src/main/java/com/rovexo/app/ui/shop/SellerShopScreen.kt",
} as const;

export const WEB_VISIT_STORE_CANONICAL = {
  route: "/store/[slug]",
  page: "features/store/components/StoreVisitPageV2.tsx",
  lock: "lib/store/visit-store-final-ui-lock-v1.ts",
} as const;

export const IN_APP_STORE_SHARE_CARD = {
  component: "StoreShareCard",
  file: "features/store-sharing/StoreShareCard.tsx",
} as const;

export const STORE_HERO_SELLER_SHOP_URL_CONTRACTS = {
  webOg: STORE_HERO_WEB_OG_URL_PREFIX,
  nativeShopSharePath: STORE_HERO_NATIVE_SHOP_SHARE_PATH_PREFIX,
} as const;

export const STORE_HERO_SELLER_SHOP_UNLOCK = {
  storeHero: STORE_HERO_SHARE_CARD_END_PHRASE,
  sellerShop: SELLER_SHOP_END_PHRASE,
} as const;

export const STORE_HERO_SELLER_SHOP_HARD_FREEZE_SNAPSHOT = {
  freeze: STORE_HERO_SELLER_SHOP_HARD_FREEZE,
  status: STORE_HERO_SELLER_SHOP_HARD_FREEZE_STATUS,
  storeHero: {
    freeze: STORE_HERO_SHARE_CARD_FREEZE,
    status: STORE_HERO_SHARE_CARD_FREEZE_STATUS,
    scope: "SHARE_OG_ONLY",
    renderer: STORE_HERO_SHARE_CARD_CANONICAL.renderer,
    endPhrase: STORE_HERO_SHARE_CARD_END_PHRASE,
  },
  sellerShop: {
    status: SELLER_SHOP_FREEZE_STATUS,
    screen: SELLER_SHOP_CANONICAL.screen,
    ssot: SELLER_SHOP_CANONICAL.ssot,
    endPhrase: SELLER_SHOP_END_PHRASE,
  },
  webVisitStore: WEB_VISIT_STORE_CANONICAL,
  inAppShareCard: IN_APP_STORE_SHARE_CARD,
  urls: STORE_HERO_SELLER_SHOP_URL_CONTRACTS,
} as const;
