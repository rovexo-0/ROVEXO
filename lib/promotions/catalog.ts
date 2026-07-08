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
      title: "Bump",
      description: "Bump your listing to the top of search results.",
      benefits: ["Instant visibility boost", "Moves to the top", "No other changes"],
      theme: "green",
      icon: "arrow-up",
      previewVariant: "search-bump",
      badge: null,
      recommended: false,
      ctaLabel: "Select Bump",
      pricingMode: "fixed",
      priceCents: 149,
      durationLabel: "/ 1 Bump",
      checkoutKind: "bump",
      checkoutType: "bump",
      checkoutDurationId: "3d",
      animationEnabled: true,
    },
    {
      id: "featured",
      enabled: true,
      visible: true,
      priority: 2,
      title: "Featured",
      description: "Feature your listing in search and category pages.",
      benefits: ["Visible in more places", "Featured badge", "More views & attention"],
      theme: "gold",
      icon: "star",
      previewVariant: "category-featured",
      badge: null,
      recommended: false,
      ctaLabel: "Select Featured",
      pricingMode: "marketplace_showcase",
      priceCents: 499,
      durationLabel: "/ 7 days",
      checkoutKind: "feature",
      checkoutType: "feature",
      checkoutDurationId: "7d",
      animationEnabled: true,
    },
    {
      id: "boost",
      enabled: true,
      visible: true,
      priority: 3,
      title: "Boost",
      description: "Boost your listing across the platform and get more reach.",
      benefits: [
        "Shown in feeds & recommendations",
        "Smart algorithm",
        "More reach, more buyers",
      ],
      theme: "purple",
      icon: "rocket",
      previewVariant: "feed-boost",
      badge: "Recommended",
      recommended: true,
      ctaLabel: "Select Boost",
      pricingMode: "marketplace_boost_tier",
      marketplaceTierId: "7d",
      priceCents: 999,
      durationLabel: "/ 7 days",
      checkoutKind: "bump",
      checkoutType: "bump",
      checkoutDurationId: "7d",
      animationEnabled: true,
    },
    {
      id: "premium",
      enabled: true,
      visible: true,
      priority: 4,
      title: "Premium",
      description: "Get the highest visibility with priority in all key areas.",
      benefits: ["All Boost benefits", "Homepage placement", "Priority in all key areas"],
      theme: "pink",
      icon: "crown",
      previewVariant: "homepage-premium",
      badge: null,
      recommended: false,
      ctaLabel: "Select Premium",
      pricingMode: "fixed",
      priceCents: 1999,
      durationLabel: "/ 7 days",
      checkoutKind: "feature",
      checkoutType: "feature",
      checkoutDurationId: "7d",
      animationEnabled: true,
    },
    {
      id: "store_featured",
      enabled: true,
      visible: true,
      priority: 5,
      title: "Store Featured",
      description: "Promote your entire store and stand out from the crowd.",
      benefits: ["Featured on homepage", "Store badge", "More traffic to your store"],
      theme: "blue",
      icon: "storefront",
      previewVariant: "store-featured",
      badge: null,
      recommended: false,
      ctaLabel: "Select Store Featured",
      pricingMode: "fixed",
      priceCents: 2499,
      durationLabel: "/ 7 days",
      checkoutKind: "store_featured",
      animationEnabled: true,
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
