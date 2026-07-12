"use client";

import { CanonicalButtonLink, CanonicalInfoBlock } from "@/src/components/canonical";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";
import { formatPlatformFeeLine } from "@/lib/listing-card/format";
import { AccountCanonicalShell } from "@/features/account-canonical";

import type { SavedItem } from "@/lib/saved/types";

const PAGE_SIZE = 20;

type SavedItemsV1Props = {
  initialItems: SavedItem[];
};

export function SavedItemsV1({ initialItems }: SavedItemsV1Props) {
  const [items, setItems] = useState(initialItems);
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
    <AccountCanonicalShell title="Saved Items" backHref="/account">
      {items.length === 0 ? (
        <CanonicalInfoBlock variant="description">
          <p className="font-medium text-text-primary">No saved items</p>
          <p className="mt-ds-1">Tap the heart on any listing to save it here.</p>
          <CanonicalButtonLink href="/search" variant="secondary" className="mt-ds-4">
            Browse listings
          </CanonicalButtonLink>
        </CanonicalInfoBlock>
      ) : (
        <div className="rx-listing-grid">
          {visibleItems.map((item) => (
            <div key={item.productSlug} className="flex flex-col gap-ds-1">
              <ListingCard
                product={item.product}
                {...LISTING_CARD_HOMEPAGE_PROPS}
                showStatusBadge={item.listingStatus === "sold"}
                statusBadgeLabel="SOLD"
                favoriteMode="controlled"
                isFavorite
                onFavorite={() => void removeItem(item.productSlug)}
              />
              <p className="cds-field__hint px-ds-1">{formatPlatformFeeLine(item.product.price)}</p>
            </div>
          ))}
          {visibleCount < items.length ? <div ref={sentinelRef} className="h-4" aria-hidden /> : null}
        </div>
      )}
    </AccountCanonicalShell>
  );
}
