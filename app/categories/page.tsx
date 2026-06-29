import type { Metadata } from "next";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoriesMobileNav } from "@/features/categories/components/CategoriesMobileNav";
import { CategoryCompactCard } from "@/features/categories/components/CategoryCompactCard";
import { ResponsiveShell } from "@/features/mobile-ui";
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
    <BetaAppShell bottomNavTab="search">
      <Header />
      <main className="rx-category-index mx-auto flex w-full max-w-7xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))] pt-[calc(7.5rem+env(safe-area-inset-top))]">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">All categories</h1>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Explore the full ROVEXO marketplace catalogue.
          </p>
        </div>

        <ResponsiveShell mobile={<CategoriesMobileNav />} desktop={null} />

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
      </main>
    </BetaAppShell>
  );
}
