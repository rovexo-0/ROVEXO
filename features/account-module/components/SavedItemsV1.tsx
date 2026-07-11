"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";
import { formatPlatformFeeLine } from "@/lib/listing-card/format";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
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
    <AccountModuleShell title="Saved Items" backHref="/account" version="v1.0">
      {items.length === 0 ? (
        <div className="acm-empty" data-saved-version="v1.0">
          <p className="acm-empty__title">No saved items</p>
          <p className="acm-empty__text">Tap the heart on any listing to save it here.</p>
          <Link href="/search" className="acm-cta__btn" style={{ marginTop: 16, display: "inline-flex" }}>
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="rx-listing-grid acm-saved-feed" data-saved-version="v1.0">
          {visibleItems.map((item) => (
            <div key={item.productSlug} className="acm-saved-feed__item">
              <ListingCard
                product={item.product}
                {...LISTING_CARD_HOMEPAGE_PROPS}
                showStatusBadge={item.listingStatus === "sold"}
                statusBadgeLabel="SOLD"
                favoriteMode="controlled"
                isFavorite
                onFavorite={() => void removeItem(item.productSlug)}
              />
              <p className="acm-saved-feed__fee">{formatPlatformFeeLine(item.product.price)}</p>
            </div>
          ))}
          {visibleCount < items.length ? (
            <div ref={sentinelRef} className="acm-saved-feed__sentinel" aria-hidden />
          ) : null}
        </div>
      )}
    </AccountModuleShell>
  );
}
