/**
 * Order Details display carrier — current active shipment, not historical checkout.
 * Never rewrite orders.delivery_carrier. Never invent Royal Mail / InPost.
 */

import type { UkCarrier } from "@/lib/shipping/carriers";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";
import { isActiveAnnouncedOrReadyParcel } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

export type ResolveOrderDisplayCarrierInput = {
  orderCarrier?: string | null;
  activeLabelCarrier?: string | null;
  activeParcelCarrier?: string | null;
};

/** Canonical UK carrier or null — never defaults to Royal Mail / InPost. */
export function normalizeOrderDisplayCarrier(
  carrier: string | null | undefined,
): UkCarrier | null {
  if (typeof carrier !== "string") return null;
  const trimmed = carrier.trim();
  if (!trimmed) return null;
  return mapSendcloudCarrierToUk(trimmed);
}

/**
 * Precedence: active label → active parcel → historical order carrier → empty.
 * Empty = fail closed (Delivery Status hides the line). No invented default.
 */
export function resolveOrderDisplayCarrier(
  input: ResolveOrderDisplayCarrierInput,
): UkCarrier | "" {
  return (
    normalizeOrderDisplayCarrier(input.activeLabelCarrier) ??
    normalizeOrderDisplayCarrier(input.activeParcelCarrier) ??
    normalizeOrderDisplayCarrier(input.orderCarrier) ??
    ""
  );
}

function pickHighestParcelNumber(parcels: readonly ShipmentParcel[]): ShipmentParcel {
  return parcels.reduce((best, current) =>
    current.parcelNumber > best.parcelNumber ? current : best,
  );
}

export type ActiveOrderDisplayCarriers = {
  activeLabelCarrier: string | null;
  activeParcelCarrier: string | null;
};

/**
 * Active recovered shipment only. Failed historical parcels are excluded.
 * Label carrier is taken from the active parcel that has a ready label —
 * never from a stale shipping_records snapshot.
 */
export function extractActiveOrderDisplayCarriers(
  parcels: readonly ShipmentParcel[] | null | undefined,
): ActiveOrderDisplayCarriers {
  const list = parcels ?? [];
  const active = list.filter(isActiveAnnouncedOrReadyParcel);
  if (active.length === 0) {
    return { activeLabelCarrier: null, activeParcelCarrier: null };
  }

  const current = pickHighestParcelNumber(active);
  const withReadyLabel = active.filter((parcel) => parcel.label?.status === "ready");
  const labeled = withReadyLabel.length > 0 ? pickHighestParcelNumber(withReadyLabel) : null;

  return {
    activeLabelCarrier: labeled?.carrier?.trim() || null,
    activeParcelCarrier: current.carrier?.trim() || null,
  };
}
