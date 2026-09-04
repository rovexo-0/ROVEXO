import Link from "next/link";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { Product } from "@/lib/products/types";
import type { ProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { InternalLinksSection } from "@/features/seo/components/InternalLinksSection";
import { MarketplaceNoProductsEmpty } from "@/features/search/components/MarketplaceNoProductsEmpty";
import { localBrowseLinks, popularBrowseLinks, relatedCategoryLinks } from "@/lib/seo/internal-links";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import "@/styles/rovexo/search-results-v1.css";

type ProgrammaticPageViewProps = {
  page: ProgrammaticPage;
  products: Product[];
  total: number;
};

export function ProgrammaticPageView({ page, products, total }: ProgrammaticPageViewProps) {
  const internalLinkGroups = [
    relatedCategoryLinks(page.categorySlugs),
    popularBrowseLinks(),
    ...(page.locationSlug && page.locationName
      ? [localBrowseLinks(page.locationSlug, page.locationName)]
      : []),
  ];

  if (!products.length) {
    return (
      <main
        className="srch-results srch-results--empty w-full max-w-none"
        data-empty-state="no-products-v1"
      >
        <div className="srch-results__empty-chrome">
          <Link
            href="/browse"
            className="srch-results__empty-back"
            aria-label="Back to Browse"
          >
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
      </main>
    );
  }

  return (
    <main className="w-full max-w-none px-ds-4 py-ds-6">
      <nav className="text-sm text-text-muted">
        <Link href="/" className="text-primary">
          Home
        </Link>
        {" / "}
        <Link href={page.canonicalCategoryPath} className="text-primary">
          {page.categorySlugs[page.categorySlugs.length - 1]?.replace(/-/g, " ")}
        </Link>
      </nav>

      <h1 className="mt-ds-4 text-2xl font-bold capitalize">{page.title}</h1>
      <p className="mt-ds-2 text-sm text-text-secondary">{page.description}</p>
      <p className="mt-ds-2 text-xs text-text-muted">{total} listings</p>

      <div className="mt-ds-6 rx-listing-grid">
        {products.map((product) => (
          <ListingCard key={product.id} product={product} variant="grid" {...HP_CANONICAL_LISTING_PROPS} />
        ))}
      </div>

      <InternalLinksSection groups={internalLinkGroups} />
    </main>
  );
}
