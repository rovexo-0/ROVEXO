import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { ProductGridSkeleton, ProductSectionEmpty } from "@/components/home/ProductSectionStates";

type ProductSectionProps = {
  id: string;
  title: string;
  products: Product[];
  loading?: boolean;
  error?: boolean;
  viewAllHref?: string;
};

export function ProductSection({
  id,
  title,
  products,
  loading,
  error,
  viewAllHref,
}: ProductSectionProps) {
  return (
    <section aria-labelledby={id} className="px-ds-4">
      <div className="mb-ds-3 flex items-end justify-between gap-ds-3">
        <h2 id={id} className="text-lg font-semibold text-text-primary">
          {title}
        </h2>
        {viewAllHref && products.length > 0 && (
          <a href={viewAllHref} className="text-sm font-semibold text-primary hover:opacity-80">
            View all
          </a>
        )}
      </div>
      <div className="marketplace-listing-grid">
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <div className="w-full [grid-column:1/-1] rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
            Unable to load {title.toLowerCase()}.
          </div>
        ) : products.length === 0 ? (
          <div className="[grid-column:1/-1]">
            <ProductSectionEmpty title={title} />
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} {...productToCardProps(product, "homepage")} />
          ))
        )}
      </div>
    </section>
  );
}
