"use client";

import Link from "next/link";
import { memo } from "react";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { HOME_CATEGORY_RAIL } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import "./home-category-rail.css";

type HomeCategoryRailProps = {
  className?: string;
};

export const HomeCategoryRail = memo(function HomeCategoryRail({ className }: HomeCategoryRailProps) {
  return (
    <section
      aria-labelledby="home-categories-heading"
      className={cn("home-category-rail-section px-ds-4", className)}
    >
      <h2 id="home-categories-heading" className="sr-only">
        Categories
      </h2>

      <div className="home-category-premium-rail -mx-ds-4 px-ds-4" role="list">
        {HOME_CATEGORY_RAIL.map((category, index) => {
          const href = category.href ?? (category.slug ? `/category/${category.slug}` : "/categories");

          return (
            <Link
              key={category.name}
              href={href}
              role="listitem"
              className={cn("home-category-premium-tile", focusRing, transitionFast)}
            >
              <div className="home-category-premium-card">
                <HomeCategoryIconImage type={category.icon} priority={index < 5} />
              </div>
              <p className="home-category-premium-label">{category.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
