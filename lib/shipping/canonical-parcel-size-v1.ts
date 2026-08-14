/**
 * ROVEXO Parcel Size v1.0 — SINGLE SOURCE OF TRUTH (Sendcloud-derived).
 *
 * ROVEXO UX tiers (customer-facing):
 *   SMALL · MEDIUM · LARGE
 *
 * EXTRA_LARGE: removed from customer-facing V1.0 (historical resolve only).
 *
 * CRITICAL:
 * ROVEXO parcel-size names ≠ Sendcloud shipping-method names.
 * Do NOT drop LARGE because Sendcloud has no method literally named "Large".
 *
 * Constraint source (live Sendcloud V3 POST /shipping-options, GB→GB):
 * - SMALL  <- royal_mailv2 Tracked size=s  (weight + max_dimensions)
 * - MEDIUM <- royal_mailv2 Tracked size=m  (weight + max_dimensions)
 * - LARGE  <- hermes_c2c_gb (EVRi) weight.max + length max; width/height
 *            not published by Sendcloud for EVRi (0.00) — never invent.
 *            Representative quote envelope uses Sendcloud-verified numbers only
 *            (EVRi max weight/length + RM Small cross-section proven live).
 *
 * Forbidden: 2kg x 45 x 10 x 10 as any default / fixture / fallback.
 */

import type { LegacyParcelSize, ParcelDimensions, ParcelTier } from "@/lib/shipping/types";
import { EVRI_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/evri-label-engine-certification-v1";
import { ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";

export const PARCEL_SIZE_CANONICAL_V1 = {
  version: "v1.0",
  equation: "SELL → ROVEXO Parcel Size UX → Sendcloud constraints → quote → checkout → label",
  moneyAdjacent: false,
  source: "SENDCLOUD_V3_SHIPPING_OPTIONS",
  note: "ROVEXO tier names are UX labels — not Sendcloud service names",
} as const;

/**
 * Live Sendcloud-derived constraint bands for V1.0 active carriers (RM + EVRi).
 * DPD envelopes are intentionally excluded (DPD = HIDDEN_V1_1).
 */
export const SENDCLOUD_DERIVED_PARCEL_LIMITS_V1 = {
  small: {
    /** Catalog codes that published these limits — not ROVEXO tier names. */
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
    /**
     * EVRi (hermes_c2c_gb:a2a/pickup) publishes weight.max + length.
     * width/height returned as 0.00 by Sendcloud — NOT invented here.
     * Cross-section for quote probes uses RM Small width×height (Sendcloud-
     * published) combined with EVRi max length — live-proven eligible for EVRi.
     */
    sendcloudCodes: ["hermes_c2c_gb:a2a/pickup"] as const,
    maxWeightKg: 15.001,
    maxLengthCm: 120,
    maxWidthCm: null as number | null,
    maxHeightCm: null as number | null,
    /** Quote envelope — every number appears in Sendcloud catalog responses. */
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
  sellSubtitle: string;
  /** Representative shippable weight for quotes — within Sendcloud maxWeightKg. */
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  unit: { weight: "kg"; dimension: "cm" };
  maxWeightKg: number;
  maxDimensionsCm: { length: number; width: number; height: number };
  /** V1.0 Sell selectable. */
  customerFacing: boolean;
  sendcloudDerived: boolean;
  /** Optional Sell note when a dimension field is unpublished by Sendcloud. */
  sellLimitNote?: string;
};

function floorKg(maxWeightKg: number): number {
  return Math.max(0.001, Math.floor(maxWeightKg * 1000 - 1) / 1000);
}

const SMALL = SENDCLOUD_DERIVED_PARCEL_LIMITS_V1.small;
const MEDIUM = SENDCLOUD_DERIVED_PARCEL_LIMITS_V1.medium;
const LARGE = SENDCLOUD_DERIVED_PARCEL_LIMITS_V1.large;

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
    sellSubtitle: "Envelope or small parcel",
    weightKg: floorKg(SMALL.maxWeightKg),
    lengthCm: SMALL.maxDimensionsCm.length,
    widthCm: SMALL.maxDimensionsCm.width,
    heightCm: SMALL.maxDimensionsCm.height,
    unit: { weight: "kg", dimension: "cm" },
    maxWeightKg: SMALL.maxWeightKg,
    maxDimensionsCm: { ...SMALL.maxDimensionsCm },
    customerFacing: true,
    sendcloudDerived: true,
  },
  {
    id: "medium",
    tierId: "medium_parcel",
    legacyId: "medium",
    displayName: "Medium",
    sellLabel: "MEDIUM",
    sellSubtitle: "Medium parcel",
    weightKg: floorKg(MEDIUM.maxWeightKg),
    lengthCm: MEDIUM.maxDimensionsCm.length,
    widthCm: MEDIUM.maxDimensionsCm.width,
    heightCm: MEDIUM.maxDimensionsCm.height,
    unit: { weight: "kg", dimension: "cm" },
    maxWeightKg: MEDIUM.maxWeightKg,
    maxDimensionsCm: { ...MEDIUM.maxDimensionsCm },
    customerFacing: true,
    sendcloudDerived: true,
  },
  {
    id: "large",
    tierId: "large_parcel",
    legacyId: "large",
    displayName: "Large",
    sellLabel: "LARGE",
    sellSubtitle: "Large parcel",
    weightKg: floorKg(LARGE.maxWeightKg),
    lengthCm: LARGE.quoteEnvelopeCm.length,
    widthCm: LARGE.quoteEnvelopeCm.width,
    heightCm: LARGE.quoteEnvelopeCm.height,
    unit: { weight: "kg", dimension: "cm" },
    maxWeightKg: LARGE.maxWeightKg,
    maxDimensionsCm: {
      length: LARGE.maxLengthCm,
      // Unpublished by Sendcloud for EVRi — display uses sellLimitNote; quote
      // envelope cross-section uses Sendcloud-published RM Small width×height.
      width: LARGE.quoteEnvelopeCm.width,
      height: LARGE.quoteEnvelopeCm.height,
    },
    customerFacing: true,
    sendcloudDerived: true,
    sellLimitNote:
      "Max length 120 cm · max weight 15.001 kg (Sendcloud EVRi). Width/height limits are not published by Sendcloud for EVRi.",
  },
] as const;

/** Historical Extra Large — not Sell-selectable. */
const HISTORICAL_XL: CanonicalParcelSizeDefinition = {
  id: "xl",
  tierId: "xl_parcel",
  legacyId: "xl",
  displayName: "Extra Large",
  sellLabel: "EXTRA LARGE",
  sellSubtitle: "Extra large parcel",
  weightKg: floorKg(LARGE.maxWeightKg),
  lengthCm: LARGE.quoteEnvelopeCm.length,
  widthCm: LARGE.quoteEnvelopeCm.width,
  heightCm: LARGE.quoteEnvelopeCm.height,
  unit: { weight: "kg", dimension: "cm" },
  maxWeightKg: LARGE.maxWeightKg,
  maxDimensionsCm: {
    length: LARGE.maxLengthCm,
    width: LARGE.quoteEnvelopeCm.width,
    height: LARGE.quoteEnvelopeCm.height,
  },
  customerFacing: false,
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

/** Sell UX line — Sendcloud-derived maximum dimensions (or truthful note). */
export function formatCanonicalMaxDimensionsLine(def: CanonicalParcelSizeDefinition): string {
  if (def.id === "large" && def.sellLimitNote) {
    return def.sellLimitNote;
  }
  const { length, width, height } = def.maxDimensionsCm;
  return `Max dimensions: ${length} × ${width} × ${height} cm`;
}

export function formatCanonicalMaxWeightLine(def: CanonicalParcelSizeDefinition): string {
  return `Max weight: ${def.maxWeightKg} kg`;
}

/** v1.0 customer-facing shipping details — active carriers only (no DPD). */
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
        "Weight / length from Sendcloud EVRi catalog. Width/height not published (0.00) — not invented.",
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
        `ROVEXO SMALL maps to Sendcloud Small Parcel band (size=s): ${SMALL.maxWeightKg} kg · ${SMALL.maxDimensionsCm.length}×${SMALL.maxDimensionsCm.width}×${SMALL.maxDimensionsCm.height} cm`,
        `ROVEXO MEDIUM maps to Sendcloud Medium Parcel band (size=m): ${MEDIUM.maxWeightKg} kg · ${MEDIUM.maxDimensionsCm.length}×${MEDIUM.maxDimensionsCm.width}×${MEDIUM.maxDimensionsCm.height} cm`,
        "ROVEXO LARGE is a UX tier — eligibility follows live Sendcloud quotes, not a Royal Mail method named Large.",
      ],
    },
  ] as const;
}
