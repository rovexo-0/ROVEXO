/**
 * P0 Mobile Instant Interaction — capped viewport + urgent pointerdown route prefetch.
 * Uses Next.js router.prefetch only. No new listing/inbox APIs.
 * Dedupes globally; speculative viewport uses per-bucket caps; tap prefetch ignores cap.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const prefetchedHrefs = new Set<string>();
const inflightHrefs = new Set<string>();
const bucketCounts = new Map<string, number>();

/** Listing cards (Homepage / Store / Saved) — visible only, capped. */
export const LISTING_CARD_VIEWPORT_PREFETCH_BUCKET = "listing-card" as const;
export const LISTING_CARD_VIEWPORT_PREFETCH_CAP = 8;

/** Inbox conversation rows — visible only, capped. */
export const INBOX_CONVERSATION_VIEWPORT_PREFETCH_BUCKET = "inbox-conversation" as const;
export const INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP = 4;

function canSpeculativePrefetch(href: string, bucket: string, cap: number): boolean {
  if (!href || href.startsWith("#") || href.startsWith("http")) return false;
  if (prefetchedHrefs.has(href) || inflightHrefs.has(href)) return false;
  if ((bucketCounts.get(bucket) ?? 0) >= cap) return false;
  return true;
}

function markPrefetched(href: string, bucket: string | null): void {
  if (prefetchedHrefs.has(href)) return;
  prefetchedHrefs.add(href);
  if (bucket) {
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
  }
}

function runPrefetch(
  router: { prefetch: (href: string) => void | Promise<void> },
  href: string,
  bucket: string | null,
): void {
  if (!href || href.startsWith("#") || href.startsWith("http")) return;
  if (prefetchedHrefs.has(href) || inflightHrefs.has(href)) return;
  inflightHrefs.add(href);
  if (bucket) markPrefetched(href, bucket);
  else prefetchedHrefs.add(href);
  try {
    void Promise.resolve(router.prefetch(href)).finally(() => {
      inflightHrefs.delete(href);
      prefetchedHrefs.add(href);
    });
  } catch {
    inflightHrefs.delete(href);
  }
}

/**
 * Urgent prefetch on pointer/touch before navigation (ignores speculative cap).
 * Safe to call repeatedly — deduped.
 */
export function prefetchRouteOnIntent(
  router: { prefetch: (href: string) => void | Promise<void> },
  href: string | undefined,
): void {
  if (!href) return;
  runPrefetch(router, href, null);
}

/**
 * Prefetch a route once when the bound element enters the viewport.
 */
export function useViewportRoutePrefetch(
  href: string | undefined,
  options: {
    enabled: boolean;
    bucket: string;
    cap: number;
    /** Root margin to prefetch slightly before fully visible (mobile). */
    rootMargin?: string;
  },
): {
  ref: (node: Element | null) => void;
  onPointerDown: () => void;
  onTouchStart: () => void;
} {
  const router = useRouter();
  const [node, setNode] = useState<Element | null>(null);
  const setRef = useCallback((el: Element | null) => {
    setNode(el);
  }, []);

  const intentPrefetch = useCallback(() => {
    if (!options.enabled || !href) return;
    prefetchRouteOnIntent(router, href);
  }, [options.enabled, href, router]);

  useEffect(() => {
    if (!options.enabled || !node || !href) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (!canSpeculativePrefetch(href, options.bucket, options.cap)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!canSpeculativePrefetch(href, options.bucket, options.cap)) {
          observer.disconnect();
          return;
        }
        runPrefetch(router, href, options.bucket);
        observer.disconnect();
      },
      {
        root: null,
        rootMargin: options.rootMargin ?? "120px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    options.enabled,
    options.bucket,
    options.cap,
    options.rootMargin,
    href,
    node,
    router,
  ]);

  return {
    ref: setRef,
    onPointerDown: intentPrefetch,
    onTouchStart: intentPrefetch,
  };
}

/** Test/reset helper — not for production UI. */
export function resetViewportRoutePrefetchStateForTests(): void {
  prefetchedHrefs.clear();
  inflightHrefs.clear();
  bucketCounts.clear();
}
