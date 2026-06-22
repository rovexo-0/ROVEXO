import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { getCategoryIcon } from "@/lib/categories/visuals";
import type { CategoryPageData } from "@/lib/categories/server";
import type { Product } from "@/lib/products/types";
import { InternalLinksSection } from "@/features/seo/components/InternalLinksSection";
import { popularBrowseLinks, relatedCategoryLinks } from "@/lib/seo/internal-links";
import Image from "next/image";

type CategoryPageViewProps = {
  category: CategoryPageData;
  products: Product[];
  total: number;
};

export function CategoryPageView({ category, products, total }: CategoryPageViewProps) {
  const { node, breadcrumbs, subcategories, imageUrl } = category;
  const hrefPrefix = breadcrumbs[breadcrumbs.length - 1]?.href ?? `/category/${node.slug}`;
  const slugPath = breadcrumbs.map((crumb) => crumb.slug);
  const internalLinkGroups = [
    relatedCategoryLinks(slugPath),
    popularBrowseLinks(),
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-ds-6 px-ds-4 py-ds-5 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))] pt-[calc(7.5rem+env(safe-area-inset-top))]">
      <Breadcrumbs items={breadcrumbs} />

      <section className="relative overflow-hidden rounded-ds-xl bg-secondary">
        <div className="relative aspect-[21/9] min-h-[140px] w-full md:min-h-[200px]">
          <Image
            src={imageUrl}
            alt={`${node.name} category on ROVEXO`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-ds-5">
            <p className="text-sm text-white/80">{getCategoryIcon(node.slug)} Browse</p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{node.name}</h1>
            <p className="mt-ds-1 text-sm text-white/85">
              {total.toLocaleString()} {total === 1 ? "listing" : "listings"}
            </p>
          </div>
        </div>
      </section>

      {subcategories.length > 0 && (
        <section aria-labelledby="subcategories-heading">
          <h2 id="subcategories-heading" className="mb-ds-3 text-lg font-semibold text-text-primary">
            Subcategories
          </h2>
          <div className="flex flex-wrap gap-ds-2">
            {subcategories.map((subcategory) => (
              <CategoryChip
                key={subcategory.id}
                label={subcategory.name}
                href={`${hrefPrefix}/${subcategory.slug}`}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="listings-heading">
        <h2 id="listings-heading" className="mb-ds-3 text-lg font-semibold text-text-primary">
          Listings
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-3 md:gap-ds-4 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} {...productToCardProps(product)} />
            ))}
          </div>
        ) : (
          <div className="rounded-ds-xl border border-dashed border-border bg-secondary/50 px-ds-5 py-ds-8 text-center">
            <p className="text-sm font-medium text-text-primary">No listings in this category yet</p>
            <p className="mt-ds-1 text-sm text-text-secondary">
              Check back soon or browse related categories above.
            </p>
            <Link
              href="/sell"
              className="mt-ds-4 inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground"
            >
              Sell in {node.name}
            </Link>
          </div>
        )}
      </section>

      <InternalLinksSection groups={internalLinkGroups} />
    </main>
  );
}
