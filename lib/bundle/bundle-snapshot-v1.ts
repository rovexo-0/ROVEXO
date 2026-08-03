/**
 * Bundle Snapshot Engine v1.0 — immutable lock at Checkout start.
 * After payment, Order must use this snapshot — never live listing data.
 */

export type BundleSnapshotLineV1 = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  condition: string;
  currency: string;
};

export type BundleCheckoutSnapshotV1 = {
  v: 1;
  bundleId: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  currency: string;
  /** Item subtotal (sum unitPrice × qty). Server-calculated only. */
  itemPrice: number;
  platformFee: number;
  shipping: number;
  discount: number;
  total: number;
  lines: BundleSnapshotLineV1[];
  lockedAt: string;
  /** Immutable after lock. */
  immutable: true;
  offerId?: string | null;
  /** Status before checkout — used to restore offer_pending on cancel/expire. */
  priorStatus?: "active" | "offer_pending" | null;
};

export function isBundleCheckoutSnapshot(value: unknown): value is BundleCheckoutSnapshotV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as BundleCheckoutSnapshotV1;
  return (
    v.v === 1 &&
    v.immutable === true &&
    typeof v.bundleId === "string" &&
    Array.isArray(v.lines) &&
    v.lines.length > 0 &&
    typeof v.itemPrice === "number" &&
    typeof v.total === "number"
  );
}

/** Scale line unit prices so sum(unitPrice×qty) === lockedItemPrice (pence-safe). */
export function allocateLockedBundleLinePrices(
  lines: BundleSnapshotLineV1[],
  lockedItemPrice: number,
): BundleSnapshotLineV1[] {
  const listSubtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  if (!Number.isFinite(lockedItemPrice) || lockedItemPrice <= 0 || lines.length === 0) {
    return lines.map((line) => ({ ...line }));
  }
  if (!Number.isFinite(listSubtotal) || listSubtotal <= 0) {
    // Put full locked amount on first line unit.
    const first = lines[0]!;
    const unit = Math.round((lockedItemPrice / first.quantity) * 100) / 100;
    return lines.map((line, index) =>
      index === 0 ? { ...line, unitPrice: unit } : { ...line, unitPrice: 0 },
    );
  }

  const scaled = lines.map((line) => {
    const share = (line.unitPrice * line.quantity) / listSubtotal;
    const lineTotal = Math.round(lockedItemPrice * share * 100) / 100;
    const unitPrice = Math.round((lineTotal / line.quantity) * 100) / 100;
    return { ...line, unitPrice };
  });

  const allocated = scaled.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const drift = Math.round((lockedItemPrice - allocated) * 100) / 100;
  if (Math.abs(drift) >= 0.01 && scaled[0]) {
    const adj = Math.round((scaled[0].unitPrice + drift / scaled[0].quantity) * 100) / 100;
    scaled[0] = { ...scaled[0], unitPrice: adj };
  }
  return scaled;
}

export function buildBundleCheckoutSnapshot(input: {
  bundleId: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  currency: string;
  itemPrice: number;
  platformFee: number;
  shipping: number;
  discount?: number;
  total: number;
  lines: BundleSnapshotLineV1[];
  lockedAt?: string;
  offerId?: string | null;
  priorStatus?: "active" | "offer_pending" | null;
}): BundleCheckoutSnapshotV1 {
  return {
    v: 1,
    bundleId: input.bundleId,
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    currency: input.currency,
    itemPrice: input.itemPrice,
    platformFee: input.platformFee,
    shipping: input.shipping,
    discount: input.discount ?? 0,
    total: input.total,
    lines: input.lines.map((line) => ({ ...line })),
    lockedAt: input.lockedAt ?? new Date().toISOString(),
    immutable: true,
    offerId: input.offerId ?? null,
    priorStatus: input.priorStatus ?? null,
  };
}

export function snapshotPrimarySlug(snapshot: BundleCheckoutSnapshotV1): string {
  return snapshot.lines[0]!.slug;
}
