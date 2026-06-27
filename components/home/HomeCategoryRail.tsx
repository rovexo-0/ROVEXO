"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback } from "react";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeCategoryRailProps = {
  className?: string;
};

function triggerCategoryHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

export const HomeCategoryRail = memo(function HomeCategoryRail({ className }: HomeCategoryRailProps) {
  const pathname = usePathname();

  const handlePress = useCallback(() => {
    triggerCategoryHaptic();
  }, []);

  return (
    <section
      aria-labelledby="home-categories-heading"
      className={cn("rx-category-rail-section px-ds-4", className)}
    >
      <h2 id="home-categories-heading" className="sr-only">
        Categories
      </h2>

      <div
        className="rx-category-rail -mx-ds-4 px-ds-4"
        role="list"
        aria-label="Shop by category"
      >
        {HOME_CATEGORY_NAV.map((category, index) => {
          const href = category.href ?? `/category/${category.slug}`;
          const isSelected = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={category.name}
              href={href}
              role="listitem"
              onClick={handlePress}
              aria-current={isSelected ? "page" : undefined}
              className={cn(
                "rx-category-card",
                isSelected && "rx-category-card--selected",
                focusRing,
              )}
            >
              <span className="rx-category-icon">
                <HomeCategoryIconImage
                  type={category.icon}
                  size={80}
                  variant="premium"
                  priority={index < 4}
                />
              </span>
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
