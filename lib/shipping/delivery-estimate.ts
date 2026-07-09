/**
 * Delivery estimate helpers — Parcel2Go provides Collection + EstimatedDeliveryDate.
 * No separate transitDays field on the quote API.
 */

export function dateOnlyFromIso(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1]! : null;
}

/** Parse YYYY-MM-DD at UTC noon to avoid local timezone drift. */
export function parseDateOnlyUtc(value: string | null | undefined): Date | null {
  const dateOnly = dateOnlyFromIso(value);
  if (!dateOnly) return null;
  const parsed = new Date(`${dateOnly}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** Transit days from collection date to estimated delivery date (Parcel2Go quote fields). */
export function transitDaysBetweenIsoDates(
  collectionIso: string | null | undefined,
  deliveryIso: string | null | undefined,
): number | null {
  const collection = parseDateOnlyUtc(collectionIso);
  const delivery = parseDateOnlyUtc(deliveryIso);
  if (!collection || !delivery) return null;
  const diffMs = delivery.getTime() - collection.getTime();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(1, days);
}

export function formatEstimatedDeliveryLabel(iso: string | null | undefined): string | null {
  const date = parseDateOnlyUtc(iso);
  if (!date) return null;
  const formatted = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `Delivers ${formatted}`;
}

export function formatTransitDaysLabel(days: number | null | undefined): string | null {
  if (days == null || !Number.isFinite(days) || days < 1) return null;
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Checkout ETA — prefer Parcel2Go EstimatedDeliveryDate; fall back to exact transit days only.
 * Never fabricates a min–max range.
 */
export function formatCheckoutDeliveryEta(input: {
  estimatedDeliveryAt?: string | null;
  transitDays?: number | null;
}): string {
  const deliveryLabel = formatEstimatedDeliveryLabel(input.estimatedDeliveryAt);
  if (deliveryLabel) return deliveryLabel;

  const daysLabel = formatTransitDaysLabel(input.transitDays);
  if (daysLabel) return daysLabel;

  return "Delivery estimate unavailable";
}
