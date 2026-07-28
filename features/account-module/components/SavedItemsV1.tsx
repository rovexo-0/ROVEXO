"use client";

/**
 * Saved page — LIVE production flow (extracted from origin/develop SavedItemsV1).
 * DELETE → setItems(payload.items) immediately · empty → Nothing saved + Browse
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalButtonLink, CanonicalInfoBlock } from "@/src/components/canonical";
import type { SavedItem } from "@/lib/saved/types";

const PAGE_SIZE = 20;

type SavedItemsV1Props = {
  initialItems: SavedItem[];
  /** @deprecated LIVE uses initialItems only */
  items?: SavedItem[];
};

export function SavedItemsV1({ initialItems, items: itemsProp }: SavedItemsV1Props) {
  const seed = initialItems ?? itemsProp ?? [];
  const [items, setItems] = useState(seed);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const removeItem = useCallback(async (slug: string) => {
    const response = await fetch("/api/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlugs: [slug] }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { items: SavedItem[] };
    setItems(payload.items);
    setVisibleCount(PAGE_SIZE);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <AccountCanonicalShell title="Saved" backHref="/account" showHeaderTitle>
      {items.length === 0 ? (
        <CanonicalInfoBlock variant="description">
          <p className="font-medium text-text-primary">Nothing saved</p>
          <p className="mt-ds-1">Tap ♥ on a listing.</p>
          <CanonicalButtonLink href="/search" variant="secondary" className="mt-ds-3">
            Browse
          </CanonicalButtonLink>
        </CanonicalInfoBlock>
      ) : (
        <div
          className="rx-listing-grid w-full"
          data-saved-live="v1.0-production"
          data-saved-count={items.length}
        >
          {visibleItems.map((item) => {
            const isSold = item.listingStatus === "sold";
            return (
              <ListingCard
                key={item.productSlug}
                product={item.product}
                {...LISTING_CARD_HOMEPAGE_PROPS}
                showStatusBadge={isSold}
                statusBadgeLabel="SOLD"
                /* Sold stays in Saved; hide purchase-implying protection line. */
                showBuyerProtection={!isSold}
                showPlatformFee={false}
                favoriteMode="controlled"
                isFavorite
                onFavorite={() => void removeItem(item.productSlug)}
              />
            );
          })}
          {visibleCount < items.length ? (
            <div ref={sentinelRef} className="h-4" aria-hidden />
          ) : null}
        </div>
      )}
    </AccountCanonicalShell>
  );
}
