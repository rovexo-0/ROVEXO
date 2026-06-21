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
      <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-3 md:gap-ds-4 lg:grid-cols-4">
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <div
            role="alert"
            className="col-span-full rounded-ds-xl border border-danger/30 bg-danger/5 px-ds-5 py-ds-6 text-center text-sm text-text-secondary"
          >
            Unable to load {title.toLowerCase()}.
          </div>
        ) : products.length === 0 ? (
          <ProductSectionEmpty title={title} />
        ) : (
          products.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard {...productToCardProps(product, "homepage")} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
