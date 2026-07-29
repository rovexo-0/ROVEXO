import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { CategoryPageData } from "@/lib/categories/server";
import type { Product } from "@/lib/products/types";
import { InternalLinksSection } from "@/features/seo/components/InternalLinksSection";
import { MarketplaceNoProductsEmpty } from "@/features/search/components/MarketplaceNoProductsEmpty";
import { popularBrowseLinks, relatedCategoryLinks } from "@/lib/seo/internal-links";
import "@/styles/rovexo/search-results-v1.css";

type CategoryPageViewProps = {
  category: CategoryPageData;
  products: Product[];
  total: number;
};

/**
 * Category page = Listings page (Phase I mobile-first simplification).
 * Empty state: Owner Global Empty State Lock (Search & Browse).
 */
export function CategoryPageView({ category, products, total }: CategoryPageViewProps) {
  const { node, breadcrumbs } = category;
  const slugPath = breadcrumbs.map((crumb) => crumb.slug);
  const internalLinkGroups = [
    relatedCategoryLinks(slugPath),
    popularBrowseLinks(),
  ];

  if (products.length === 0) {
    return (
      <HubPageMain className="srch-results srch-results--empty flex w-full max-w-none flex-col px-0 py-0">
        <div data-empty-state="no-products-v1" className="flex min-h-0 flex-1 flex-col">
          <div className="srch-results__empty-chrome">
            <Link href="/browse" className="srch-results__empty-back" aria-label="Back to Browse">
              <svg
                className="srch-results__empty-back-icon"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <Link href="/search" className="srch-results__empty-bar" aria-label="Search">
              <span className="srch-results__empty-bar-icon" aria-hidden>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
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
      <section aria-labelledby="listings-heading">
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

      <InternalLinksSection groups={internalLinkGroups} />
    </HubPageMain>
  );
}
