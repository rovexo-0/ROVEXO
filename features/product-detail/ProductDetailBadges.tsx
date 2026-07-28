import { VerifiedBadge } from "@/components/VerifiedBadge";
import { resolveVerifiedStatus } from "@/lib/master-engine";
import { isPremiumSeller } from "@/lib/product-detail/format";
import type { Product } from "@/lib/products/types";

type ProductDetailBadgesProps = {
  product: Product;
};

export function ProductDetailBadges({ product }: ProductDetailBadgesProps) {
  const { showBadge } = resolveVerifiedStatus({
    isRovexoVerified: Boolean(product.sellerVerified),
  });
  const premium = isPremiumSeller(product);

  if (!showBadge && !premium) return null;

  return (
    <div className="pd-v1__badges">
      {showBadge ? (
        <span className="pd-v1__badge pd-v1__badge--verified" aria-label="ROVEXO VERIFIED">
          <VerifiedBadge />
          <span>ROVEXO VERIFIED</span>
        </span>
      ) : null}
      {premium ? (
        <span className="pd-v1__badge pd-v1__badge--premium">
          <span aria-hidden>★</span> Premium Seller
        </span>
      ) : null}
    </div>
  );
}
