/**
 * Bundle Reservation Engine v1.0 — multi-item reserve / release.
 * ALL lines succeed or NOTHING is reserved (fail closed + full rollback).
 * Inventory RPCs run in parallel; reserved_quantity write-back is batched.
 */

import "server-only";

import { reserveProductInventory, releaseProductInventory } from "@/lib/inventory/service";
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
 * Reserve every line in parallel. On any failure → release successes → STOP.
 */
export async function reserveBundleInventoryAtomic(
  snapshot: BundleCheckoutSnapshotV1,
): Promise<{ ok: true; handle: BundleReservationHandle } | { ok: false; message: string }> {
  const results = await Promise.all(
    snapshot.lines.map(async (line) => {
      const result = await reserveProductInventory(line.productId, line.quantity);
      return { line, result };
    }),
  );

  const failed = results.find((row) => !row.result.success);
  if (failed) {
    bundleCheckoutLog("Concurrency Conflict", {
      bundleId: snapshot.bundleId,
      productId: failed.line.productId,
      error: failed.result.error,
    });
    const succeeded = results
      .filter((row) => row.result.success)
      .map((row) => ({ productId: row.line.productId, quantity: row.line.quantity }));
    await Promise.all(
      succeeded.map((line) => releaseProductInventory(line.productId, line.quantity)),
    );
    await writeReservedQuantities(
      snapshot.bundleId,
      succeeded.map((line) => ({ productId: line.productId, quantity: 0 })),
    );
    return { ok: false, message: "Some items are no longer available." };
  }

  const locked = snapshot.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));
  await writeReservedQuantities(snapshot.bundleId, locked);

  bundleCheckoutLog("Reservation Created", {
    bundleId: snapshot.bundleId,
    lines: locked.length,
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
