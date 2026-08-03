/**
 * Bundle Engine v1.0 — presentation cache only.
 * NOT the authority. Database + Bundle Server Engine are the ONLY truth.
 * Never write mirror before a confirmed server success.
 * On any API failure → discard cache → rehydrate from GET /api/bundle.
 */

import {
  BUNDLE_SYNC_EVENT,
  bundleItemCount,
  bundleSubtotal,
  mergeLineIntoBundle,
  removeBundleLinePure,
  updateBundleLineQuantityPure,
  type BundleAddResultV1,
  type BundleLineItemV1,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-domain-v1";

export const BUNDLE_MIRROR_STORAGE_KEY = "rovexo:bundle-mirror:v1";

export type { BundleLineItemV1, BundleSnapshotV1, BundleAddResultV1 };
export { bundleItemCount, bundleSubtotal, BUNDLE_SYNC_EVENT };

function emitSync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BUNDLE_SYNC_EVENT));
}

export function readBundleMirror(): BundleSnapshotV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BUNDLE_MIRROR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BundleSnapshotV1;
    if (!parsed?.sellerId || !Array.isArray(parsed.items)) return null;
    if (parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBundleMirror(bundle: BundleSnapshotV1 | null): void {
  if (typeof window === "undefined") return;
  if (!bundle || bundle.items.length === 0) {
    window.localStorage.removeItem(BUNDLE_MIRROR_STORAGE_KEY);
    emitSync();
    return;
  }
  window.localStorage.setItem(BUNDLE_MIRROR_STORAGE_KEY, JSON.stringify(bundle));
  emitSync();
}

export function discardBundleMirror(): void {
  writeBundleMirror(null);
}

export function addLineToBundleMirror(input: {
  sellerId: string;
  sellerName: string;
  line: BundleLineItemV1;
}): BundleAddResultV1 {
  const result = mergeLineIntoBundle({
    current: readBundleMirror(),
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    line: input.line,
  });
  if (result.ok) writeBundleMirror(result.bundle);
  return result;
}

export function updateBundleLineQuantityMirror(productId: string, quantity: number): BundleSnapshotV1 | null {
  const current = readBundleMirror();
  if (!current) return null;
  const next = updateBundleLineQuantityPure(current, productId, quantity);
  writeBundleMirror(next);
  return next;
}

export function removeBundleLineMirror(productId: string): BundleSnapshotV1 | null {
  const current = readBundleMirror();
  if (!current) return null;
  const next = removeBundleLinePure(current, productId);
  writeBundleMirror(next);
  return next;
}

/** Replace cache from server snapshot (null clears). */
export function replaceBundleMirrorFromServer(bundle: BundleSnapshotV1 | null): void {
  writeBundleMirror(bundle);
}

/**
 * Fail-closed rehydrate: discard cache, fetch GET /api/bundle, rewrite mirror.
 * Returns server snapshot (null when empty / unauthenticated).
 */
export async function rehydrateBundleMirrorFromServer(): Promise<BundleSnapshotV1 | null> {
  discardBundleMirror();
  try {
    const res = await fetch("/api/bundle", { credentials: "include" });
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    const payload = (await res.json()) as { ok?: boolean; bundle?: BundleSnapshotV1 | null };
    if (!payload.ok) {
      return null;
    }
    writeBundleMirror(payload.bundle ?? null);
    return payload.bundle ?? null;
  } catch {
    return null;
  }
}
