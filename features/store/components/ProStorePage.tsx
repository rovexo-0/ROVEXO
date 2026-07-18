import Link from "next/link";
import { DiscoveryPageShell } from "@/components/layout/DiscoveryPageShell";
import { Avatar } from "@/components/ui/Avatar";
import { ListingCard } from "@/components/ui/ListingCard";
import type { Product } from "@/lib/products/types";
import { TrustPublicSummary } from "@/features/trust/components/TrustPublicSummary";
import type { PublicTrustSummary } from "@/lib/trust/types";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type ProStorePageProps = {
  storeName: string;
  username: string;
  avatarUrl: string | null;
  verified: boolean;
  bio: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  followerCount: number;
  listingCount: number;
  salesCount: number;
  listings: Product[];
  sellerTrust?: PublicTrustSummary;
};

/**
 * Visit Store / Business Store — Absolute Final.
 * Discovery chrome + Master Menu rows for store meta; 2-col listing grids.
 * Purple / white / black only. Full phone width (16px).
 */
export function ProStorePage({
  storeName,
  username,
  avatarUrl,
  verified,
  bio,
  website,
  rating,
  reviewCount,
  followerCount,
  listingCount,
  salesCount,
  listings,
  sellerTrust,
}: ProStorePageProps) {
  const featured = listings.filter((item) => item.isFeatured).slice(0, 8);
  const displayFeatured = featured.length > 0 ? featured : listings.slice(0, 8);
  const websiteHref = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : null;

  return (
    <DiscoveryPageShell>
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
        <CanonicalSection title="Store">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title={storeName}
              description={`@${username}`}
              value={verified ? "Verified" : undefined}
              showChevron={false}
              icon={
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                  <Avatar src={avatarUrl} alt={storeName} name={storeName} size="md" />
                </span>
              }
            />
            {rating > 0 ? (
              <CanonicalMenuRow
                title="Rating"
                description={`${reviewCount} reviews`}
                value={rating.toFixed(1)}
                showChevron={false}
              />
            ) : null}
            <CanonicalMenuRow title="Listings" value={String(listingCount)} showChevron={false} />
            <CanonicalMenuRow title="Sales" value={String(salesCount)} showChevron={false} />
            <CanonicalMenuRow title="Followers" value={String(followerCount)} showChevron={false} />
            {bio ? (
              <CanonicalMenuRow title="About" description={bio} showChevron={false} />
            ) : null}
            {websiteHref ? (
              <CanonicalMenuRow title="Website" href={websiteHref} value="Visit" />
            ) : null}
            <CanonicalMenuRow title="Seller profile" href={`/user/${username}`} />
          </CanonicalCard>
        </CanonicalSection>

        {sellerTrust ? <TrustPublicSummary summary={sellerTrust} compact /> : null}

        <section aria-labelledby="featured-products-heading" className="w-full">
          <h2
            id="featured-products-heading"
            className="mb-2 text-[15px] font-semibold text-text-primary"
          >
            Featured
          </h2>
          {displayFeatured.length > 0 ? (
            <div className="rx-listing-grid grid w-full grid-cols-2 gap-3" data-listing-grid="2-col">
              {displayFeatured.map((product) => (
                <ListingCard key={product.id} product={product} variant="grid" surface="store" />
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-text-secondary">No featured products yet.</p>
          )}
        </section>

        <section aria-labelledby="all-products-heading" className="w-full">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="all-products-heading" className="text-[15px] font-semibold text-text-primary">
              All products
            </h2>
            <Link href={`/user/${username}`} className="text-[13px] font-semibold text-primary">
              Seller profile
            </Link>
          </div>
          {listings.length > 0 ? (
            <div className="rx-listing-grid grid w-full grid-cols-2 gap-3" data-listing-grid="2-col">
              {listings.map((product) => (
                <ListingCard key={product.id} product={product} variant="grid" surface="store" />
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-text-secondary">No active listings.</p>
          )}
        </section>
      </div>
    </DiscoveryPageShell>
  );
}
