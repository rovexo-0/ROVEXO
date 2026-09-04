import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { CategoryPageData } from "@/lib/categories/server";
import type { Product } from "@/lib/products/types";
import { MarketplaceNoProductsEmpty } from "@/features/search/components/MarketplaceNoProductsEmpty";
import { CATEGORY_RESULTS_V1_FREEZE } from "@/lib/categories/category-results-v1-freeze";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import "@/styles/rovexo/search-results-v1.css";

type CategoryPageViewProps = {
  category: CategoryPageData;
  products: Product[];
  total: number;
};

/**
 * Category Results v1.0 FINAL — PRODUCTION UI LOCK ACTIVE.
 * Listings only · RX Bear empty state frozen · no editorial below.
 * SSOT: lib/categories/category-results-v1-freeze.ts
 */
export function CategoryPageView({ category, products, total }: CategoryPageViewProps) {
  const { node } = category;
  const freezeAttrs = {
    "data-category-results-freeze": CATEGORY_RESULTS_V1_FREEZE.canonicalVersion,
    "data-category-results-lock": "PRODUCTION_UI_LOCK_ACTIVE",
  } as const;

  if (products.length === 0) {
    return (
      <HubPageMain className="srch-results srch-results--empty flex w-full max-w-none flex-col px-0 py-0">
        <div
          data-empty-state="no-products-v1"
          className="flex min-h-0 flex-1 flex-col"
          {...freezeAttrs}
        >
          <div className="srch-results__empty-chrome">
            <Link href="/browse" className="srch-results__empty-back" aria-label="Back to Browse">
              <PlatformEmoji emoji={PLATFORM_EMOJI.back} size={18} className="srch-results__empty-back-icon" />
            </Link>
            <Link href="/search" className="srch-results__empty-bar" aria-label="Search">
              <span className="srch-results__empty-bar-icon" aria-hidden>
                <PlatformEmoji emoji={PLATFORM_EMOJI.search} size={18} />
              </span>
              <span className="srch-results__empty-bar-input" style={{ pointerEvents: "none" }}>
                Search ROVEXO
              </span>
            </Link>
          </div>
          <div className="srch-results__empty-body">
            <MarketplaceNoProductsEmpty />
          </div>
        </div>
      </HubPageMain>
    );
  }

  return (
    <HubPageMain className="flex w-full max-w-none flex-col gap-ds-3 px-[16px] py-ds-3">
      <section aria-labelledby="listings-heading" {...freezeAttrs}>
        <div className="mb-ds-2 flex items-baseline justify-between gap-ds-2">
          <h1 id="listings-heading" className="text-base font-semibold text-text-primary">
            {node.name}
          </h1>
          <p className="shrink-0 text-xs text-text-secondary">
            {total.toLocaleString()} {total === 1 ? "listing" : "listings"}
          </p>
        </div>
        <div className="rx-listing-grid">
          {products.map((product) => (
            <ListingCard
              key={product.id}
              product={product}
              variant="grid"
              {...HP_CANONICAL_LISTING_PROPS}
            />
          ))}
        </div>
      </section>
    </HubPageMain>
  );
}
