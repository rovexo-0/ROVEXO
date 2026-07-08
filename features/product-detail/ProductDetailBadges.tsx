import { isPremiumSeller, isVerifiedStore } from "@/lib/product-detail/format";
import type { Product } from "@/lib/products/types";

type ProductDetailBadgesProps = {
  product: Product;
};

export function ProductDetailBadges({ product }: ProductDetailBadgesProps) {
  const verified = isVerifiedStore(product);
  const premium = isPremiumSeller(product);

  if (!verified && !premium) return null;

  return (
    <div className="pd-v1__badges">
      {verified ? (
        <span className="pd-v1__badge pd-v1__badge--verified">
          <span aria-hidden>✓</span> Verified Seller
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
