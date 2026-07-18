import type { Metadata } from "next";
import { CategoryCompactCard } from "@/features/categories/components/CategoryCompactCard";
import { DiscoveryPageShell } from "@/components/layout/DiscoveryPageShell";
import { getCategoryTree } from "@/lib/categories/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "All Categories · ROVEXO",
  description: "Browse every ROVEXO marketplace category from vehicles and property to fashion and home.",
  path: "/categories",
});

export default function CategoriesIndexPage() {
  const tree = getCategoryTree();

  return (
    <DiscoveryPageShell mainClassName="rx-category-index flex flex-col gap-ds-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">All categories</h1>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Explore the full ROVEXO marketplace catalogue.
        </p>
      </div>

      <div className="rx-category-page-grid">
        {tree.map((category) => (
          <CategoryCompactCard
            key={category.id}
            name={category.name}
            slug={category.slug}
            subtitle={`${(category.children?.length ?? 0).toLocaleString()} subcategories`}
          />
        ))}
      </div>
    </DiscoveryPageShell>
  );
}
