"use client";

import { ListingCard } from "@/components/ui/ListingCard";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerSavedListings() {
  const { data } = useBuyerDashboard();

  return (
    <BuyerSection id="buyer-saved" title="Saved listings" href="/saved">
      {data.saved.length === 0 ? (
        <BuyerEmptyState title="No saved listings" message="Save items to compare and buy later." />
      ) : (
        <div className="buyer-scroll">
          {data.saved.map((item) => (
            <div key={item.productSlug} className="w-[170px] shrink-0 snap-start">
              <ListingCard product={item.product} variant="grid" surface="saved" />
            </div>
          ))}
        </div>
      )}
    </BuyerSection>
  );
}
