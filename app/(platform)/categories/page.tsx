import type { Metadata } from "next";
import { CategoryCompactCard } from "@/features/categories/components/CategoryCompactCard";
import { DiscoveryPageShell } from "@/components/layout/DiscoveryPageShell";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "All Categories · ROVEXO",
  description: "Browse ROVEXO marketplace categories — Women, Men, Designer, Kids, Home, Electronics, Books & Media, Hobbies & Collectables, and Sports.",
  path: "/categories",
});

/** Blood XXVIII — All Categories index shows only the 9 Owner-locked roots. */
export default function CategoriesIndexPage() {
  return (
    <DiscoveryPageShell mainClassName="rx-category-index flex flex-col gap-ds-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">All categories</h1>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Explore the ROVEXO marketplace catalogue.
        </p>
      </div>

      <div className="rx-category-page-grid">
        {CANONICAL_ROOT_CATEGORIES.map((category) => (
          <CategoryCompactCard
            key={category.slug}
            name={category.name}
            slug={category.slug}
            subtitle={category.subtitle}
            href={`/category/${encodeURIComponent(category.slug)}`}
          />
        ))}
      </div>
    </DiscoveryPageShell>
  );
}
