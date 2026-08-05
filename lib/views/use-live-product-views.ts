"use client";

/**
 * Live products.views from DATABASE publish — never a frontend counter authority.
 * P5: subscribe per slug so unrelated cards on Browse grids do not wake.
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  getLiveViewCount,
  subscribeLiveViewCount,
} from "@/lib/views/view-live-sync";

export function useLiveProductViews(slug: string, initialViews: number | undefined): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeLiveViewCount(slug, onStoreChange),
    [slug],
  );

  const live = useSyncExternalStore(
    subscribe,
    () => getLiveViewCount(slug),
    () => undefined,
  );

  if (typeof live === "number" && Number.isFinite(live)) {
    return live;
  }
  return Math.max(0, Math.floor(initialViews ?? 0));
}
