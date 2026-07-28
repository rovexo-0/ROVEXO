import { Avatar } from "@/components/ui/Avatar";
import { PremiumButtonLink } from "@/components/ui/PremiumButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { resolveVerifiedStatus } from "@/lib/master-engine";
import { resolveStoreHrefFromSeller } from "@/lib/store/store-href";
import type { ProductDetail } from "@/lib/products/types";

type ProductStoreSectionProps = {
  product: ProductDetail;
};

/**
 * Seller card — Visit Store on the RIGHT of the row.
 * Avatar · Name · ★ · Visit Store (right). No other changes.
 */
export function ProductStoreSection({ product }: ProductStoreSectionProps) {
  const profileHref = resolveStoreHrefFromSeller({
    sellerId: product.sellerId,
    storeSlug: product.sellerUsername,
  });
  const { showBadge } = resolveVerifiedStatus({
    isRovexoVerified: Boolean(product.sellerVerified),
  });
  // Seller reputation (seller_profiles), not listing-level aggregates.
  const sellerRating =
    product.sellerRating != null && product.sellerRating > 0
      ? product.sellerRating
      : product.rating > 0
        ? product.rating
        : 0;
  const sellerReviews =
    product.sellerReviewCount != null && product.sellerReviewCount > 0
      ? product.sellerReviewCount
      : product.reviewCount > 0
        ? product.reviewCount
        : 0;
  const rating = sellerRating > 0 ? sellerRating.toFixed(1) : "0.0";
  const reviews =
    sellerReviews > 0 ? ` (${sellerReviews.toLocaleString("en-GB")})` : "";

  return (
    <section className="pd-v1__card pd-v1__store" aria-labelledby="pd-store-name">
      <div className="pd-v1__store-top">
        <Avatar
          src={product.sellerAvatar}
          name={product.sellerName}
          alt=""
          size="md"
          className="pd-v1__store-avatar"
        />
        <div className="pd-v1__store-meta">
          <div className="pd-v1__store-name-row">
            <h2 id="pd-store-name" className="pd-v1__store-name">
              {product.sellerName}
            </h2>
            {showBadge ? <VerifiedBadge /> : null}
          </div>
          <p className="pd-v1__store-stats" aria-label={`Rating ${rating}${reviews}`}>
            ★ {rating}
            {reviews}
          </p>
        </div>

        {profileHref ? (
          <PremiumButtonLink
            href={profileHref}
            variant="primary"
            size="sm"
            pair
            className="pd-v1__visit-store"
          >
            Visit Store
          </PremiumButtonLink>
        ) : null}
      </div>
    </section>
  );
}
