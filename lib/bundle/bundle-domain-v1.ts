/**
 * Bundle Engine v1.0 — pure domain (shared client/server).
 * Totals / counts / qty clamps derived here. No second owners.
 */

import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";

export type BundleLineItemV1 = {
  id?: string;
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
};

export type BundleSnapshotV1 = {
  id: string | null;
  buyerId?: string;
  sellerId: string;
  sellerName: string;
  status: "active" | "offer_pending" | "checkout" | "paid" | "cancelled" | "expired" | "discarded";
  currency: string;
  items: BundleLineItemV1[];
  updatedAt: string;
};

export type BundleAddResultV1 =
  | { ok: true; bundle: BundleSnapshotV1; merged: boolean }
  | { ok: false; reason: "other_seller"; existingSellerName: string; existingBundleId: string | null }
  | { ok: false; reason: "invalid_qty" | "out_of_stock" | "empty_line" };

export const BUNDLE_SYNC_EVENT = "rovexo:bundle-sync" as const;

export const BUNDLE_SELLER_CONFLICT_COPY = BUNDLE_ENGINE_V1.sellerConflict.popupCopy;

export function bundleSubtotal(bundle: BundleSnapshotV1 | null | undefined): number {
  if (!bundle?.items?.length) return 0;
  return bundle.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function bundleItemCount(bundle: BundleSnapshotV1 | null | undefined): number {
  if (!bundle?.items?.length) return 0;
  return bundle.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function clampBundleQuantity(quantity: number, maxStock: number): number {
  const ceiling = Math.max(1, Math.floor(maxStock));
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(ceiling, Math.max(1, Math.round(quantity)));
}

export function showViewItemStockStatus(stock: number): boolean {
  return stock > BUNDLE_ENGINE_V1.viewItemExtension.stockStatusOnlyWhenStockGreaterThan;
}

export function showViewItemQuantity(stock: number): boolean {
  return stock > BUNDLE_ENGINE_V1.viewItemExtension.quantityOnlyWhenStockGreaterThan;
}

/**
 * Pure merge into an in-memory snapshot (optimistic / unit tests).
 * Server engine remains the write authority for persistence.
 */
export function mergeLineIntoBundle(input: {
  current: BundleSnapshotV1 | null;
  sellerId: string;
  sellerName: string;
  line: BundleLineItemV1;
  buyerId?: string;
}): BundleAddResultV1 {
  const qty = clampBundleQuantity(input.line.quantity, input.line.maxStock);
  if (input.line.maxStock <= 0) return { ok: false, reason: "out_of_stock" };
  if (qty < 1) return { ok: false, reason: "invalid_qty" };
  if (!input.line.productId || !input.line.slug) return { ok: false, reason: "empty_line" };

  const current = input.current;
  if (current && current.items.length > 0 && current.sellerId !== input.sellerId) {
    return {
      ok: false,
      reason: "other_seller",
      existingSellerName: current.sellerName || "another seller",
      existingBundleId: current.id,
    };
  }

  const base: BundleSnapshotV1 =
    current && current.sellerId === input.sellerId
      ? current
      : {
          id: current?.id ?? null,
          buyerId: input.buyerId ?? current?.buyerId,
          sellerId: input.sellerId,
          sellerName: input.sellerName,
          status: "active",
          currency: current?.currency ?? "GBP",
          items: [],
          updatedAt: new Date().toISOString(),
        };

  const existing = base.items.find((item) => item.productId === input.line.productId);
  let items: BundleLineItemV1[];
  let merged = false;
  if (existing) {
    merged = true;
    const nextQty = clampBundleQuantity(existing.quantity + qty, input.line.maxStock);
    items = base.items.map((item) =>
      item.productId === input.line.productId
        ? {
            ...item,
            quantity: nextQty,
            maxStock: input.line.maxStock,
            unitPrice: input.line.unitPrice,
            title: input.line.title,
            imageUrl: input.line.imageUrl,
            slug: input.line.slug,
          }
        : item,
    );
  } else {
    items = [
      ...base.items,
      {
        ...input.line,
        quantity: qty,
      },
    ];
  }

  return {
    ok: true,
    merged,
    bundle: {
      ...base,
      sellerName: input.sellerName || base.sellerName,
      items,
      updatedAt: new Date().toISOString(),
      status: "active",
    },
  };
}

export function updateBundleLineQuantityPure(
  bundle: BundleSnapshotV1,
  productId: string,
  quantity: number,
): BundleSnapshotV1 | null {
  const target = bundle.items.find((item) => item.productId === productId);
  if (!target) return bundle;
  const nextQty = clampBundleQuantity(quantity, target.maxStock);
  return {
    ...bundle,
    items: bundle.items.map((item) =>
      item.productId === productId ? { ...item, quantity: nextQty } : item,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function removeBundleLinePure(
  bundle: BundleSnapshotV1,
  productId: string,
): BundleSnapshotV1 | null {
  const items = bundle.items.filter((item) => item.productId !== productId);
  if (items.length === 0) return null;
  return { ...bundle, items, updatedAt: new Date().toISOString() };
}
