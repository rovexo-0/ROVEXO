import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Avatar } from "@/components/ui/Avatar";
import { ListingCard } from "@/components/ui/ListingCard";
import { Rating } from "@/components/ui/Rating";
import type { Product } from "@/lib/products/types";
import { TrustPublicSummary } from "@/features/trust/components/TrustPublicSummary";
import type { PublicTrustSummary } from "@/lib/trust/types";

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
 * Visit Store / Business Store — compact, full phone width, 2-col listings.
 * No banner heroes. No centered max-width columns.
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

  return (
    <BetaAppShell>
      <RovexoHeaderV2 />
      <HubPageMain className="w-full max-w-none">
        <div className="flex w-full max-w-none flex-col gap-ds-4 px-ds-4 py-ds-4">
          <header className="flex items-center gap-3">
            <Avatar src={avatarUrl} alt={storeName} name={storeName} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] font-bold leading-tight text-text-primary">
                {storeName}
                {verified ? <span className="ml-1 text-[12px] font-semibold text-primary">Verified</span> : null}
              </h1>
              <p className="text-[13px] text-text-secondary">@{username}</p>
              {rating > 0 ? <Rating value={rating} reviewCount={reviewCount} size="sm" /> : null}
            </div>
          </header>

          <p className="text-[13px] text-text-secondary">
            {listingCount} listings · {salesCount} sales · {followerCount} followers
          </p>
          {bio ? <p className="text-[14px] text-text-primary">{bio}</p> : null}
          {website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              className="text-[14px] font-semibold text-primary"
              rel="noopener noreferrer"
              target="_blank"
            >
              Visit website
            </a>
          ) : null}

          {sellerTrust ? <TrustPublicSummary summary={sellerTrust} compact /> : null}

          <section aria-labelledby="featured-products-heading">
            <h2 id="featured-products-heading" className="mb-2 text-[15px] font-semibold text-text-primary">
              Featured
            </h2>
            {displayFeatured.length > 0 ? (
              <div className="rx-listing-grid grid grid-cols-2 gap-3" data-listing-grid="2-col">
                {displayFeatured.map((product) => (
                  <ListingCard key={product.id} product={product} variant="grid" surface="store" />
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-text-secondary">No featured products yet.</p>
            )}
          </section>

          <section aria-labelledby="all-products-heading">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="all-products-heading" className="text-[15px] font-semibold text-text-primary">
                All products
              </h2>
              <Link href={`/user/${username}`} className="text-[13px] font-semibold text-primary">
                Seller profile
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="rx-listing-grid grid grid-cols-2 gap-3" data-listing-grid="2-col">
                {listings.map((product) => (
                  <ListingCard key={product.id} product={product} variant="grid" surface="store" />
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-text-secondary">No active listings.</p>
            )}
          </section>
        </div>
      </HubPageMain>
    </BetaAppShell>
  );
}
