"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL, isDealProduct } from "@/components/premium/constants";

type DealsSectionProps = {
  products: Product[];
};

export function DealsSection({ products }: DealsSectionProps) {
  const deals = products.filter(isDealProduct);

  return (
    <ListingCarouselSection
      id="deals"
      title="Deals"
      products={deals.length > 0 ? deals : products.slice(0, 12)}
      viewAllHref={PREMIUM_VIEW_ALL.deals}
    />
  );
}
