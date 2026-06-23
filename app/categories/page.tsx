import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { getCategoryTree } from "@/lib/categories/queries";
import { getCategoryIcon, getCategoryImageUrl } from "@/lib/categories/visuals";
import Image from "next/image";

export const metadata: Metadata = {
  title: "All Categories · ROVEXO",
  description: "Browse every ROVEXO marketplace category from vehicles and property to fashion and home.",
};

export default function CategoriesIndexPage() {
  const tree = getCategoryTree();

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-ds-6 px-ds-4 py-ds-5 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))] pt-[calc(7.5rem+env(safe-area-inset-top))]">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">All categories</h1>
            <p className="mt-ds-1 text-sm text-text-secondary">
              Explore the full ROVEXO marketplace catalogue.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-ds-4 sm:grid-cols-2 lg:grid-cols-3">
            {tree.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative overflow-hidden premium-card transition-transform hover:-translate-y-0.5"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={getCategoryImageUrl(category.slug)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-ds-4 text-white">
                  <p className="text-lg font-semibold">
                    {getCategoryIcon(category.slug)} {category.name}
                  </p>
                  <p className="text-sm text-white/75">
                    {(category.children?.length ?? 0).toLocaleString()} subcategories
                  </p>
                </div>
              </Link>
            ))}
          </div>
      </main>
    </BetaAppShell>
  );
}
