/**
 * ROVEXO v1.0 — PARCEL SYSTEM.
 * Canonical measurements SSOT: `lib/shipping/canonical-parcel-size-v1.ts`
 * Customer-facing V1.0: Small · Medium · Large (Sendcloud-derived UX tiers).
 * Extra Large: historical resolve only — not Sell-selectable.
 * No custom · no weight input · no dimensions input · no free text.
 * Missing / invalid Parcel Size → fail closed (never invent medium_parcel).
 */
import {
  CANONICAL_PARCEL_SIZES_V1,
  canonicalParcelMeasurements,
  getCanonicalParcelSizeById,
  getCanonicalParcelSizeByTier,
  resolveCanonicalParcelSize,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  type LegacyParcelSize,
  type ParcelDetectionInput,
  type ParcelDetectionResult,
  type ParcelDimensions,
  type ParcelTier,
} from "@/lib/shipping/types";

/** Engine tier table — customer-facing + historical xl for quote/label continuity. */
const ENGINE_PARCEL_DEFS = [
  ...CANONICAL_PARCEL_SIZES_V1,
  getCanonicalParcelSizeById("xl")!,
].filter(Boolean);

/** Derived from canonical Parcel Size SSOT — do not edit measurements here. */
export const PARCEL_TIER_OPTIONS: {
  id: ParcelTier;
  label: string;
  description: string;
  maxWeightKg: number;
  maxDimensionsCm: { length: number; width: number; height: number };
  /** Exact shippable weight (kg) from canonical SSOT. */
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}[] = ENGINE_PARCEL_DEFS.map((def) => ({
  id: def.tierId,
  label: `${def.displayName} Parcel`,
  description: def.sellSubtitle,
  maxWeightKg: def.maxWeightKg,
  maxDimensionsCm: { ...def.maxDimensionsCm },
  weightKg: def.weightKg,
  lengthCm: def.lengthCm,
  widthCm: def.widthCm,
  heightCm: def.heightCm,
}));

/** Display labels — historical Extra Large retained for old records only. */
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
  "home-garden": "medium_parcel",
  furniture: "medium_parcel",
  vehicles: "medium_parcel",
};

function normalizeTier(tier: ParcelTier | string): ParcelTier | null {
  if (tier === "letter") return "small_parcel";
  const def = getCanonicalParcelSizeByTier(tier);
  return def?.tierId ?? null;
}

function requireNormalizedTier(tier: ParcelTier | string): ParcelTier {
  const normalized = normalizeTier(tier);
  if (!normalized) {
    throw new Error(`Unknown parcel tier: ${String(tier)}`);
  }
  return normalized;
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
  if (input.manualTier) {
    return requireNormalizedTier(input.manualTier);
  }

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

  // Recommendation helper only — never used as shipping measurement SSOT.
  return "medium_parcel";
}

export function detectParcelTier(input: ParcelDetectionInput): ParcelDetectionResult {
  if (input.manualTier) {
    const applied = requireNormalizedTier(input.manualTier);
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
  return map[requireNormalizedTier(tier)] ?? "medium";
}

export function parcelTierLabel(tier: ParcelTier | string): string {
  return PARCEL_DISPLAY[tier] ?? PARCEL_TIER_OPTIONS.find((o) => o.id === tier)?.label ?? "Parcel";
}

/**
 * Exact canonical shippable dimensions for a Parcel Size / tier.
 * NEVER fabricates half-max weights or substitutes another size.
 */
export function parcelTierToDimensions(tier: ParcelTier): ParcelDimensions {
  const def = getCanonicalParcelSizeByTier(tier);
  if (!def) {
    throw new Error(`Unknown parcel tier for measurements: ${String(tier)}`);
  }
  return canonicalParcelMeasurements(def);
}

/** Canonical fail-closed copy when label generation lacks real parcel measurements (P7.21). */
export const PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL =
  "Shipping label generation requires parcel weight and dimensions.";

/**
 * Resolve complete real parcel measurements from shipment_parcels (canonical).
 * Returns null when any required field is missing/invalid — never fabricates tier maxima.
 */
export function resolveCompleteParcelMeasurements(input: {
  weightKg?: number | null;
  dimensions?: {
    lengthCm?: number | null;
    widthCm?: number | null;
    heightCm?: number | null;
  } | null;
}): ParcelDimensions | null {
  const weightKg = input.weightKg;
  const lengthCm = input.dimensions?.lengthCm;
  const widthCm = input.dimensions?.widthCm;
  const heightCm = input.dimensions?.heightCm;

  if (
    weightKg == null ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    lengthCm == null ||
    !Number.isFinite(lengthCm) ||
    lengthCm <= 0 ||
    widthCm == null ||
    !Number.isFinite(widthCm) ||
    widthCm <= 0 ||
    heightCm == null ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0
  ) {
    return null;
  }

  return {
    weightKg: Number(weightKg),
    lengthCm: Number(lengthCm),
    widthCm: Number(widthCm),
    heightCm: Number(heightCm),
  };
}

/**
 * Label-path measurement resolution (canonical data flow).
 *
 * 1. Prefer persisted shipment_parcels measurements (seller/order truth).
 * 2. Else hydrate from the order's parcel_tier via canonical Parcel Size SSOT.
 * 3. Else null → fail closed (P7.21). Never invent medium_parcel measurements.
 */
export function resolveLabelParcelMeasurements(input: {
  weightKg?: number | null;
  dimensions?: {
    lengthCm?: number | null;
    widthCm?: number | null;
    heightCm?: number | null;
  } | null;
  parcelTier?: ParcelTier | string | null;
}): ParcelDimensions | null {
  const fromParcel = resolveCompleteParcelMeasurements({
    weightKg: input.weightKg,
    dimensions: input.dimensions,
  });
  if (fromParcel) return fromParcel;

  const tierRaw = typeof input.parcelTier === "string" ? input.parcelTier.trim() : "";
  if (!tierRaw) return null;

  const def = resolveCanonicalParcelSize(tierRaw);
  if (!def) return null;
  return canonicalParcelMeasurements(def);
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

/**
 * Resolve listing `parcel_size` (legacy or canonical) to a ParcelTier.
 * Missing / unknown → null (FAIL CLOSED). Never invent small/medium fallbacks.
 */
export function resolveListingParcelTier(
  parcelSize: string | null | undefined,
  _fallback?: ParcelTier,
): ParcelTier | null {
  void _fallback;
  const def = resolveCanonicalParcelSize(parcelSize);
  return def?.tierId ?? null;
}
