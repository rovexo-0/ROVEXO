/**
 * Bundle Reservation Engine v1.0 — multi-item reserve / release.
 * ALL lines succeed or NOTHING is reserved (fail closed + full rollback).
 * Inventory RPCs run in parallel; reserved_quantity write-back is batched.
 */

import "server-only";

import {
  releaseProductInventory,
  isPurchasable,
} from "@/lib/inventory/service";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { BundleCheckoutSnapshotV1 } from "@/lib/bundle/bundle-snapshot-v1";
import { bundleCheckoutLog } from "@/lib/bundle/bundle-checkout-log-v1";

export type BundleReservationHandle = {
  bundleId: string;
  lines: Array<{ productId: string; quantity: number }>;
};

function db() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function writeReservedQuantities(
  bundleId: string,
  lines: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  const admin = db();
  await Promise.all(
    lines.map((line) =>
      admin
        .from("bundle_items")
        .update({
          reserved_quantity: line.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("bundle_id", bundleId)
        .eq("product_id", line.productId),
    ),
  );
}

/**
 * Checkout Race Condition v1.0 — verify only (no marketplace-hiding reserve).
 */
export async function verifyBundleInventoryAvailable(
  snapshot: BundleCheckoutSnapshotV1,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = db();
  const productIds = snapshot.lines.map((line) => line.productId);
  const { data: products, error } = await admin
    .from("products")
    .select("id, stock, status")
    .in("id", productIds);

  if (error || !products || products.length !== productIds.length) {
    return { ok: false, message: "Some items are no longer available." };
  }

  const byId = new Map(products.map((row) => [row.id as string, row]));
  for (const line of snapshot.lines) {
    const product = byId.get(line.productId);
    const stock = Number(product?.stock ?? 0);
    const status = String(product?.status ?? "");
    if (!product || !isPurchasable(stock, status) || stock < line.quantity) {
      bundleCheckoutLog("Concurrency Conflict", {
        bundleId: snapshot.bundleId,
        productId: line.productId,
        error: "not_purchasable",
      });
      return { ok: false, message: "Some items are no longer available." };
    }
  }

  return { ok: true };
}

/**
 * Legacy reserve path — retained for heal/compat. Buy Now must use verify only.
 * @deprecated Checkout Race Condition v1.0 — do not hide listings at Buy Now.
 */
export async function reserveBundleInventoryAtomic(
  snapshot: BundleCheckoutSnapshotV1,
): Promise<{ ok: true; handle: BundleReservationHandle } | { ok: false; message: string }> {
  const verified = await verifyBundleInventoryAvailable(snapshot);
  if (!verified.ok) return verified;

  // No inventory reserve — listing stays published until payment claim.
  const locked = snapshot.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));

  bundleCheckoutLog("Reservation Created", {
    bundleId: snapshot.bundleId,
    lines: locked.length,
    mode: "verify_only_no_reserve",
  });

  return {
    ok: true,
    handle: { bundleId: snapshot.bundleId, lines: locked },
  };
}

export async function releaseBundleInventoryAtomic(
  handle: BundleReservationHandle | BundleCheckoutSnapshotV1 | null | undefined,
): Promise<void> {
  if (!handle) return;

  const lines =
    "lines" in handle && Array.isArray(handle.lines)
      ? handle.lines.map((line) => ({
          productId: "productId" in line ? line.productId : (line as { productId: string }).productId,
          quantity: "quantity" in line ? Number(line.quantity) : 1,
        }))
      : [];

  const bundleId = "bundleId" in handle ? handle.bundleId : null;

  await Promise.all(lines.map((line) => releaseProductInventory(line.productId, line.quantity)));
  if (bundleId) {
    await writeReservedQuantities(
      bundleId,
      lines.map((line) => ({ productId: line.productId, quantity: 0 })),
    );
  }

  bundleCheckoutLog("Reservation Released", {
    bundleId: bundleId ?? "unknown",
    lines: lines.length,
  });
}

/** Release from checkout session snapshot (expire / cancel / fail). */
export async function releaseBundleLinesFromSnapshot(
  snapshot: BundleCheckoutSnapshotV1 | null | undefined,
): Promise<void> {
  if (!snapshot) return;
  await releaseBundleInventoryAtomic({
    bundleId: snapshot.bundleId,
    lines: snapshot.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    })),
  });
}
