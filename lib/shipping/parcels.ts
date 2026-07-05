import {
  LEGACY_PARCEL_SIZES,
  PARCEL_TIERS,
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
    id: "letter",
    label: "Letter",
    description: "Large letter — documents, thin items, small accessories.",
    maxWeightKg: 0.75,
    maxDimensionsCm: { length: 35, width: 25, height: 2.5 },
  },
  {
    id: "small_parcel",
    label: "Small Parcel",
    description: "Fits a large letterbox — phone cases, jewellery, small accessories.",
    maxWeightKg: 2,
    maxDimensionsCm: { length: 45, width: 35, height: 16 },
  },
  {
    id: "medium_parcel",
    label: "Medium Parcel",
    description: "Shoebox size — clothing, shoes, books, small electronics.",
    maxWeightKg: 10,
    maxDimensionsCm: { length: 61, width: 46, height: 46 },
  },
  {
    id: "large_parcel",
    label: "Large Parcel",
    description: "Cabin-bag size — coats, homeware, larger bundles.",
    maxWeightKg: 20,
    maxDimensionsCm: { length: 120, width: 60, height: 60 },
  },
  {
    id: "xl_parcel",
    label: "XL Parcel",
    description: "Bulky items — small furniture, large appliances, oversized parcels.",
    maxWeightKg: 30,
    maxDimensionsCm: { length: 150, width: 100, height: 100 },
  },
];

const LEGACY_TO_TIER: Record<LegacyParcelSize, ParcelTier> = {
  small: "small_parcel",
  medium: "medium_parcel",
  large: "large_parcel",
  xl: "xl_parcel",
};

const CATEGORY_TIER_HINTS: Record<string, ParcelTier> = {
  jewellery: "letter",
  phones: "small_parcel",
  electronics: "medium_parcel",
  "home-garden": "large_parcel",
  furniture: "xl_parcel",
  vehicles: "xl_parcel",
};

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

/** AI-style recommendation from weight, dimensions, category, and legacy size. */
export function recommendParcelTier(input: ParcelDetectionInput): ParcelTier {
  if (input.manualTier) return input.manualTier;

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
    return {
      recommendedTier: recommendParcelTier({ ...input, manualTier: undefined }),
      appliedTier: input.manualTier,
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
  return map[tier] ?? "medium";
}

export function parcelTierLabel(tier: ParcelTier): string {
  return PARCEL_TIER_OPTIONS.find((option) => option.id === tier)?.label ?? tier;
}

export function isParcelTier(value: string): value is ParcelTier {
  return (PARCEL_TIERS as readonly string[]).includes(value);
}

export function isLegacyParcelSize(value: string): value is LegacyParcelSize {
  return (LEGACY_PARCEL_SIZES as readonly string[]).includes(value);
}
