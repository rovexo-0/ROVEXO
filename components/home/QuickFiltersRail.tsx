"use client";

import Link from "next/link";
import { memo } from "react";
import { HOME_QUICK_FILTERS } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export const QuickFiltersRail = memo(function QuickFiltersRail() {
  return (
    <section aria-labelledby="home-quick-filters-heading" className="px-ds-4">
      <h2 id="home-quick-filters-heading" className="sr-only">
        Quick filters
      </h2>
      <div
        className={cn(
          "-mx-ds-4 flex gap-ds-2 overflow-x-auto px-ds-4 pb-ds-1",
          "scroll-smooth overscroll-x-contain touch-pan-x",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="list"
      >
        {HOME_QUICK_FILTERS.map((filter) => (
          <Link
            key={filter.id}
            href={filter.href}
            role="listitem"
            className={cn(
              "inline-flex min-h-ds-7 shrink-0 snap-start items-center rounded-ds-full",
              "border border-border/80 bg-surface px-ds-4 text-sm font-medium text-text-secondary",
              "transition-[transform,box-shadow,border-color,color] duration-ds-fast ease-ds",
              "hover:border-primary/35 hover:text-primary hover:shadow-ds-medium",
              "active:scale-[0.97]",
              focusRing,
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </section>
  );
});
