"use client";

import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerRecentlyViewed() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-recent" title="Recently viewed" href="/search">
      {data.recentlyViewed.length === 0 ? (
        <BuyerEmptyState title="No recently viewed items" />
      ) : (
        <div className="buyer-scroll">
          {data.recentlyViewed.map((product) => (
            <div key={product.id} className="w-[170px] shrink-0 snap-start">
              <ListingCard product={product} variant="grid" {...HP_CANONICAL_LISTING_PROPS} />
            </div>
          ))}
        </div>
      )}
    </BuyerSection>
  );
}
