import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { ProductGridSkeleton } from "@/components/home/ProductGridSkeleton";

type ProductSectionProps = {
  id: string;
  title: string;
  products: Product[];
  loading?: boolean;
};

export function ProductSection({ id, title, products, loading }: ProductSectionProps) {
  return (
    <section aria-labelledby={id} className="px-ds-4">
      <h2 id={id} className="mb-ds-3 text-lg font-semibold text-text-primary">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-3 md:gap-ds-4 lg:grid-cols-4">
        {loading
          ? <ProductGridSkeleton count={4} />
          : products.map((product) => (
              <div key={product.id} className="h-full">
                <ProductCard {...productToCardProps(product)} />
              </div>
            ))}
      </div>
    </section>
  );
}
