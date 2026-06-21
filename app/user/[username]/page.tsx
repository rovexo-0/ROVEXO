import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/ui/ProductCard";
import { Rating } from "@/components/ui/Rating";
import { getPublicSellerProfile } from "@/lib/profile/public";
import {
  loadSellerReviews,
  SellerReviewsSection,
} from "@/features/profile/components/SellerReviewsSection";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicSellerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicSellerProfile(username);

  if (!profile) {
    notFound();
  }

  const reviews = await loadSellerReviews(profile.id);

  return (
    <BetaAppShell>
      <BetaPageHeader title={profile.fullName} backHref="/search" />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Card padding="lg" className="shadow-ds-soft">
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

        {profile.listings.length > 0 ? (
          <section className="grid grid-cols-2 gap-ds-3">
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
          <Card padding="lg" className="shadow-ds-soft">
            <p className="text-sm text-text-secondary">No active listings.</p>
          </Card>
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
