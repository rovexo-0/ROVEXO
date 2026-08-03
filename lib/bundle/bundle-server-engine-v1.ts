import "server-only";

/**
 * Bundle Engine v1.0 — server write authority (service role).
 * Fail closed. Exactly one active bundle per buyer.
 *
 * Tables land via migration 20260801180000_bundle_engine_v1.sql.
 * Until Database types regenerate, writes use an untyped service client.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import {
  clampBundleQuantity,
  mergeLineIntoBundle,
  type BundleLineItemV1,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-domain-v1";
import { appendBundleEvent } from "@/lib/bundle/bundle-events-v1";

type BundleRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  seller_display_name: string;
  status: BundleSnapshotV1["status"];
  currency: string;
  updated_at: string;
};

type BundleItemRow = {
  id: string;
  bundle_id: string;
  product_id: string;
  product_slug: string;
  title: string;
  image_url: string;
  unit_price: number | string;
  quantity: number;
  max_stock_snapshot: number;
};

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number | string;
  stock: number | null;
  status: string;
  seller_id: string;
  product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }> | null;
};

function createBundleDb(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mapSnapshot(row: BundleRow, items: BundleItemRow[]): BundleSnapshotV1 {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    sellerName: row.seller_display_name,
    status: row.status,
    currency: row.currency,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      slug: item.product_slug,
      title: item.title,
      imageUrl: item.image_url,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      maxStock: item.max_stock_snapshot,
    })),
  };
}

function primaryImageUrl(product: ProductRow, fallback: string): string {
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return images[0]?.url || fallback || "";
}

async function appendEvent(input: {
  bundleId: string;
  actorId: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await appendBundleEvent(input);
}

export async function getActiveBundleForBuyer(buyerId: string): Promise<BundleSnapshotV1 | null> {
  return getBundleForBuyer(buyerId, ["active"]);
}

export async function getBundleForBuyer(
  buyerId: string,
  statuses: BundleSnapshotV1["status"][],
  bundleId?: string | null,
): Promise<BundleSnapshotV1 | null> {
  const db = createBundleDb();
  let query = db
    .from("bundles")
    .select("id, buyer_id, seller_id, seller_display_name, status, currency, updated_at")
    .eq("buyer_id", buyerId);
  if (bundleId) {
    query = query.eq("id", bundleId);
  }
  if (statuses.length === 1) {
    query = query.eq("status", statuses[0]!);
  } else {
    query = query.in("status", statuses);
  }
  const { data: row, error } = await query
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) return null;

  const { data: items } = await db
    .from("bundle_items")
    .select(
      "id, bundle_id, product_id, product_slug, title, image_url, unit_price, quantity, max_stock_snapshot",
    )
    .eq("bundle_id", (row as BundleRow).id)
    .order("created_at", { ascending: true });

  return mapSnapshot(row as BundleRow, (items ?? []) as BundleItemRow[]);
}

export type AddBundleLineServerResult =
  | { ok: true; bundle: BundleSnapshotV1 }
  | {
      ok: false;
      reason: "other_seller" | "out_of_stock" | "invalid_product" | "self_bundle" | "auth";
      existingSellerName?: string;
      existingBundleId?: string | null;
      message: string;
    };

export async function addLineToActiveBundle(input: {
  buyerId: string;
  sellerId: string;
  sellerName: string;
  line: BundleLineItemV1;
}): Promise<AddBundleLineServerResult> {
  if (input.buyerId === input.sellerId) {
    return { ok: false, reason: "self_bundle", message: "You cannot bundle your own listing." };
  }

  const db = createBundleDb();
  const { data: productRaw } = await db
    .from("products")
    .select(
      "id, slug, title, price, stock, status, seller_id, product_images(url, is_primary, sort_order)",
    )
    .eq("id", input.line.productId)
    .maybeSingle();

  const product = productRaw as ProductRow | null;
  if (!product || product.seller_id !== input.sellerId || product.status !== "published") {
    return { ok: false, reason: "invalid_product", message: "Listing is unavailable." };
  }

  const liveStock = Number(product.stock ?? 0);
  if (liveStock <= 0) {
    return { ok: false, reason: "out_of_stock", message: "This item is out of stock." };
  }

  const qty = clampBundleQuantity(input.line.quantity, liveStock);
  const imageUrl = primaryImageUrl(product, input.line.imageUrl);

  const current = await getActiveBundleForBuyer(input.buyerId);
  const merged = mergeLineIntoBundle({
    current,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    line: {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl,
      unitPrice: Number(product.price),
      quantity: qty,
      maxStock: liveStock,
    },
    buyerId: input.buyerId,
  });

  if (!merged.ok) {
    if (merged.reason === "other_seller") {
      return {
        ok: false,
        reason: "other_seller",
        existingSellerName: merged.existingSellerName,
        existingBundleId: merged.existingBundleId,
        message: "You already have an active bundle. Finish or discard it first.",
      };
    }
    return { ok: false, reason: "out_of_stock", message: "Unable to add this item to the bundle." };
  }

  let bundleId = current?.id ?? null;
  if (!bundleId) {
    const { data: created, error: createError } = await db
      .from("bundles")
      .insert({
        buyer_id: input.buyerId,
        seller_id: input.sellerId,
        seller_display_name: input.sellerName,
        status: "active",
        currency: "GBP",
      })
      .select("id, buyer_id, seller_id, seller_display_name, status, currency, updated_at")
      .single();

    if (createError || !created) {
      const raced = await getActiveBundleForBuyer(input.buyerId);
      if (raced && raced.sellerId !== input.sellerId) {
        return {
          ok: false,
          reason: "other_seller",
          existingSellerName: raced.sellerName,
          existingBundleId: raced.id,
          message: "You already have an active bundle. Finish or discard it first.",
        };
      }
      if (raced && raced.sellerId === input.sellerId) {
        // Unique active-index race: reuse the winning same-seller row.
        bundleId = raced.id;
      } else {
        return { ok: false, reason: "invalid_product", message: "Unable to create bundle." };
      }
    } else {
      bundleId = (created as BundleRow).id;
      await appendEvent({
        bundleId,
        actorId: input.buyerId,
        eventType: "bundle.created",
        payload: { sellerId: input.sellerId },
      });
    }
  } else {
    await db
      .from("bundles")
      .update({
        seller_display_name: input.sellerName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bundleId);
  }

  if (!bundleId) {
    return { ok: false, reason: "invalid_product", message: "Unable to create bundle." };
  }

  const line = merged.bundle.items.find((item) => item.productId === product.id)!;
  const { error: upsertError } = await db.from("bundle_items").upsert(
    {
      bundle_id: bundleId,
      product_id: product.id,
      product_slug: product.slug,
      title: product.title,
      image_url: imageUrl,
      unit_price: Number(product.price),
      quantity: line.quantity,
      max_stock_snapshot: liveStock,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bundle_id,product_id" },
  );

  if (upsertError) {
    return { ok: false, reason: "invalid_product", message: "Unable to save bundle item." };
  }

  await appendEvent({
    bundleId,
    actorId: input.buyerId,
    eventType: "bundle.item_added",
    payload: { productId: product.id, quantity: line.quantity },
  });

  const snapshot = await getActiveBundleForBuyer(input.buyerId);
  if (!snapshot) {
    return { ok: false, reason: "invalid_product", message: "Bundle unavailable after save." };
  }
  return { ok: true, bundle: snapshot };
}

export async function discardActiveBundle(buyerId: string): Promise<BundleSnapshotV1 | null> {
  const current = await getActiveBundleForBuyer(buyerId);
  if (!current?.id) return null;
  const db = createBundleDb();
  await db
    .from("bundles")
    .update({
      status: "discarded",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .eq("buyer_id", buyerId)
    .eq("status", "active");
  await appendEvent({
    bundleId: current.id,
    actorId: buyerId,
    eventType: "bundle.discarded",
  });
  return null;
}

export async function updateActiveBundleItemQuantity(input: {
  buyerId: string;
  productId: string;
  quantity: number;
}): Promise<
  | { ok: true; bundle: BundleSnapshotV1 | null }
  | { ok: false; reason: "not_found" | "out_of_stock"; message: string }
> {
  const current = await getActiveBundleForBuyer(input.buyerId);
  if (!current?.id) return { ok: false, reason: "not_found", message: "No active bundle." };
  const line = current.items.find((item) => item.productId === input.productId);
  if (!line) return { ok: false, reason: "not_found", message: "Item not in bundle." };

  const db = createBundleDb();
  const { data: productRaw } = await db
    .from("products")
    .select("stock, status")
    .eq("id", input.productId)
    .maybeSingle();
  const product = productRaw as { stock: number | null; status: string } | null;
  const liveStock = Number(product?.stock ?? 0);
  if (!product || product.status !== "published" || liveStock <= 0) {
    return { ok: false, reason: "out_of_stock", message: "Item is no longer available." };
  }

  const qty = clampBundleQuantity(input.quantity, liveStock);
  const { error: qtyError } = await db
    .from("bundle_items")
    .update({
      quantity: qty,
      max_stock_snapshot: liveStock,
      updated_at: new Date().toISOString(),
    })
    .eq("bundle_id", current.id)
    .eq("product_id", input.productId);

  if (qtyError) {
    return { ok: false, reason: "out_of_stock", message: "Unable to update quantity." };
  }

  await appendEvent({
    bundleId: current.id,
    actorId: input.buyerId,
    eventType: "bundle.item_qty",
    payload: { productId: input.productId, quantity: qty },
  });

  const snapshot = await getActiveBundleForBuyer(input.buyerId);
  return { ok: true, bundle: snapshot };
}

export async function removeActiveBundleItem(input: {
  buyerId: string;
  productId: string;
}): Promise<{ ok: true; bundle: BundleSnapshotV1 | null } | { ok: false; message: string }> {
  const current = await getActiveBundleForBuyer(input.buyerId);
  if (!current?.id) return { ok: false, message: "No active bundle." };
  const db = createBundleDb();
  await db
    .from("bundle_items")
    .delete()
    .eq("bundle_id", current.id)
    .eq("product_id", input.productId);

  await appendEvent({
    bundleId: current.id,
    actorId: input.buyerId,
    eventType: "bundle.item_removed",
    payload: { productId: input.productId },
  });

  const { data: remainingRows } = await db
    .from("bundle_items")
    .select("id")
    .eq("bundle_id", current.id)
    .limit(1);

  if (!remainingRows?.length) {
    // Discard only this bundle id. If a concurrent add raced in, restore.
    await db
      .from("bundles")
      .update({
        status: "discarded",
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id)
      .eq("buyer_id", input.buyerId)
      .eq("status", "active");

    const { data: racedItems } = await db
      .from("bundle_items")
      .select("id")
      .eq("bundle_id", current.id)
      .limit(1);

    if (racedItems?.length) {
      await db
        .from("bundles")
        .update({
          status: "active",
          closed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .eq("buyer_id", input.buyerId);
      const restored = await getActiveBundleForBuyer(input.buyerId);
      return { ok: true, bundle: restored };
    }

    await appendEvent({
      bundleId: current.id,
      actorId: input.buyerId,
      eventType: "bundle.discarded",
    });
    return { ok: true, bundle: null };
  }

  const remaining = await getActiveBundleForBuyer(input.buyerId);
  return { ok: true, bundle: remaining };
}
