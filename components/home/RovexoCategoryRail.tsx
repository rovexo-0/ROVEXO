"use client";

import { RovexoCategoryCard } from "@/components/home/RovexoCategoryCard";
import { ROVEXO_CATEGORIES } from "@/components/home/constants";
import { cn } from "@/lib/cn";

type RovexoCategoryRailProps = {
  className?: string;
};

export function RovexoCategoryRail({ className }: RovexoCategoryRailProps) {
  return (
    <section aria-label="Categories" className={cn("home-v1-categories", className)}>
      <div className="home-v1-category-scroller">
        <div className="home-v1-category-track">
          <div className="home-v1-category-track__set">
            {ROVEXO_CATEGORIES.map((category) => (
              <RovexoCategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
