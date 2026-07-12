import {
  getMarketplacePricingSettings,
  type MarketplacePricingSettings,
} from "@/lib/promotions/marketplace-pricing";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";

export const PROMOTION_CATALOG_SETTINGS_KEY = "promotion_catalog_v1";

export type PromotionCatalogId =
  | "bump"
  | "featured"
  | "boost"
  | "premium"
  | "store_featured";

export type PromotionThemeId = "green" | "gold" | "purple" | "pink" | "blue";

export type PromotionIconId = "arrow-up" | "star" | "rocket" | "crown" | "storefront";

export type PromotionPreviewVariant =
  | "search-bump"
  | "category-featured"
  | "feed-boost"
  | "homepage-premium"
  | "store-featured";

export type PromotionPricingMode =
  | "fixed"
  | "marketplace_boost_tier"
  | "marketplace_showcase";

export type PromotionCheckoutKind = "bump" | "feature" | "store_featured" | "none";

export type PromotionCatalogEntry = {
  id: PromotionCatalogId;
  enabled: boolean;
  visible: boolean;
  priority: number;
  title: string;
  description: string;
  benefits: string[];
  theme: PromotionThemeId;
  icon: PromotionIconId;
  previewVariant: PromotionPreviewVariant;
  badge: string | null;
  recommended: boolean;
  ctaLabel: string;
  pricingMode: PromotionPricingMode;
  /** Used when pricingMode is fixed, or as fallback when marketplace tier is missing. */
  priceCents: number;
  durationLabel: string;
  /** Used when pricingMode is marketplace_boost_tier. */
  marketplaceTierId?: "24h" | "3d" | "7d";
  checkoutKind: PromotionCheckoutKind;
  checkoutType?: "bump" | "feature";
  checkoutDurationId?: string;
  animationEnabled: boolean;
};

export type PromotionTrustItem = {
  id: string;
  title: string;
  description: string;
  icon: "shield" | "bolt" | "chart" | "headset";
  enabled: boolean;
};

export type PromotionCatalogConfig = {
  version: 1;
  pageTitle: string;
  pageSubtitle: string;
  howItWorksLabel: string;
  howItWorksHref: string;
  entries: PromotionCatalogEntry[];
  trustItems: PromotionTrustItem[];
};

export const PROMOTION_THEME_COLORS: Record<
  PromotionThemeId,
  { accent: string; accentMuted: string; accentForeground: string }
> = {
  green: {
    accent: "#059669",
    accentMuted: "rgb(5 150 105 / 0.12)",
    accentForeground: "#ffffff",
  },
  gold: {
    accent: "#d97706",
    accentMuted: "rgb(217 119 6 / 0.12)",
    accentForeground: "#ffffff",
  },
  purple: {
    accent: "var(--ds-color-primary)",
    accentMuted: "rgb(147 51 234 / 0.12)",
    accentForeground: "#ffffff",
  },
  pink: {
    accent: "#db2777",
    accentMuted: "rgb(219 39 119 / 0.12)",
    accentForeground: "#ffffff",
  },
  blue: {
    accent: "#2563eb",
    accentMuted: "rgb(37 99 235 / 0.12)",
    accentForeground: "#ffffff",
  },
};

export const DEFAULT_PROMOTION_CATALOG: PromotionCatalogConfig = {
  version: 1,
  pageTitle: "Promote your listing or store",
  pageSubtitle:
    "Choose the perfect way to get more visibility, reach more buyers and grow faster.",
  howItWorksLabel: "How it works",
  howItWorksHref: "/help/promotions",
  entries: [
    {
      id: "bump",
      enabled: true,
      visible: true,
      priority: 1,
      title: "Bump Listing",
      description: "Refresh one listing and move it higher in search results.",
      benefits: ["Higher search placement", "Instant refresh", "BUMP badge on listing"],
      theme: "green",
      icon: "arrow-up",
      previewVariant: "search-bump",
      badge: "BUMP",
      recommended: false,
      ctaLabel: "Select Listing",
      pricingMode: "marketplace_boost_tier",
      marketplaceTierId: "7d",
      priceCents: 130,
      durationLabel: "7 Days",
      checkoutKind: "bump",
      checkoutType: "bump",
      checkoutDurationId: "7d",
      animationEnabled: true,
    },
    {
      id: "store_featured",
      enabled: true,
      visible: true,
      priority: 2,
      title: "Featured Store",
      description:
        "Display your complete Store on the Homepage Featured Store carousel. Every ACTIVE listing from the Store is included automatically.",
      benefits: ["Homepage Featured Store", "Visit Store + Follow", "All active listings included"],
      theme: "blue",
      icon: "storefront",
      previewVariant: "store-featured",
      badge: null,
      recommended: false,
      ctaLabel: "Activate Featured Store",
      pricingMode: "marketplace_showcase",
      priceCents: 600,
      durationLabel: "7 Days",
      checkoutKind: "store_featured",
      animationEnabled: true,
    },
    {
      id: "boost",
      enabled: true,
      visible: true,
      priority: 3,
      title: "Boost Package",
      description: "Promote your complete Store automatically.",
      benefits: [
        "Featured Store",
        "Automatic Bump for every ACTIVE listing",
        "Automatic activation",
        "Automatic expiration",
      ],
      theme: "purple",
      icon: "rocket",
      previewVariant: "feed-boost",
      badge: null,
      recommended: true,
      ctaLabel: "Choose Package",
      pricingMode: "fixed",
      priceCents: 1200,
      durationLabel: "From 7 Days",
      checkoutKind: "none",
      animationEnabled: true,
    },
    {
      id: "featured",
      enabled: false,
      visible: false,
      priority: 4,
      title: "Featured Listing",
      description: "Legacy listing feature — use Bump Listing or Boost Package.",
      benefits: [],
      theme: "gold",
      icon: "star",
      previewVariant: "category-featured",
      badge: null,
      recommended: false,
      ctaLabel: "Select Featured",
      pricingMode: "marketplace_showcase",
      priceCents: 600,
      durationLabel: "7 Days",
      checkoutKind: "feature",
      checkoutType: "feature",
      checkoutDurationId: "7d",
      animationEnabled: false,
    },
    {
      id: "premium",
      enabled: false,
      visible: false,
      priority: 5,
      title: "Premium",
      description: "Legacy premium listing promotion.",
      benefits: [],
      theme: "pink",
      icon: "crown",
      previewVariant: "homepage-premium",
      badge: null,
      recommended: false,
      ctaLabel: "Select Premium",
      pricingMode: "fixed",
      priceCents: 1999,
      durationLabel: "7 Days",
      checkoutKind: "feature",
      checkoutType: "feature",
      checkoutDurationId: "7d",
      animationEnabled: false,
    },
  ],
  trustItems: [
    {
      id: "secure",
      title: "Safe & Secure",
      description: "100% secure payments",
      icon: "shield",
      enabled: true,
    },
    {
      id: "instant",
      title: "Instant Activation",
      description: "Your promotion starts right away",
      icon: "bolt",
      enabled: true,
    },
    {
      id: "visibility",
      title: "More Visibility",
      description: "Get seen by more buyers",
      icon: "chart",
      enabled: true,
    },
    {
      id: "support",
      title: "Dedicated Support",
      description: "We're here to help you",
      icon: "headset",
      enabled: true,
    },
  ],
};

export function formatPromotionPrice(cents: number): string {
  return `£${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function resolveEntryPriceCents(
  entry: PromotionCatalogEntry,
  pricing: MarketplacePricingSettings,
): number {
  if (entry.pricingMode === "marketplace_showcase") {
    return pricing.showcase.priceCents;
  }

  if (entry.pricingMode === "marketplace_boost_tier" && entry.marketplaceTierId) {
    const tier = pricing.boost.find((item) => item.id === entry.marketplaceTierId);
    if (tier) return tier.priceCents;
  }

  return entry.priceCents;
}

export type ResolvedPromotionCatalogEntry = PromotionCatalogEntry & {
  resolvedPriceCents: number;
  resolvedPriceLabel: string;
};

export type ResolvedPromotionCatalog = Omit<PromotionCatalogConfig, "entries"> & {
  entries: ResolvedPromotionCatalogEntry[];
};

export function resolvePromotionCatalog(
  config: PromotionCatalogConfig,
  pricing: MarketplacePricingSettings,
): ResolvedPromotionCatalog {
  const entries = config.entries
    .filter((entry) => entry.enabled && entry.visible)
    .map((entry) => {
      const resolvedPriceCents = resolveEntryPriceCents(entry, pricing);
      return {
        ...entry,
        resolvedPriceCents,
        resolvedPriceLabel: formatPromotionPrice(resolvedPriceCents),
      };
    })
    .sort((left, right) => left.priority - right.priority);

  return {
    ...config,
    entries,
    trustItems: config.trustItems.filter((item) => item.enabled),
  };
}

export async function getPromotionCatalogConfig(): Promise<PromotionCatalogConfig> {
  return getPlatformSetting(PROMOTION_CATALOG_SETTINGS_KEY, DEFAULT_PROMOTION_CATALOG);
}

export async function getResolvedPromotionCatalog(): Promise<ResolvedPromotionCatalog> {
  const [config, pricing] = await Promise.all([
    getPromotionCatalogConfig(),
    getMarketplacePricingSettings(),
  ]);
  return resolvePromotionCatalog(config, pricing);
}

export async function savePromotionCatalogConfig(input: {
  actorId: string;
  config: PromotionCatalogConfig;
}): Promise<void> {
  await updatePlatformSetting({
    actorId: input.actorId,
    key: PROMOTION_CATALOG_SETTINGS_KEY,
    value: input.config,
  });
}

export function getPromotionCatalogEntry(
  config: PromotionCatalogConfig,
  id: PromotionCatalogId,
): PromotionCatalogEntry | null {
  return config.entries.find((entry) => entry.id === id) ?? null;
}
