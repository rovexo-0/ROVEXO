import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/ui/ProductCard";
import { Rating } from "@/components/ui/Rating";
import { getPublicSellerProfile } from "@/lib/profile/public";
import {
  loadSellerReviews,
  SellerReviewsSection,
} from "@/features/profile/components/SellerReviewsSection";
import { TrustPublicSummary } from "@/features/trust/components/TrustPublicSummary";
import { getPublicTrustSummary } from "@/lib/trust/service";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicSellerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicSellerProfile(username);

  if (!profile) {
    notFound();
  }

  const [reviews, trustSummary] = await Promise.all([
    loadSellerReviews(profile.id),
    getPublicTrustSummary(profile.id),
  ]);

  return (
    <BetaAppShell>
      <BetaPageHeader title={profile.fullName} backHref="/search" />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Card padding="lg" className="">
          <h1 className="text-xl font-semibold text-text-primary">{profile.fullName}</h1>
          <p className="mt-ds-1 text-sm text-text-secondary">@{profile.username}</p>
          {profile.rating > 0 && (
            <div className="mt-ds-3">
              <Rating value={profile.rating} reviewCount={profile.reviewCount} size="sm" />
            </div>
          )}
          <p className="mt-ds-3 text-sm text-text-secondary">
            {profile.listingCount} listings · {profile.salesCount} sales
          </p>
        </Card>

        <TrustPublicSummary summary={trustSummary} />

        {profile.listings.length > 0 ? (
          <section className="marketplace-listing-grid">
            {profile.listings.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                href={`/listing/${product.slug}`}
                imageUrl={product.imageUrl}
                price={product.price}
                condition={product.condition}
                views={product.views}
                isFeatured={product.isFeatured}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            title="No active listings"
            description="This seller has no items listed right now."
            actionLabel="Browse marketplace"
            actionHref="/"
          />
        )}

        <SellerReviewsSection sellerId={profile.id} reviews={reviews} />
      </main>
    </BetaAppShell>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicSellerProfile(username);
  if (!profile) {
    return { title: "Seller not found | ROVEXO" };
  }

  return {
    title: `${profile.fullName} (@${profile.username}) | ROVEXO`,
    description: `Shop listings from ${profile.fullName} on ROVEXO.`,
  };
}
