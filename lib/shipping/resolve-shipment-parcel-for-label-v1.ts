/**
 * P7.25 — Canonical shipment parcel selection for label generation.
 * Auto Single Parcel: reuse parcels[0] (parcel_number=1) when parcelId omitted.
 * Explicit parcelId: ownership-checked; never create a substitute on miss/mismatch.
 */

import type { ShipmentParcel } from "@/lib/shipping/types";

export type ResolveShipmentParcelForLabelResult =
  | { status: "use"; parcel: ShipmentParcel }
  | { status: "create" }
  | { status: "reject"; error: string };

/**
 * Pure selection — no DB I/O.
 * `orderParcels` must already be ordered by parcel_number ascending (listShipmentParcelsForOrder).
 */
export function resolveShipmentParcelForLabel(input: {
  shippingRecordId: string;
  /** When set, loadedExplicitParcel is the getShipmentParcelById result (null if missing). */
  explicitParcelId?: string | null;
  loadedExplicitParcel: ShipmentParcel | null;
  orderParcels: ShipmentParcel[];
}): ResolveShipmentParcelForLabelResult {
  const explicitId = input.explicitParcelId?.trim() || null;

  if (explicitId) {
    if (!input.loadedExplicitParcel) {
      return { status: "reject", error: "Parcel not found." };
    }
    if (input.loadedExplicitParcel.shippingRecordId !== input.shippingRecordId) {
      return { status: "reject", error: "Parcel does not belong to this order." };
    }
    return { status: "use", parcel: input.loadedExplicitParcel };
  }

  if (input.orderParcels.length > 0) {
    return { status: "use", parcel: input.orderParcels[0]! };
  }

  return { status: "create" };
}
