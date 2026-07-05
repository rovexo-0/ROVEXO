"use client";

import Link from "next/link";
import {
  getCategoryPremiumPngSrc,
  getCategoryPremiumSrcSet,
  isRovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { cn } from "@/lib/cn";
import type { RovexoCategory } from "@/components/home/constants";

type RovexoCategoryCardProps = {
  category: RovexoCategory;
  onNavigate?: () => void;
  className?: string;
};

export function RovexoCategoryCard({ category, onNavigate, className }: RovexoCategoryCardProps) {
  // All rail keys resolve to a premium 3D render; electronics is a safe canonical fallback.
  const iconKey = isRovexoCategoryPremiumKey(category.icon) ? category.icon : "electronics";

  return (
    <Link
      href={category.href}
      onClick={onNavigate}
      className={cn("home-v1-category-tile shrink-0", className)}
    >
      <div className="home-v1-category-tile__slot">
        <picture>
          <source
            srcSet={getCategoryPremiumSrcSet(iconKey, "avif")}
            sizes="(min-width: 640px) 84px, 72px"
            type="image/avif"
          />
          <source
            srcSet={getCategoryPremiumSrcSet(iconKey, "webp")}
            sizes="(min-width: 640px) 84px, 72px"
            type="image/webp"
          />
          <img
            src={getCategoryPremiumPngSrc(iconKey)}
            srcSet={getCategoryPremiumSrcSet(iconKey, "png")}
            sizes="(min-width: 640px) 84px, 72px"
            alt=""
            aria-hidden
            width={84}
            height={84}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="home-v1-category-tile__icon"
            style={{ objectFit: "contain" }}
          />
        </picture>
      </div>
      <span className="home-v1-category-tile__name">{category.name}</span>
    </Link>
  );
}
