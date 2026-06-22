import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/lib/products/types";
import { productToCardProps } from "@/lib/products/card";
import type { ProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { InternalLinksSection } from "@/features/seo/components/InternalLinksSection";
import { localBrowseLinks, popularBrowseLinks, relatedCategoryLinks } from "@/lib/seo/internal-links";

type ProgrammaticPageViewProps = {
  page: ProgrammaticPage;
  products: Product[];
  total: number;
};

export function ProgrammaticPageView({ page, products, total }: ProgrammaticPageViewProps) {
  const internalLinkGroups = [
    relatedCategoryLinks(page.categorySlugs),
    popularBrowseLinks(),
    ...(page.locationSlug && page.locationName
      ? [localBrowseLinks(page.locationSlug, page.locationName)]
      : []),
  ];

  return (
    <main className="mx-auto max-w-6xl px-ds-4 py-ds-6">
      <nav className="text-sm text-text-muted">
        <Link href="/" className="text-primary">
          Home
        </Link>
        {" / "}
        <Link href={page.canonicalCategoryPath} className="text-primary">
          {page.categorySlugs[page.categorySlugs.length - 1]?.replace(/-/g, " ")}
        </Link>
      </nav>

      <h1 className="mt-ds-4 text-2xl font-bold capitalize">{page.title}</h1>
      <p className="mt-ds-2 max-w-3xl text-sm text-text-secondary">{page.description}</p>
      <p className="mt-ds-2 text-xs text-text-muted">{total} listings</p>

      {products.length ? (
        <div className="mt-ds-6 grid grid-cols-2 gap-ds-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} {...productToCardProps(product, "category")} />
          ))}
        </div>
      ) : (
        <Card className="mt-ds-6 p-ds-6 text-sm text-text-secondary">
          No listings match this page yet.{" "}
          <Link href="/sell" className="font-medium text-primary">
            Be the first to sell
          </Link>
        </Card>
      )}

      <InternalLinksSection groups={internalLinkGroups} />
    </main>
  );
}
