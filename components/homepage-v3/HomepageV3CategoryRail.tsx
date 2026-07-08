"use client";

import Link from "next/link";
import { ROVEXO_CATEGORIES } from "@/components/home/constants";
import { cn } from "@/lib/cn";

export function HomepageV3CategoryRail() {
  return (
    <nav aria-label="Categories" className="hp3-categories">
      <div className="hp3-categories__scroller">
        {ROVEXO_CATEGORIES.map((category) => (
          <Link key={category.slug} href={category.href} className={cn("hp3-categories__chip")}>
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
