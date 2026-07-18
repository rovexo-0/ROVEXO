/**
 * ROVEXO v1.0 — PARCEL SYSTEM FREEZE (Absolute Final).
 * ONLY four options: Small · Medium · Large · Extra Large.
 * No custom · no weight input · no dimensions input · no free text.
 */
import {
  type LegacyParcelSize,
  type ParcelDetectionInput,
  type ParcelDetectionResult,
  type ParcelDimensions,
  type ParcelTier,
} from "@/lib/shipping/types";

export const PARCEL_TIER_OPTIONS: {
  id: ParcelTier;
  label: string;
  description: string;
  maxWeightKg: number;
  maxDimensionsCm: { length: number; width: number; height: number };
}[] = [
  {
    id: "small_parcel",
    label: "Small Parcel",
    description: "Fits a large letterbox.",
    maxWeightKg: 2,
    maxDimensionsCm: { length: 45, width: 35, height: 16 },
  },
  {
    id: "medium_parcel",
    label: "Medium Parcel",
    description: "Shoebox size.",
    maxWeightKg: 10,
    maxDimensionsCm: { length: 61, width: 46, height: 46 },
  },
  {
    id: "large_parcel",
    label: "Large Parcel",
    description: "Cabin-bag size.",
    maxWeightKg: 20,
    maxDimensionsCm: { length: 120, width: 60, height: 60 },
  },
  {
    id: "xl_parcel",
    label: "Extra Large Parcel",
    description: "Bulky items.",
    maxWeightKg: 30,
    maxDimensionsCm: { length: 150, width: 100, height: 100 },
  },
];

/** Display labels locked for v1.0 — Small / Medium / Large / Extra Large. */
export const PARCEL_DISPLAY: Record<string, string> = {
  letter: "Small Parcel",
  small: "Small Parcel",
  small_parcel: "Small Parcel",
  medium: "Medium Parcel",
  medium_parcel: "Medium Parcel",
  large: "Large Parcel",
  large_parcel: "Large Parcel",
  xl: "Extra Large Parcel",
  xl_parcel: "Extra Large Parcel",
  custom: "Extra Large Parcel",
};

const LEGACY_TO_TIER: Record<LegacyParcelSize, ParcelTier> = {
  small: "small_parcel",
  medium: "medium_parcel",
  large: "large_parcel",
  xl: "xl_parcel",
  custom: "xl_parcel",
};

const CATEGORY_TIER_HINTS: Record<string, ParcelTier> = {
  jewellery: "small_parcel",
  phones: "small_parcel",
  electronics: "medium_parcel",
  "home-garden": "large_parcel",
  furniture: "xl_parcel",
  vehicles: "xl_parcel",
};

function normalizeTier(tier: ParcelTier | string): ParcelTier {
  if (tier === "letter") return "small_parcel";
  if (
    tier === "small_parcel" ||
    tier === "medium_parcel" ||
    tier === "large_parcel" ||
    tier === "xl_parcel"
  ) {
    return tier;
  }
  return "medium_parcel";
}

function tierFromDimensions(dimensions: ParcelDimensions): ParcelTier {
  const { weightKg, lengthCm, widthCm, heightCm } = dimensions;
  const sorted = [lengthCm, widthCm, heightCm].sort((a, b) => b - a);

  for (const option of PARCEL_TIER_OPTIONS) {
    const max = option.maxDimensionsCm;
    const maxSorted = [max.length, max.width, max.height].sort((a, b) => b - a);
    if (
      weightKg <= option.maxWeightKg &&
      sorted[0]! <= maxSorted[0]! &&
      sorted[1]! <= maxSorted[1]! &&
      sorted[2]! <= maxSorted[2]!
    ) {
      return option.id;
    }
  }

  return "xl_parcel";
}

function tierFromCategory(categorySlug?: string | null): ParcelTier | null {
  if (!categorySlug) return null;
  const slug = categorySlug.toLowerCase();
  for (const [key, tier] of Object.entries(CATEGORY_TIER_HINTS)) {
    if (slug.includes(key)) return tier;
  }
  return null;
}

/** Recommendation from category / legacy size only — no user weight/dim UI. */
export function recommendParcelTier(input: ParcelDetectionInput): ParcelTier {
  if (input.manualTier) return normalizeTier(input.manualTier);

  if (
    input.dimensions?.weightKg != null &&
    input.dimensions.lengthCm != null &&
    input.dimensions.widthCm != null &&
    input.dimensions.heightCm != null
  ) {
    return tierFromDimensions({
      weightKg: input.dimensions.weightKg,
      lengthCm: input.dimensions.lengthCm,
      widthCm: input.dimensions.widthCm,
      heightCm: input.dimensions.heightCm,
    });
  }

  const categoryTier = tierFromCategory(input.categorySlug);
  if (categoryTier) return categoryTier;

  if (input.legacyParcelSize) return LEGACY_TO_TIER[input.legacyParcelSize];

  return "medium_parcel";
}

export function detectParcelTier(input: ParcelDetectionInput): ParcelDetectionResult {
  if (input.manualTier) {
    const applied = normalizeTier(input.manualTier);
    return {
      recommendedTier: recommendParcelTier({ ...input, manualTier: undefined }),
      appliedTier: applied,
      source: "manual",
      confidence: "high",
    };
  }

  if (
    input.dimensions?.weightKg != null &&
    input.dimensions.lengthCm != null &&
    input.dimensions.widthCm != null &&
    input.dimensions.heightCm != null
  ) {
    const tier = tierFromDimensions({
      weightKg: input.dimensions.weightKg,
      lengthCm: input.dimensions.lengthCm,
      widthCm: input.dimensions.widthCm,
      heightCm: input.dimensions.heightCm,
    });
    return { recommendedTier: tier, appliedTier: tier, source: "dimensions", confidence: "high" };
  }

  const categoryTier = tierFromCategory(input.categorySlug);
  if (categoryTier) {
    return {
      recommendedTier: categoryTier,
      appliedTier: categoryTier,
      source: "category",
      confidence: "medium",
    };
  }

  if (input.legacyParcelSize) {
    const tier = LEGACY_TO_TIER[input.legacyParcelSize];
    return { recommendedTier: tier, appliedTier: tier, source: "legacy", confidence: "medium" };
  }

  const tier = "medium_parcel";
  return { recommendedTier: tier, appliedTier: tier, source: "ai", confidence: "low" };
}

export function mapLegacyParcelSize(size: LegacyParcelSize): ParcelTier {
  return LEGACY_TO_TIER[size];
}

export function mapTierToLegacySize(tier: ParcelTier): LegacyParcelSize {
  const map: Partial<Record<ParcelTier, LegacyParcelSize>> = {
    letter: "small",
    small_parcel: "small",
    medium_parcel: "medium",
    large_parcel: "large",
    xl_parcel: "xl",
  };
  return map[normalizeTier(tier)] ?? "medium";
}

export function parcelTierLabel(tier: ParcelTier | string): string {
  return PARCEL_DISPLAY[tier] ?? PARCEL_TIER_OPTIONS.find((o) => o.id === tier)?.label ?? "Medium Parcel";
}

/**
 * Internal shippable dimensions for Sendcloud — never shown as user inputs.
 */
export function parcelTierToDimensions(tier: ParcelTier): ParcelDimensions {
  const normalized = normalizeTier(tier);
  const option =
    PARCEL_TIER_OPTIONS.find((entry) => entry.id === normalized) ?? PARCEL_TIER_OPTIONS[1]!;
  const { maxDimensionsCm, maxWeightKg } = option;
  return {
    weightKg: Math.max(0.1, Math.round(maxWeightKg * 0.5 * 100) / 100),
    lengthCm: maxDimensionsCm.length,
    widthCm: maxDimensionsCm.width,
    heightCm: maxDimensionsCm.height,
  };
}

export function isParcelTier(value: string): value is ParcelTier {
  return (
    value === "letter" ||
    value === "small_parcel" ||
    value === "medium_parcel" ||
    value === "large_parcel" ||
    value === "xl_parcel"
  );
}

export function isLegacyParcelSize(value: string): value is LegacyParcelSize {
  return value === "small" || value === "medium" || value === "large" || value === "xl" || value === "custom";
}
