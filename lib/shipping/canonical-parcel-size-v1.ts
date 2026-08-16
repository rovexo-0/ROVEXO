/**
 * ROVEXO Parcel Size v1.0 — SINGLE SOURCE OF TRUTH (Owner-approved bands).
 *
 * Customer-facing UX tiers: SMALL · MEDIUM · LARGE
 * Stored IDs (unchanged): small · medium · large
 * EXTRA_LARGE: historical resolve only — not Sell-selectable.
 *
 * Quote / new-order / label representation uses an in-band weight
 * (approved band ceiling). It must NEVER use Sendcloud catalog maxima
 * as the physical package (legacy bug: small→2.000 · medium→20.000 · large→15.001).
 *
 * ROVEXO tier names ≠ Sendcloud shipping-method names.
 * Carrier eligibility stays dynamic via Sendcloud V2/V3.
 */

import type { LegacyParcelSize, ParcelDimensions, ParcelTier } from "@/lib/shipping/types";
import { EVRI_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/evri-label-engine-certification-v1";
import { ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";

export const PARCEL_SIZE_CANONICAL_V1 = {
  version: "v1.1",
  equation: "SELL → Owner Parcel Size → in-band Sendcloud quote → checkout → label",
  moneyAdjacent: false,
  source: "OWNER_APPROVED_PARCEL_SIZE",
  note: "ROVEXO tier names are UX labels — not Sendcloud service names",
} as const;

/**
 * Owner-approved customer bands (Sell UI + quote/label representation).
 * quoteWeightKg is the in-band Sendcloud representation — not a seller-measured
 * parcel and not a Sendcloud catalog maximum.
 */
export const OWNER_APPROVED_PARCEL_BANDS_V1 = {
  small: {
    minWeightKg: 0,
    maxWeightKg: 1,
    quoteWeightKg: 1,
    maxDimensionsCm: { length: 45, width: 35, height: 16 },
  },
  medium: {
    minWeightKg: 1,
    maxWeightKg: 2,
    quoteWeightKg: 2,
    maxDimensionsCm: { length: 61, width: 46, height: 46 },
  },
  large: {
    minWeightKg: 2,
    maxWeightKg: 15,
    quoteWeightKg: 15,
    maxLengthCm: 120,
    /**
     * Sendcloud V3 `parcels[].dimensions` requires concrete W/H.
     * Not seller-measured. Not shown on Sell cards.
     * Cross-section is the existing live-proven API payload (not a UI max).
     */
    sendcloudRequiredCrossSectionCm: { width: 35, height: 16 },
  },
} as const;

/**
 * Live Sendcloud catalog maxima — reference only.
 * FORBIDDEN as ROVEXO quote weight, Sell UI copy, or new-order seed.
 */
export const SENDCLOUD_DERIVED_PARCEL_LIMITS_V1 = {
  small: {
    sendcloudCodes: [
      "royal_mailv2:tracked_24/size=s",
      "royal_mailv2:tracked_48/size=s",
    ] as const,
    maxWeightKg: 2.001,
    maxDimensionsCm: { length: 45, width: 35, height: 16 },
    widthHeightPublished: true,
  },
  medium: {
    sendcloudCodes: [
      "royal_mailv2:tracked_24/size=m",
      "royal_mailv2:tracked_48/size=m",
    ] as const,
    maxWeightKg: 20.001,
    maxDimensionsCm: { length: 61, width: 46, height: 46 },
    widthHeightPublished: true,
  },
  large: {
    sendcloudCodes: ["hermes_c2c_gb:a2a/pickup"] as const,
    maxWeightKg: 15.001,
    maxLengthCm: 120,
    maxWidthCm: null as number | null,
    maxHeightCm: null as number | null,
    quoteEnvelopeCm: { length: 120, width: 35, height: 16 },
    widthHeightPublished: false,
  },
} as const;

export type CanonicalParcelSizeId = "small" | "medium" | "large" | "xl";

export type CanonicalParcelSizeDefinition = {
  id: CanonicalParcelSizeId;
  tierId: Exclude<ParcelTier, "letter">;
  legacyId: Exclude<LegacyParcelSize, "custom">;
  displayName: string;
  sellLabel: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA LARGE";
  /** Sell card line 1 under the title — weight band only. */
  sellWeightLine: string;
  /** Sell card line 2 — max dimensions only. */
  sellDimensionsLine: string;
  /** Alias of sellWeightLine for existing option.description wiring. */
  sellSubtitle: string;
  /** In-band Sendcloud quote/label weight — never catalog-max synthesis. */
  weightKg: number;
  minWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  unit: { weight: "kg"; dimension: "cm" };
  maxWeightKg: number;
  maxDimensionsCm: { length: number; width: number; height: number };
  customerFacing: boolean;
  ownerApproved: boolean;
  sendcloudDerived: boolean;
};

const SMALL = OWNER_APPROVED_PARCEL_BANDS_V1.small;
const MEDIUM = OWNER_APPROVED_PARCEL_BANDS_V1.medium;
const LARGE = OWNER_APPROVED_PARCEL_BANDS_V1.large;

function largeSendcloudDimensions(): { lengthCm: number; widthCm: number; heightCm: number } {
  return {
    lengthCm: LARGE.maxLengthCm,
    widthCm: LARGE.sendcloudRequiredCrossSectionCm.width,
    heightCm: LARGE.sendcloudRequiredCrossSectionCm.height,
  };
}

/**
 * Customer-facing V1.0 catalogue — exactly SMALL · MEDIUM · LARGE.
 * EXTRA LARGE is not selectable.
 */
export const CANONICAL_PARCEL_SIZES_V1: readonly CanonicalParcelSizeDefinition[] = [
  {
    id: "small",
    tierId: "small_parcel",
    legacyId: "small",
    displayName: "Small",
    sellLabel: "SMALL",
    sellWeightLine: "Weight: 0–1 kg",
    sellDimensionsLine: "Max dimensions: 45 × 35 × 16 cm",
    sellSubtitle: "Weight: 0–1 kg",
    weightKg: SMALL.quoteWeightKg,
    minWeightKg: SMALL.minWeightKg,
    lengthCm: SMALL.maxDimensionsCm.length,
    widthCm: SMALL.maxDimensionsCm.width,
    heightCm: SMALL.maxDimensionsCm.height,
    unit: { weight: "kg", dimension: "cm" },
    maxWeightKg: SMALL.maxWeightKg,
    maxDimensionsCm: { ...SMALL.maxDimensionsCm },
    customerFacing: true,
    ownerApproved: true,
    sendcloudDerived: false,
  },
  {
    id: "medium",
    tierId: "medium_parcel",
    legacyId: "medium",
    displayName: "Medium",
    sellLabel: "MEDIUM",
    sellWeightLine: "Weight: 1–2 kg",
    sellDimensionsLine: "Max dimensions: 61 × 46 × 46 cm",
    sellSubtitle: "Weight: 1–2 kg",
    weightKg: MEDIUM.quoteWeightKg,
    minWeightKg: MEDIUM.minWeightKg,
    lengthCm: MEDIUM.maxDimensionsCm.length,
    widthCm: MEDIUM.maxDimensionsCm.width,
    heightCm: MEDIUM.maxDimensionsCm.height,
    unit: { weight: "kg", dimension: "cm" },
    maxWeightKg: MEDIUM.maxWeightKg,
    maxDimensionsCm: { ...MEDIUM.maxDimensionsCm },
    customerFacing: true,
    ownerApproved: true,
    sendcloudDerived: false,
  },
  {
    id: "large",
    tierId: "large_parcel",
    legacyId: "large",
    displayName: "Large",
    sellLabel: "LARGE",
    sellWeightLine: "Weight: 2–15 kg",
    sellDimensionsLine: "Max dimensions: Max length 120 cm",
    sellSubtitle: "Weight: 2–15 kg",
    weightKg: LARGE.quoteWeightKg,
    minWeightKg: LARGE.minWeightKg,
    ...largeSendcloudDimensions(),
    unit: { weight: "kg", dimension: "cm" },
    maxWeightKg: LARGE.maxWeightKg,
    maxDimensionsCm: { length: LARGE.maxLengthCm, width: 0, height: 0 },
    customerFacing: true,
    ownerApproved: true,
    sendcloudDerived: false,
  },
] as const;

/** Historical Extra Large — not Sell-selectable. Same in-band LARGE representation. */
const HISTORICAL_XL: CanonicalParcelSizeDefinition = {
  id: "xl",
  tierId: "xl_parcel",
  legacyId: "xl",
  displayName: "Extra Large",
  sellLabel: "EXTRA LARGE",
  sellWeightLine: "Weight: 2–15 kg",
  sellDimensionsLine: "Max dimensions: Max length 120 cm",
  sellSubtitle: "Weight: 2–15 kg",
  weightKg: LARGE.quoteWeightKg,
  minWeightKg: LARGE.minWeightKg,
  ...largeSendcloudDimensions(),
  unit: { weight: "kg", dimension: "cm" },
  maxWeightKg: LARGE.maxWeightKg,
  maxDimensionsCm: { length: LARGE.maxLengthCm, width: 0, height: 0 },
  customerFacing: false,
  ownerApproved: false,
  sendcloudDerived: false,
};

const ALL_FOR_RESOLVE: readonly CanonicalParcelSizeDefinition[] = [
  ...CANONICAL_PARCEL_SIZES_V1,
  HISTORICAL_XL,
];

const BY_ID = new Map(ALL_FOR_RESOLVE.map((row) => [row.id, row]));
const BY_TIER = new Map(ALL_FOR_RESOLVE.map((row) => [row.tierId, row]));
const BY_LEGACY = new Map(ALL_FOR_RESOLVE.map((row) => [row.legacyId, row]));

/** Sell picker — SMALL · MEDIUM · LARGE only. */
export function getCustomerFacingParcelSizes(): readonly CanonicalParcelSizeDefinition[] {
  return CANONICAL_PARCEL_SIZES_V1.filter((row) => row.customerFacing);
}

export function getCanonicalParcelSizeById(
  id: string | null | undefined,
): CanonicalParcelSizeDefinition | null {
  if (!id?.trim()) return null;
  return BY_ID.get(id.trim() as CanonicalParcelSizeId) ?? null;
}

export function getCanonicalParcelSizeByTier(
  tier: string | null | undefined,
): CanonicalParcelSizeDefinition | null {
  if (!tier?.trim()) return null;
  const key = tier.trim();
  if (key === "letter") return BY_TIER.get("small_parcel") ?? null;
  return BY_TIER.get(key as CanonicalParcelSizeDefinition["tierId"]) ?? null;
}

export function getCanonicalParcelSizeByLegacy(
  legacy: string | null | undefined,
): CanonicalParcelSizeDefinition | null {
  if (!legacy?.trim()) return null;
  const key = legacy.trim();
  if (key === "custom") return BY_LEGACY.get("xl") ?? null;
  return BY_LEGACY.get(key as CanonicalParcelSizeDefinition["legacyId"]) ?? null;
}

export function resolveCanonicalParcelSize(
  parcelSize: string | null | undefined,
): CanonicalParcelSizeDefinition | null {
  if (!parcelSize?.trim()) return null;
  const trimmed = parcelSize.trim();
  return (
    getCanonicalParcelSizeById(trimmed) ??
    getCanonicalParcelSizeByTier(trimmed) ??
    getCanonicalParcelSizeByLegacy(trimmed)
  );
}

export function canonicalParcelMeasurements(
  def: CanonicalParcelSizeDefinition,
): ParcelDimensions {
  return {
    weightKg: def.weightKg,
    lengthCm: def.lengthCm,
    widthCm: def.widthCm,
    heightCm: def.heightCm,
  };
}

export function formatCanonicalParcelSummary(def: CanonicalParcelSizeDefinition): string {
  return `${def.weightKg} kg · ${def.lengthCm} × ${def.widthCm} × ${def.heightCm} cm`;
}

/** Sell UX — max dimensions only (no carriers, prices, or Sendcloud). */
export function formatCanonicalMaxDimensionsLine(def: CanonicalParcelSizeDefinition): string {
  return def.sellDimensionsLine;
}

/** Sell UX — approved weight band only. */
export function formatCanonicalMaxWeightLine(def: CanonicalParcelSizeDefinition): string {
  return def.sellWeightLine;
}

/** v1.0 customer-facing shipping details — active carriers only (no DPD). Not Sell cards. */
export type ParcelShippingDetailsCarrierBlock = {
  carrier: "EVRi" | "Royal Mail";
  services: readonly string[];
  maxWeightKg: string | null;
  maxLengthCm: string | null;
  maxWidthCm: string | null;
  maxHeightCm: string | null;
  notes: readonly string[];
};

export function getV1_0ParcelShippingDetailsBlocks(): readonly ParcelShippingDetailsCarrierBlock[] {
  const rm = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1;
  const evri = EVRI_LABEL_ENGINE_CERTIFICATION_V1;

  return [
    {
      carrier: "EVRi",
      services: [
        evri.canonicalShippingOptionCode,
        evri.shopToAddressShippingOptionCode,
      ],
      maxWeightKg: String(LARGE.maxWeightKg),
      maxLengthCm: String(LARGE.maxLengthCm),
      maxWidthCm: null,
      maxHeightCm: null,
      notes: [
        "ROVEXO Parcel Size is a UX tier — not an EVRi service name.",
        "Eligibility follows live Sendcloud quotes for the Owner-approved weight band.",
      ],
    },
    {
      carrier: "Royal Mail",
      services: [rm.tracked24.serviceName, rm.tracked48.serviceName],
      maxWeightKg: String(MEDIUM.maxWeightKg),
      maxLengthCm: String(MEDIUM.maxDimensionsCm.length),
      maxWidthCm: String(MEDIUM.maxDimensionsCm.width),
      maxHeightCm: String(MEDIUM.maxDimensionsCm.height),
      notes: [
        "ROVEXO SMALL band: 0–1 kg · 45×35×16 cm",
        "ROVEXO MEDIUM band: 1–2 kg · 61×46×46 cm",
        "ROVEXO LARGE band: 2–15 kg · max length 120 cm — eligibility follows live Sendcloud quotes.",
      ],
    },
  ] as const;
}
