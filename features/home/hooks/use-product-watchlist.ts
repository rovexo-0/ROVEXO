"use client";

/**
 * LIVE production heart hook — extracted from www deploy source (origin/main|develop).
 * Optimistic 0ms UI · batch hydrate · rollback on fail · no shared bus · no soft RSC refresh
 *
 * Hydrate: one GET /api/saved (list) shared across cards — replaces N× GET ?slug= waterfall.
 * Remount truth still comes from DB via that list endpoint (same Saved SSOT).
 */

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/products/types";
import {
  invalidateSavedStatusCache,
  loadSavedSlugSet,
  markSavedInCache,
} from "@/lib/saved/saved-status-cache";

export function useProductWatchlist(
  productOrSlug: Product | string | null | undefined,
  initialSaved = false,
) {
  const slug =
    !productOrSlug
      ? ""
      : typeof productOrSlug === "string"
        ? productOrSlug
        : productOrSlug.slug;

  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    void loadSavedSlugSet()
      .then((set) => {
        if (!cancelled) setIsSaved(set.has(slug));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggle = useCallback(async () => {
    if (!slug || isPending) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    markSavedInCache(slug, nextSaved);
    setIsPending(true);

    try {
      const response = await fetch("/api/saved", {
        method: nextSaved ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          nextSaved ? { productSlug: slug } : { productSlugs: [slug] },
        ),
      });

      if (!response.ok) {
        setIsSaved(!nextSaved);
        markSavedInCache(slug, !nextSaved);
        invalidateSavedStatusCache();
      }
    } catch {
      setIsSaved(!nextSaved);
      markSavedInCache(slug, !nextSaved);
      invalidateSavedStatusCache();
    } finally {
      setIsPending(false);
    }
  }, [isPending, isSaved, slug]);

  return { isSaved, toggle, isPending };
}
