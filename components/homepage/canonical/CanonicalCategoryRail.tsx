"use client";

import Link from "next/link";
import { ROVEXO_HOMEPAGE_CATEGORIES } from "@/components/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

export function CanonicalCategoryRail() {
  return (
    <nav aria-label="Categories" className={css.rail}>
      <div className={css.railTrack}>
        {ROVEXO_HOMEPAGE_CATEGORIES.map((category) => (
          <Link key={category.slug} href={category.href} className={cn(css.chip, focusRing)}>
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
