import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ListingCard } from "@/components/ui/ListingCard";
import { Rating } from "@/components/ui/Rating";
import type { Product } from "@/lib/products/types";
import { getCategoryImageUrl } from "@/lib/categories/visuals";
import { TrustPublicSummary } from "@/features/trust/components/TrustPublicSummary";
import type { PublicTrustSummary } from "@/lib/trust/types";
import { SafeImage } from "@/components/ui/SafeImage";

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
      <HubPageMain className="">
        <section className="relative">
          <div className="relative aspect-[21/9] min-h-[160px] w-full">
            <SafeImage
              src={getCategoryImageUrl("business")}
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
          <div className="relative mx-auto flex max-w-4xl items-end gap-ds-4 px-ds-4 -mt-10">
            <Avatar src={avatarUrl} alt={storeName} name={storeName} size="xl" />
            <div className="pb-ds-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {storeName}
                {verified && <span className="ml-ds-2 text-sm text-primary">Verified</span>}
              </h1>
              <p className="text-sm text-text-secondary">@{username}</p>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-4xl flex-col gap-ds-5 px-ds-4 py-ds-5">
          <Card padding="lg" className="">
            {rating > 0 && <Rating value={rating} reviewCount={reviewCount} size="sm" />}
            <p className="mt-ds-2 text-sm text-text-secondary">
              {listingCount} listings · {salesCount} sales · {followerCount} followers
            </p>
            {bio && <p className="mt-ds-3 text-sm text-text-primary">{bio}</p>}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                className="mt-ds-3 inline-block text-sm font-semibold text-primary"
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit website
              </a>
            )}
          </Card>

          {sellerTrust && <TrustPublicSummary summary={sellerTrust} compact />}

          <section aria-labelledby="featured-products-heading">
            <h2 id="featured-products-heading" className="mb-ds-3 text-lg font-semibold text-text-primary">
              Featured products
            </h2>
            {displayFeatured.length > 0 ? (
              <div className="rx-listing-grid">
                {displayFeatured.map((product) => (
                  <ListingCard key={product.id} product={product} variant="grid" surface="store" />
                ))}
              </div>
            ) : (
              <Card padding="lg" className="">
                <p className="text-sm text-text-secondary">No featured products yet.</p>
              </Card>
            )}
          </section>

          <section aria-labelledby="all-products-heading">
            <div className="mb-ds-3 flex items-center justify-between">
              <h2 id="all-products-heading" className="text-lg font-semibold text-text-primary">
                All products
              </h2>
              <Link href={`/user/${username}`} className="text-sm font-semibold text-primary">
                Seller profile
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="rx-listing-grid">
                {listings.map((product) => (
                  <ListingCard key={product.id} product={product} variant="grid" surface="store" />
                ))}
              </div>
            ) : (
              <Card padding="lg" className="">
                <p className="text-sm text-text-secondary">No active listings.</p>
              </Card>
            )}
          </section>
        </div>
      </HubPageMain>
    </BetaAppShell>
  );
}
