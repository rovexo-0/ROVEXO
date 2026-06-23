import Image from "next/image";
import Link from "next/link";
import { getCategoryIcon } from "@/lib/categories/visuals";

export type HomeCategoryCard = {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  imageUrl: string;
};

type CategoryGridSectionProps = {
  categories: HomeCategoryCard[];
};

export function CategoryGridSection({ categories }: CategoryGridSectionProps) {
  return (
    <section aria-labelledby="home-categories-heading" className="px-ds-4">
      <div className="mb-ds-3 flex items-end justify-between gap-ds-3">
        <div>
          <h2 id="home-categories-heading" className="text-lg font-semibold text-text-primary">
            Shop by category
          </h2>
          <p className="text-sm text-text-secondary">Browse across every marketplace vertical</p>
        </div>
        <Link href="/categories" className="shrink-0 text-sm font-semibold text-primary hover:opacity-80">
          View all
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-4 md:gap-ds-4">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="premium-card group relative overflow-hidden"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-ds-3 text-white">
                <p className="text-sm font-semibold">
                  {getCategoryIcon(category.slug)} {category.name}
                </p>
                <p className="text-xs text-white/75">
                  {new Intl.NumberFormat("en-IE").format(category.itemCount)} items
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-ds-xl border border-dashed border-border bg-secondary/40 px-ds-5 py-ds-8 text-center">
          <p className="text-sm text-text-secondary">Categories will appear here once listings are live.</p>
        </div>
      )}
    </section>
  );
}
