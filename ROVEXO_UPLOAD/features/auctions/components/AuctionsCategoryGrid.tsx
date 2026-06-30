"use client";

import Link from "next/link";
import { memo } from "react";
import { CategoryIcon3D } from "@/components/icons/CategoryIcon3D";
import type { AuctionCategoryCount } from "@/lib/auctions/types";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AuctionsCategoryGridProps = {
  categories: AuctionCategoryCount[];
  activeSlug?: string | null;
  onSelect: (slug: string | null) => void;
};

export const AuctionsCategoryGrid = memo(function AuctionsCategoryGrid({
  categories,
  activeSlug,
  onSelect,
}: AuctionsCategoryGridProps) {
  return (
    <section aria-labelledby="auctions-categories-heading" className="px-ds-4">
      <h2 id="auctions-categories-heading" className="auctions-section-title mb-ds-2">
        Categories
      </h2>
      <div className="auctions-category-grid">
        {categories.map((category) => {
          const isActive = activeSlug === category.slug;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(isActive ? null : category.slug)}
              className={cn(
                "auctions-category-card",
                isActive && "ring-2 ring-primary/60",
                focusRing,
                transitionFast,
              )}
            >
              <div className="auctions-category-card__icon">
                <CategoryIcon3D type={category.icon} />
              </div>
              <p className="auctions-category-card__name">{category.name}</p>
              <p className="auctions-category-card__count">{category.liveCount} live</p>
            </button>
          );
        })}
        <Link
          href="/categories"
          className={cn("auctions-category-card", focusRing, transitionFast)}
        >
          <div className="auctions-category-card__icon">
            <CategoryIcon3D type="more" />
          </div>
          <p className="auctions-category-card__name">More...</p>
          <p className="auctions-category-card__count">Browse all</p>
        </Link>
      </div>
    </section>
  );
});
