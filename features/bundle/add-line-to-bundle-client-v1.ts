/**
 * Client helper — POST /api/bundle action:add.
 * Reuses Bundle Engine API; no parallel write path.
 */

import type { BundleLineItemV1, BundleSnapshotV1 } from "@/lib/bundle/bundle-domain-v1";
import {
  rehydrateBundleMirrorFromServer,
  writeBundleMirror,
} from "@/lib/bundle/bundle-mirror-v1";

export type AddLineToBundleClientResult =
  | { ok: true; bundle: BundleSnapshotV1 }
  | { ok: false; kind: "unauthorized" }
  | { ok: false; kind: "other_seller"; existingSellerName?: string }
  | { ok: false; kind: "error"; message: string };

export async function addLineToBundleClient(input: {
  sellerId: string;
  sellerName: string;
  line: BundleLineItemV1;
}): Promise<AddLineToBundleClientResult> {
  try {
    const res = await fetch("/api/bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "add",
        productId: input.line.productId,
        sellerId: input.sellerId,
        sellerName: input.sellerName,
        quantity: input.line.quantity,
        slug: input.line.slug,
        title: input.line.title,
        imageUrl: input.line.imageUrl,
        unitPrice: input.line.unitPrice,
        maxStock: input.line.maxStock,
      }),
    });
    const payload = (await res.json()) as {
      ok?: boolean;
      reason?: string;
      bundle?: BundleSnapshotV1 | null;
      error?: string;
      existingSellerName?: string;
    };

    if (res.status === 401) {
      await rehydrateBundleMirrorFromServer();
      return { ok: false, kind: "unauthorized" };
    }
    if (res.status === 409 || payload.reason === "other_seller") {
      await rehydrateBundleMirrorFromServer();
      return {
        ok: false,
        kind: "other_seller",
        existingSellerName: payload.existingSellerName,
      };
    }
    if (!res.ok || !payload.ok || !payload.bundle) {
      await rehydrateBundleMirrorFromServer();
      return {
        ok: false,
        kind: "error",
        message: payload.error ?? "Unable to add to bundle.",
      };
    }
    writeBundleMirror(payload.bundle);
    return { ok: true, bundle: payload.bundle };
  } catch {
    await rehydrateBundleMirrorFromServer();
    return { ok: false, kind: "error", message: "Unable to add to bundle." };
  }
}
