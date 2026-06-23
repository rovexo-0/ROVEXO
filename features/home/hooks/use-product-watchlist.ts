"use client";

import { useCallback, useEffect, useState } from "react";

export function useProductWatchlist(slug: string, initialSaved = false) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/saved?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { saved?: boolean } | null) => {
        if (!cancelled && payload) {
          setIsSaved(Boolean(payload.saved));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggle = useCallback(async () => {
    if (isPending) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
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
      }
    } catch {
      setIsSaved(!nextSaved);
    } finally {
      setIsPending(false);
    }
  }, [isPending, isSaved, slug]);

  return { isSaved, toggle, isPending };
}
