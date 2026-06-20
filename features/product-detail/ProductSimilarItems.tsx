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

      <div
        className="-mx-ds-4 flex gap-ds-3 overflow-x-auto px-ds-4 pb-ds-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {products.map((product) => (
          <div key={product.id} role="listitem" className="w-[11rem] shrink-0">
            <ProductCard {...productToCardProps(product)} />
          </div>
        ))}
      </div>
    </section>
  );
}
