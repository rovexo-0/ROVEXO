"use client";

import Link from "next/link";
import { memo } from "react";
import { CategoryIcon3D } from "@/components/icons/CategoryIcon3D";
import { HOME_CATEGORY_RAIL } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type HomeCategoryRailProps = {
  className?: string;
};

export const HomeCategoryRail = memo(function HomeCategoryRail({ className }: HomeCategoryRailProps) {
  return (
    <section aria-labelledby="home-categories-heading" className={cn("px-ds-4", className)}>
      <h2 id="home-categories-heading" className="sr-only">
        Categories
      </h2>

      <div
        className={cn(
          "category-rail-2026 -mx-ds-4 flex gap-ds-2 overflow-x-auto px-ds-4 pb-ds-1",
          "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="list"
      >
        {HOME_CATEGORY_RAIL.map((category) => {
          const href = category.slug ? `/category/${category.slug}` : "/categories";

          return (
            <Link
              key={category.name}
              href={href}
              role="listitem"
              className={cn("category-tile-2026 snap-start", focusRing, transitionFast)}
            >
              <div className="category-tile-2026__container">
                <CategoryIcon3D type={category.icon} />
              </div>
              <p className="category-tile-2026__label">{category.name}</p>
            </Link>
          );
        })}

        <Link
          href="/categories"
          role="listitem"
          className={cn("category-tile-2026 snap-start", focusRing, transitionFast)}
        >
          <div className="category-tile-2026__container">
            <CategoryIcon3D type="more" />
          </div>
          <p className="category-tile-2026__label">More</p>
        </Link>
      </div>
    </section>
  );
});
