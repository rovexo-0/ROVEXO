"use client";

import Link from "next/link";
import { memo } from "react";
import { getCategoryImageUrl } from "@/lib/categories/visuals";
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
          "-mx-ds-4 flex gap-ds-3 overflow-x-auto px-ds-4 pb-ds-1",
          "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="list"
      >
        {HOME_CATEGORY_RAIL.map((category) => {
          const href = category.slug ? `/category/${category.slug}` : "/categories";
          const imageUrl = category.slug ? getCategoryImageUrl(category.slug) : getCategoryImageUrl("everything-else");

          return (
            <Link
              key={category.name}
              href={href}
              role="listitem"
              className={cn(
                "group relative w-[4.75rem] shrink-0 snap-start xs:w-[5.25rem] sm:w-[5.75rem]",
                focusRing,
                transitionFast,
                "active:scale-[0.97]",
              )}
            >
              <div
                className={cn(
                  "premium-card relative flex aspect-square flex-col items-center justify-center overflow-hidden",
                  "border-border/60",
                  "group-hover:-translate-y-1 group-hover:shadow-[var(--ds-glow-primary)]",
                  transitionFast,
                )}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-primary/20 dark:from-white/10 dark:to-primary/30" />
                <span
                  className="premium-icon-3d relative z-[1] flex h-14 w-14 items-center justify-center text-[1.65rem] sm:text-[1.75rem]"
                  aria-hidden
                >
                  {category.icon}
                </span>
              </div>
              <p className="mt-ds-2 text-center text-[11px] font-semibold text-text-primary sm:text-xs">
                {category.name}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
