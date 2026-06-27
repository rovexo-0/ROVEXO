"use client";

import Link from "next/link";
import { memo } from "react";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeCategoryRailProps = {
  className?: string;
};

export const HomeCategoryRail = memo(function HomeCategoryRail({ className }: HomeCategoryRailProps) {
  return (
    <section
      aria-labelledby="home-categories-heading"
      className={cn("rx-category-rail-section px-ds-4", className)}
    >
      <h2 id="home-categories-heading" className="sr-only">
        Categories
      </h2>

      <div className="rx-category-rail -mx-ds-4 px-ds-4" role="list">
        {HOME_CATEGORY_NAV.map((category) => {
          const href = category.href ?? `/category/${category.slug}`;

          return (
            <Link
              key={category.name}
              href={href}
              role="listitem"
              className={cn("rx-category-card", focusRing)}
            >
              <HomeCategoryIconImage type={category.icon} />
              <span className="rx-category-card__text">
                <span className="rx-category-card__title">{category.name}</span>
                <span className="rx-category-card__subtitle">{category.subtitle}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
