import {
  DEFAULT_MARKETPLACE_PRICING,
  marketplacePricingToBumpOptions,
  marketplacePricingToFeatureOptions,
  type MarketplacePricingSettings,
} from "@/lib/promotions/marketplace-pricing";

export type PromotionType = "bump" | "feature";

export type BumpDurationId = "24h" | "3d" | "7d" | "14d" | "28d";
export type FeatureDurationId = "7d" | "14d" | "30d";
export type PromotionDurationId = BumpDurationId | FeatureDurationId;

export type PromotionDurationOption = {
  id: PromotionDurationId;
  label: string;
  priceCents: number;
  priceLabel: string;
};

export type BumpDurationOption = PromotionDurationOption & {
  id: BumpDurationId;
  hours: number;
};

export type FeatureDurationOption = PromotionDurationOption & {
  id: FeatureDurationId;
  days: number;
};

/** Default boost tiers — overridden at runtime by Super Admin marketplace pricing. */
export const BUMP_DURATIONS: BumpDurationOption[] = marketplacePricingToBumpOptions(
  DEFAULT_MARKETPLACE_PRICING,
);

/** Minimum hours between bumps on the same listing. */
export const BUMP_COOLDOWN_HOURS = 1;

/** Maximum bump purchases per seller per rolling 24 hours. */
export const MAX_BUMPS_PER_DAY = 10;

/** Default Showcase / feature tier — overridden at runtime by Super Admin marketplace pricing. */
export const FEATURE_DURATIONS: FeatureDurationOption[] = marketplacePricingToFeatureOptions(
  DEFAULT_MARKETPLACE_PRICING,
);

export function getBumpDurations(
  pricing: MarketplacePricingSettings = DEFAULT_MARKETPLACE_PRICING,
): BumpDurationOption[] {
  return marketplacePricingToBumpOptions(pricing);
}

export function getFeatureDurations(
  pricing: MarketplacePricingSettings = DEFAULT_MARKETPLACE_PRICING,
): FeatureDurationOption[] {
  return marketplacePricingToFeatureOptions(pricing);
}

export function getBumpDuration(
  id: string,
  pricing: MarketplacePricingSettings = DEFAULT_MARKETPLACE_PRICING,
): BumpDurationOption | null {
  return getBumpDurations(pricing).find((option) => option.id === id) ?? null;
}

export function getFeatureDuration(
  id: string,
  pricing: MarketplacePricingSettings = DEFAULT_MARKETPLACE_PRICING,
): FeatureDurationOption | null {
  return getFeatureDurations(pricing).find((option) => option.id === id) ?? null;
}

export function getPromotionDuration(
  type: PromotionType,
  durationId: string,
  pricing: MarketplacePricingSettings = DEFAULT_MARKETPLACE_PRICING,
): BumpDurationOption | FeatureDurationOption | null {
  return type === "bump" ? getBumpDuration(durationId, pricing) : getFeatureDuration(durationId, pricing);
}

export function computeEndsAt(type: PromotionType, durationId: string, from = new Date()): Date | null {
  const duration = getPromotionDuration(type, durationId);
  if (!duration) return null;

  const endsAt = new Date(from);
  if (type === "bump") {
    endsAt.setHours(endsAt.getHours() + (duration as BumpDurationOption).hours);
  } else {
    endsAt.setDate(endsAt.getDate() + (duration as FeatureDurationOption).days);
  }
  return endsAt;
}
