"use client";

import Link from "next/link";
import { memo } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP3_LISTING_CARD_PROPS } from "@/components/homepage-v3/constants";
import type { Product } from "@/lib/products/types";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export type HomepageV3ListingRailProps = {
  id: string;
  title: string;
  products: Product[];
  viewAllHref: string;
  statusBadgeLabel?: string;
  showStatusBadge?: boolean;
};

export const HomepageV3ListingRail = memo(function HomepageV3ListingRail({
  id,
  title,
  products,
  viewAllHref,
  statusBadgeLabel,
  showStatusBadge = false,
}: HomepageV3ListingRailProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby={id} className="hp3-section">
      <div className="hp3-section__head">
        <h2 id={id} className="hp3-section__title">
          {title}
        </h2>
        <Link href={viewAllHref} className={cn("hp3-section__view-all", focusRing)}>
          View all
        </Link>
      </div>
      <div className="hp3-rail" role="list">
        {products.map((product) => (
          <div key={product.id} role="listitem" className="hp3-rail__card">
            <ListingCard
              {...HP3_LISTING_CARD_PROPS}
              product={product}
              variant="carousel"
              className="hp3-card--rail"
              statusBadgeLabel={statusBadgeLabel}
              showStatusBadge={showStatusBadge}
            />
          </div>
        ))}
      </div>
    </section>
  );
});
