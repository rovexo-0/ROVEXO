import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";

type ProductSimilarItemsProps = {
  products: Product[];
};

export function ProductSimilarItems({ products }: ProductSimilarItemsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="similar-heading">
      <h2 id="similar-heading" className="mb-ds-3 text-base font-semibold text-text-primary">
        Similar Items
      </h2>

      <div className="marketplace-listing-carousel -mx-ds-4 px-ds-4 pb-ds-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="list">
        {products.map((product) => (
          <ProductCard key={product.id} {...productToCardProps(product)} />
        ))}
      </div>
    </section>
  );
}
