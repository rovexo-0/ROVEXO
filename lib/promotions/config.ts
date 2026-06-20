export type PromotionType = "bump" | "feature";

export type BumpDurationId = "24h" | "3d" | "7d";
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

export const BUMP_DURATIONS: BumpDurationOption[] = [
  { id: "24h", label: "24 hours", hours: 24, priceCents: 199, priceLabel: "£1.99" },
  { id: "3d", label: "3 days", hours: 72, priceCents: 499, priceLabel: "£4.99" },
  { id: "7d", label: "7 days", hours: 168, priceCents: 999, priceLabel: "£9.99" },
];

export const FEATURE_DURATIONS: FeatureDurationOption[] = [
  { id: "7d", label: "7 days", days: 7, priceCents: 999, priceLabel: "£9.99" },
  { id: "14d", label: "14 days", days: 14, priceCents: 1499, priceLabel: "£14.99" },
  { id: "30d", label: "30 days", days: 30, priceCents: 2499, priceLabel: "£24.99" },
];

export function getBumpDuration(id: string): BumpDurationOption | null {
  return BUMP_DURATIONS.find((option) => option.id === id) ?? null;
}

export function getFeatureDuration(id: string): FeatureDurationOption | null {
  return FEATURE_DURATIONS.find((option) => option.id === id) ?? null;
}

export function getPromotionDuration(
  type: PromotionType,
  durationId: string,
): BumpDurationOption | FeatureDurationOption | null {
  return type === "bump" ? getBumpDuration(durationId) : getFeatureDuration(durationId);
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
