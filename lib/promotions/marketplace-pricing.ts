import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import type { BumpDurationOption, FeatureDurationOption } from "@/lib/promotions/config";

export const MARKETPLACE_PRICING_SETTINGS_KEY = "marketplace_pricing";

export type MarketplacePricingSettings = {
  boost: Array<{
    id: "3d" | "7d" | "14d" | "24h" | "28d";
    label: string;
    hours: number;
    priceCents: number;
  }>;
  showcase: {
    label: string;
    days: number;
    priceCents: number;
    durationId: "7d" | "14d" | "30d";
  };
  business?: {
    label: string;
    priceCents: number;
    interval: "month" | "year";
  };
};

export const DEFAULT_MARKETPLACE_PRICING: MarketplacePricingSettings = {
  boost: [
    { id: "7d", label: "7 days", hours: 168, priceCents: 130 },
    { id: "14d", label: "14 days", hours: 336, priceCents: 250 },
    { id: "28d", label: "28 days", hours: 672, priceCents: 450 },
  ],
  showcase: {
    label: "Featured Store",
    days: 7,
    priceCents: 600,
    durationId: "7d",
  },
  business: {
    label: "Verified Business",
    priceCents: 999,
    interval: "month",
  },
};

function formatPriceLabel(cents: number): string {
  return `£${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function marketplacePricingToBumpOptions(
  settings: MarketplacePricingSettings,
): BumpDurationOption[] {
  return settings.boost.map((entry) => ({
    id: entry.id,
    label: entry.label,
    hours: entry.hours,
    priceCents: entry.priceCents,
    priceLabel: formatPriceLabel(entry.priceCents),
  }));
}

export function marketplacePricingToFeatureOptions(
  settings: MarketplacePricingSettings,
): FeatureDurationOption[] {
  const { showcase } = settings;
  return [
    {
      id: showcase.durationId,
      label: showcase.label,
      days: showcase.days,
      priceCents: showcase.priceCents,
      priceLabel: formatPriceLabel(showcase.priceCents),
    },
  ];
}

export async function getMarketplacePricingSettings(): Promise<MarketplacePricingSettings> {
  return getPlatformSetting(MARKETPLACE_PRICING_SETTINGS_KEY, DEFAULT_MARKETPLACE_PRICING);
}

export async function saveMarketplacePricingSettings(input: {
  actorId: string;
  settings: MarketplacePricingSettings;
}): Promise<void> {
  await updatePlatformSetting({
    actorId: input.actorId,
    key: MARKETPLACE_PRICING_SETTINGS_KEY,
    value: input.settings,
  });
}
