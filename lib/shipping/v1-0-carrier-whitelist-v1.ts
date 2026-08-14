/**
 * ROVEXO v1.0 — customer-facing shipping carrier whitelist.
 *
 * ACTIVE: EVRi · Royal Mail
 * HIDDEN (deferred v1.1): DPD · InPost
 *
 * Technical certification / provider foundation for DPD + InPost remains in-repo.
 * Customer-facing surfaces must never select or display them in v1.0.
 */

import type { UkCarrier } from "@/lib/shipping/carriers";

/** Canonical v1.0 buyer/seller-facing carriers (order = checkout display order). */
export const V1_0_ACTIVE_CARRIERS = ["Evri", "Royal Mail"] as const satisfies readonly UkCarrier[];

export type V1_0ActiveCarrier = (typeof V1_0_ACTIVE_CARRIERS)[number];

/**
 * Stable carrier group codes for Checkout grouping (one card per group).
 * Maps onto {@link V1_0_ACTIVE_CARRIERS} — not a second registry.
 */
export const V1_0_CARRIER_GROUP_CODE = {
  "Royal Mail": "ROYAL_MAIL",
  Evri: "EVRI",
} as const satisfies Record<V1_0ActiveCarrier, "ROYAL_MAIL" | "EVRI">;

export type V1_0CarrierGroupCode = (typeof V1_0_CARRIER_GROUP_CODE)[V1_0ActiveCarrier];

/**
 * Explicitly deferred to v1.1 — keep technical foundation; never surface in v1.0 UI.
 * DPD + InPost provider integration RETAINED.
 */
export const V1_0_HIDDEN_CARRIERS = ["DPD", "InPost"] as const satisfies readonly UkCarrier[];

export const V1_0_CARRIER_WHITELIST_V1 = {
  version: "v1.0",
  active: V1_0_ACTIVE_CARRIERS,
  hidden: V1_0_HIDDEN_CARRIERS,
  groupCodes: V1_0_CARRIER_GROUP_CODE,
  dpdStatus: "DEFERRED_V1_1" as const,
  inpostStatus: "DEFERRED_V1_1" as const,
} as const;

export function isV1_0ActiveCarrier(carrier: string | null | undefined): carrier is V1_0ActiveCarrier {
  if (!carrier) return false;
  return (V1_0_ACTIVE_CARRIERS as readonly string[]).includes(carrier);
}

export function isV1_0HiddenCarrier(carrier: string | null | undefined): boolean {
  if (!carrier) return false;
  const key = carrier.trim().toLowerCase();
  if (key === "inpost" || key === "inpost uk" || key.startsWith("inpost")) return true;
  if (key === "dpd" || key === "dpd uk" || key.startsWith("dpd")) return true;
  return false;
}

/**
 * Normalize provider carrier string → canonical v1.0 active carrier.
 * Fail-closed: unknown / DPD / InPost → null.
 */
export function resolveV1_0ActiveCarrier(
  carrier: string | null | undefined,
): V1_0ActiveCarrier | null {
  if (!carrier?.trim()) return null;
  const key = carrier.trim();
  if (isV1_0HiddenCarrier(key)) return null;
  if (isV1_0ActiveCarrier(key)) return key;
  const lower = key.toLowerCase();
  if (lower === "royal mail" || lower === "royal_mail" || lower === "royalmail") {
    return "Royal Mail";
  }
  if (lower === "evri" || lower === "hermes") return "Evri";
  return null;
}

export function resolveV1_0CarrierGroupCode(
  carrier: string | null | undefined,
): V1_0CarrierGroupCode | null {
  const active = resolveV1_0ActiveCarrier(carrier);
  return active ? V1_0_CARRIER_GROUP_CODE[active] : null;
}

/** Fail-closed customer-facing filter — never fall back to a broader carrier list. */
export function filterV1_0CustomerFacingQuotes<T extends { carrier: string }>(quotes: T[]): T[] {
  return quotes.filter((quote) => resolveV1_0ActiveCarrier(String(quote.carrier)) != null);
}

/** Display label — EVRi brand casing for UI only (id remains `Evri`). */
export function formatV1_0CarrierDisplayName(carrier: string): string {
  const active = resolveV1_0ActiveCarrier(carrier) ?? carrier;
  if (active === "Evri" || active.toLowerCase() === "evri") return "EVRi";
  if (active === "Royal Mail") return "Royal Mail";
  return carrier;
}
