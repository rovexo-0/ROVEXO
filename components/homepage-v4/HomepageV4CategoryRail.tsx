"use client";

import Link from "next/link";
import { ROVEXO_HOMEPAGE_CATEGORIES } from "@/components/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function HomepageV4CategoryRail() {
  return (
    <nav aria-label="Categories" className="rx4-cats">
      <div className="rx4-cats__track">
        {ROVEXO_HOMEPAGE_CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={category.href}
            className={cn("rx4-cats__chip", focusRing)}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
