import Link from "next/link";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { Product } from "@/lib/products/types";

type ProductSimilarItemsProps = {
  products: Product[];
  categoryId?: string | null;
};

export function ProductSimilarItems({ products, categoryId }: ProductSimilarItemsProps) {
  if (products.length === 0) return null;

  const seeAllHref = categoryId ? `/search?category=${categoryId}` : "/search";

  return (
    <section aria-labelledby="pd-similar-title">
      <div className="pd-v1__section-head">
        <h2 id="pd-similar-title" className="pd-v1__section-title">
          Similar items
        </h2>
        <Link href={seeAllHref} className="pd-v1__section-link">
          See all
        </Link>
      </div>

      <div className="pd-v1__similar-rail" role="list" aria-label="Similar listings">
        {products.map((product) => (
          <div key={product.id} role="listitem">
            <ListingCard
              product={product}
              variant="carousel"
              {...HP_CANONICAL_LISTING_PROPS}
              surface="similar"
              showSeller={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
