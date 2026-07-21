"use client";

/**
 * Live products.views from DATABASE publish — never a frontend counter authority.
 */

import { useSyncExternalStore } from "react";
import {
  getLiveViewCount,
  subscribeViewLive,
} from "@/lib/views/view-live-sync";

function subscribe(callback: () => void): () => void {
  return subscribeViewLive(() => callback());
}

export function useLiveProductViews(slug: string, initialViews: number | undefined): number {
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
