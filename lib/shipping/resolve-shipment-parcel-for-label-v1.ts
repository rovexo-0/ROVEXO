/**
 * Canonical shipment parcel selection for label generation.
 *
 * Explicit parcelId: ownership-checked; never create a substitute on miss/mismatch.
 * Omitted parcelId (Print Label `{ orderId }` only): select the eligible / active
 * parcel. Never pick a failed historical shipment merely because it is parcels[0].
 */

import type { ShipmentParcel } from "@/lib/shipping/types";

export type ResolveShipmentParcelForLabelResult =
  | { status: "use"; parcel: ShipmentParcel }
  | { status: "create" }
  | { status: "reject"; error: string };

export const MULTIPLE_ELIGIBLE_PARCELS_FOR_LABEL =
  "Multiple parcels are eligible for label generation.";

export const NO_ELIGIBLE_PARCEL_FOR_LABEL =
  "No parcel is eligible for label generation.";

function hasUsableReadyLabel(parcel: ShipmentParcel): boolean {
  return (
    parcel.label?.status === "ready" &&
    Boolean(parcel.trackingNumber?.trim()) &&
    Boolean(parcel.label.pdfUrl)
  );
}

function hasProviderShipmentIdentity(parcel: ShipmentParcel): boolean {
  return (parcel.providerParcelId ?? 0) > 0;
}

/**
 * Existing-field failed / historical shipment — no new status vocabulary.
 * Uses SHIPPING_STATUSES, label.void, parcel_operation, and leftover
 * collected/in-flight rows that never received tracking or a provider id.
 */
export function isFailedHistoricalParcel(parcel: ShipmentParcel): boolean {
  if (parcel.status === "failed" || parcel.status === "cancelled") return true;
  if (parcel.status === "lost" || parcel.status === "returned") return true;
  if (parcel.label?.status === "void") return true;
  if (
    parcel.operation === "lost" ||
    parcel.operation === "return" ||
    parcel.operation === "damaged"
  ) {
    return true;
  }
  if (hasUsableReadyLabel(parcel) || hasProviderShipmentIdentity(parcel)) {
    return false;
  }
  if (parcel.trackingNumber?.trim()) return false;
  if (parcel.status === "preparing") return false;
  return true;
}

/** Preparing row with no successful announce identity — valid for a new label. */
export function isEligibleForNewLabel(parcel: ShipmentParcel): boolean {
  if (isFailedHistoricalParcel(parcel)) return false;
  if (hasUsableReadyLabel(parcel)) return false;
  if (hasProviderShipmentIdentity(parcel)) return false;
  if (parcel.trackingNumber?.trim()) return false;
  return parcel.status === "preparing";
}

/** Successful or in-flight announce — reprint / hydrate, do not re-announce blindly. */
export function isActiveAnnouncedOrReadyParcel(parcel: ShipmentParcel): boolean {
  if (isFailedHistoricalParcel(parcel)) return false;
  return (
    hasUsableReadyLabel(parcel) ||
    hasProviderShipmentIdentity(parcel) ||
    Boolean(parcel.trackingNumber?.trim())
  );
}

function pickHighestParcelNumber(parcels: ShipmentParcel[]): ShipmentParcel {
  return parcels.reduce((best, current) =>
    current.parcelNumber > best.parcelNumber ? current : best,
  );
}

/**
 * Live (non-failed) parcels that are still current for this order.
 * Recovered multi-carrier: the highest live parcel number is current;
 * earlier live parcels (including delivered historical) are superseded.
 */
export function selectCurrentOrderParcels(
  parcels: readonly ShipmentParcel[] | null | undefined,
): ShipmentParcel[] {
  const live = (parcels ?? []).filter((parcel) => !isFailedHistoricalParcel(parcel));
  if (live.length === 0) return [];
  const current = pickHighestParcelNumber(live);
  return live.filter((parcel) => parcel.parcelNumber === current.parcelNumber);
}

export function isCurrentOrderParcel(
  parcel: ShipmentParcel,
  parcels: readonly ShipmentParcel[] | null | undefined,
): boolean {
  return selectCurrentOrderParcels(parcels).some((current) => current.id === parcel.id);
}

/**
 * Carrier webhook may advance shipping_records only for the current parcel identity.
 * Historical / superseded tracking must not overwrite the active shipment.
 * Empty parcels → allow (single-carrier shipping_records identity).
 */
export function shouldApplyCarrierTrackingUpdate(input: {
  trackingNumber: string | null | undefined;
  parcels: readonly ShipmentParcel[] | null | undefined;
}): boolean {
  const tracking = input.trackingNumber?.trim();
  if (!tracking) return false;
  const parcels = input.parcels ?? [];
  if (parcels.length === 0) return true;

  const matching = parcels.filter((parcel) => parcel.trackingNumber?.trim() === tracking);
  if (matching.length === 0) return true;

  const current = selectCurrentOrderParcels(parcels);
  if (current.some((parcel) => parcel.trackingNumber?.trim() === tracking)) {
    return true;
  }

  return false;
}

/**
 * Pure selection — no DB I/O.
 * `orderParcels` should be the full order list (any order).
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

  if (input.orderParcels.length === 0) {
    return { status: "create" };
  }

  const eligible = input.orderParcels.filter(isEligibleForNewLabel);
  if (eligible.length === 1) {
    return { status: "use", parcel: eligible[0]! };
  }
  if (eligible.length > 1) {
    return { status: "reject", error: MULTIPLE_ELIGIBLE_PARCELS_FOR_LABEL };
  }

  const active = input.orderParcels.filter(isActiveAnnouncedOrReadyParcel);
  if (active.length === 1) {
    return { status: "use", parcel: active[0]! };
  }
  if (active.length > 1) {
    return { status: "use", parcel: pickHighestParcelNumber(active) };
  }

  return { status: "reject", error: NO_ELIGIBLE_PARCEL_FOR_LABEL };
}
