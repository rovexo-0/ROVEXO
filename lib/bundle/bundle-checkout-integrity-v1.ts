/**
 * Bundle Checkout Integrity v1.0 — server authority only.
 * Client totals / qty / prices are NEVER trusted.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getActiveMarket } from "@/lib/seo/markets";
import { isPurchasable } from "@/lib/inventory/service";
import { FINANCIAL_AUDIT_ENGINE } from "@/lib/checkout/engines/financial-audit-engine-v1";
import { isSelfPurchaseBlocked } from "@/lib/checkout/self-purchase-absolute-law-v1";
import {
  buildBundleCheckoutSnapshot,
  type BundleCheckoutSnapshotV1,
  type BundleSnapshotLineV1,
} from "@/lib/bundle/bundle-snapshot-v1";
import { amountsMatch } from "@/lib/checkout/buy-now-absolute-law-v1";

export type BundleIntegrityFailureReason =
  | "bundle_missing"
  | "ownership"
  | "seller_changed"
  | "listing_missing"
  | "listing_inactive"
  | "stock"
  | "price_changed"
  | "currency"
  | "self_purchase"
  | "seller_suspended"
  | "empty"
  | "totals";

export type BundleIntegrityResult =
  | {
      ok: true;
      snapshot: BundleCheckoutSnapshotV1;
      /** Live stock map after revalidation (for reservation qty checks). */
      liveStock: Record<string, number>;
    }
  | {
      ok: false;
      reason: BundleIntegrityFailureReason;
      message: string;
      /** Owner concurrency copy when stock/listing race. */
      unavailable?: boolean;
    };

type BundleRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  seller_display_name: string;
  status: string;
  currency: string;
};

type BundleItemRow = {
  product_id: string;
  product_slug: string;
  title: string;
  image_url: string;
  unit_price: number | string;
  quantity: number;
  max_stock_snapshot: number;
};

type ProductLive = {
  id: string;
  slug: string;
  title: string;
  price: number | string;
  stock: number | null;
  status: string;
  seller_id: string;
  shipping_price: number | string | null;
  condition: string | null;
  product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }> | null;
};

function db(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function primaryImage(product: ProductLive, fallback: string): string {
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return images[0]?.url || fallback || "";
}

async function isAccountActive(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_status")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.id) return false;
  return profile.account_status !== "suspended" && profile.account_status !== "deleted";
}

/**
 * Revalidate bundle against live listings. Server totals only.
 * Accepts active or offer_pending (accepted offer → checkout).
 */
export async function revalidateBundleForCheckout(input: {
  buyerId: string;
  bundleId?: string | null;
  /** When set, only these statuses are accepted (default active + offer_pending). */
  allowedStatuses?: string[];
  /** When true (accepted offer lock), skip live list-price equality. */
  skipListPriceMatch?: boolean;
}): Promise<BundleIntegrityResult> {
  const admin = db();
  const currency = getActiveMarket().currency;
  const statuses = input.allowedStatuses ?? ["active", "offer_pending"];

  let query = admin
    .from("bundles")
    .select("id, buyer_id, seller_id, seller_display_name, status, currency")
    .eq("buyer_id", input.buyerId)
    .in("status", statuses);

  if (input.bundleId) {
    query = query.eq("id", input.bundleId);
  }

  const { data: bundleRaw, error: bundleError } = await query
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (bundleError || !bundleRaw) {
    return {
      ok: false,
      reason: "bundle_missing",
      message: "Bundle not found.",
      unavailable: true,
    };
  }

  const bundle = bundleRaw as BundleRow;
  if (bundle.buyer_id !== input.buyerId) {
    return { ok: false, reason: "ownership", message: "Bundle ownership validation failed." };
  }

  if (isSelfPurchaseBlocked({ currentUserId: input.buyerId, listingOwnerId: bundle.seller_id })) {
    return { ok: false, reason: "self_purchase", message: "You cannot buy your own listings." };
  }

  if (!(await isAccountActive(admin, input.buyerId))) {
    return { ok: false, reason: "ownership", message: "Buyer account is not active." };
  }

  if (!(await isAccountActive(admin, bundle.seller_id))) {
    return {
      ok: false,
      reason: "seller_suspended",
      message: "This seller can't accept orders right now.",
    };
  }

  const { data: sellerSettings } = await admin
    .from("user_settings")
    .select("vacation_mode")
    .eq("user_id", bundle.seller_id)
    .maybeSingle();
  if (sellerSettings?.vacation_mode) {
    return {
      ok: false,
      reason: "seller_suspended",
      message: "This seller can't accept orders right now.",
    };
  }

  const { data: itemRows } = await admin
    .from("bundle_items")
    .select(
      "product_id, product_slug, title, image_url, unit_price, quantity, max_stock_snapshot",
    )
    .eq("bundle_id", bundle.id)
    .order("created_at", { ascending: true });

  const items = (itemRows ?? []) as BundleItemRow[];
  if (items.length === 0) {
    return { ok: false, reason: "empty", message: "Bundle is empty." };
  }

  const productIds = items.map((item) => item.product_id);
  const { data: productsRaw } = await admin
    .from("products")
    .select(
      "id, slug, title, price, stock, status, seller_id, shipping_price, condition, product_images(url, is_primary, sort_order)",
    )
    .in("id", productIds);

  const products = (productsRaw ?? []) as ProductLive[];
  if (products.length !== items.length) {
    return {
      ok: false,
      reason: "listing_missing",
      message: "Some items are no longer available.",
      unavailable: true,
    };
  }

  const liveStock: Record<string, number> = {};
  const lines: BundleSnapshotLineV1[] = [];
  let itemSubtotal = 0;
  let shipping = 0;

  for (const item of items) {
    const product = products.find((row) => row.id === item.product_id);
    if (!product) {
      return {
        ok: false,
        reason: "listing_missing",
        message: "Some items are no longer available.",
        unavailable: true,
      };
    }

    if (product.seller_id !== bundle.seller_id) {
      return {
        ok: false,
        reason: "seller_changed",
        message: "Some items are no longer available.",
        unavailable: true,
      };
    }

    if (product.status === "draft" || product.status === "deleted" || product.status === "hidden") {
      return {
        ok: false,
        reason: "listing_inactive",
        message: "Some items are no longer available.",
        unavailable: true,
      };
    }

    const stock = Number(product.stock ?? 0);
    liveStock[product.id] = stock;

    if (!isPurchasable(stock, product.status) || stock < item.quantity) {
      return {
        ok: false,
        reason: "stock",
        message: "Some items are no longer available.",
        unavailable: true,
      };
    }

    const livePrice = Number(product.price);
    const snapshotPrice = Number(item.unit_price);
    if (!Number.isFinite(livePrice) || livePrice <= 0) {
      return {
        ok: false,
        reason: "price_changed",
        message: "The price has changed. Please try again.",
      };
    }
    if (!amountsMatch(livePrice, snapshotPrice) && !input.skipListPriceMatch) {
      return {
        ok: false,
        reason: "price_changed",
        message: "The price has changed. Please try again.",
      };
    }

    const ship = Number(product.shipping_price ?? 0);
    if (Number.isFinite(ship) && ship > shipping) shipping = ship;

    const lineTotal = livePrice * item.quantity;
    itemSubtotal += lineTotal;

    lines.push({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: primaryImage(product, item.image_url),
      unitPrice: livePrice,
      quantity: item.quantity,
      maxStock: stock,
      condition: product.condition ?? "good",
      currency,
    });
  }

  if (!currency || currency.length !== 3) {
    return { ok: false, reason: "currency", message: "This currency isn't supported." };
  }

  const audit = FINANCIAL_AUDIT_ENGINE({
    itemPrice: itemSubtotal,
    shipping,
    currency,
  });
  if (!audit.ok) {
    return { ok: false, reason: "totals", message: "Unable to verify bundle totals." };
  }

  // Persist live price/stock onto bundle_items (batched parallel write-back).
  await Promise.all(
    lines.map((line) =>
      admin
        .from("bundle_items")
        .update({
          unit_price: line.unitPrice,
          max_stock_snapshot: line.maxStock,
          title: line.title,
          image_url: line.imageUrl,
          product_slug: line.slug,
          updated_at: new Date().toISOString(),
        })
        .eq("bundle_id", bundle.id)
        .eq("product_id", line.productId),
    ),
  );

  const priorStatus =
    bundle.status === "offer_pending" || bundle.status === "active"
      ? bundle.status
      : null;

  const snapshot = buildBundleCheckoutSnapshot({
    bundleId: bundle.id,
    buyerId: input.buyerId,
    sellerId: bundle.seller_id,
    sellerName: bundle.seller_display_name || "Seller",
    currency,
    itemPrice: itemSubtotal,
    platformFee: audit.platformFee,
    shipping,
    discount: 0,
    total: audit.total,
    lines,
    priorStatus,
  });

  return { ok: true, snapshot, liveStock };
}
