/**
 * Order Details display carrier — current active shipment, not historical checkout.
 * Never rewrite orders.delivery_carrier. Never invent Royal Mail / InPost.
 */

import type { UkCarrier } from "@/lib/shipping/carriers";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";
import { selectCurrentOrderParcels } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

export type ResolveOrderDisplayCarrierInput = {
  orderCarrier?: string | null;
  shippingRecordCarrier?: string | null;
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
 * Precedence: active label → active parcel → shipping_records → historical order → empty.
 * Empty = fail closed (Delivery Status hides the line). No invented default.
 */
export function resolveOrderDisplayCarrier(
  input: ResolveOrderDisplayCarrierInput,
): UkCarrier | "" {
  return (
    normalizeOrderDisplayCarrier(input.activeLabelCarrier) ??
    normalizeOrderDisplayCarrier(input.activeParcelCarrier) ??
    normalizeOrderDisplayCarrier(input.shippingRecordCarrier) ??
    normalizeOrderDisplayCarrier(input.orderCarrier) ??
    ""
  );
}

export type ResolveOrderDisplayTrackingInput = {
  orderTracking?: string | null;
  shippingRecordTracking?: string | null;
  activeParcelTracking?: string | null;
};

/** Tracking identity follows the same current-shipment precedence as carrier. */
export function resolveOrderDisplayTracking(
  input: ResolveOrderDisplayTrackingInput,
): string {
  return (
    input.activeParcelTracking?.trim() ||
    input.shippingRecordTracking?.trim() ||
    input.orderTracking?.trim() ||
    ""
  );
}

export type ActiveOrderDisplayCarriers = {
  activeLabelCarrier: string | null;
  activeParcelCarrier: string | null;
  activeTrackingNumber: string | null;
};

/**
 * Current recovered shipment only. Failed / cancelled / superseded historical
 * parcels are excluded. Label + tracking come from the current parcel.
 */
export function extractActiveOrderDisplayCarriers(
  parcels: readonly ShipmentParcel[] | null | undefined,
): ActiveOrderDisplayCarriers {
  const current = selectCurrentOrderParcels(parcels);
  if (current.length === 0) {
    return {
      activeLabelCarrier: null,
      activeParcelCarrier: null,
      activeTrackingNumber: null,
    };
  }

  const withReadyLabel = current.filter((parcel) => parcel.label?.status === "ready");
  const labeled = withReadyLabel[0] ?? null;
  const parcel = current[0]!;

  return {
    activeLabelCarrier: labeled?.carrier?.trim() || null,
    activeParcelCarrier: parcel.carrier?.trim() || null,
    activeTrackingNumber: parcel.trackingNumber?.trim() || labeled?.trackingNumber?.trim() || null,
  };
}
