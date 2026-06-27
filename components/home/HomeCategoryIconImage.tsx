"use client";

import Image from "next/image";
import { memo } from "react";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import {
  assertCategoryPremiumRender,
  getCategoryPremiumRenderSrc,
  hasCategoryPremiumRender,
} from "@/lib/home/category-premium-assets";
import { HomeCategoryIcon3D } from "@/components/icons/HomeCategoryIcon3D";
import { cn } from "@/lib/cn";

type HomeCategoryIconImageProps = {
  type: HomeCategoryIconType;
  className?: string;
  priority?: boolean;
  size?: number;
  staged?: boolean;
  /** Homepage carousel — premium WebP renders only, never falls back to generic icons */
  variant?: "default" | "premium";
};

function PremiumCategoryRenderMissing({ type }: { type: string }) {
  return (
    <span
      className="rx-category-render rx-category-render--missing"
      role="img"
      aria-label={`Premium category asset missing: ${type}`}
      data-missing-asset={type}
    />
  );
}

export const HomeCategoryIconImage = memo(function HomeCategoryIconImage({
  type,
  className,
  priority = false,
  size = 56,
  staged = false,
  variant = "default",
}: HomeCategoryIconImageProps) {
  if (variant === "premium") {
    if (!hasCategoryPremiumRender(type)) {
      if (process.env.NODE_ENV === "development") {
        assertCategoryPremiumRender(type);
      }
      return <PremiumCategoryRenderMissing type={type} />;
    }

    const icon = (
      <span className={cn("rx-category-render", className)}>
        <Image
          src={getCategoryPremiumRenderSrc(type)}
          alt=""
          width={128}
          height={128}
          sizes="(max-width: 639px) 52px, (min-width: 768px) 64px, 56px"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          draggable={false}
          className="rx-category-render__img"
        />
        <span className="rx-category-render__shine" aria-hidden />
      </span>
    );

    return staged ? <span className="rx-category-icon-stage">{icon}</span> : icon;
  }

  const icon = (
    <HomeCategoryIcon3D
      type={type}
      size={size}
      className={cn("rx-category-tile-icon", className)}
    />
  );

  return staged ? <span className="rx-category-icon-stage">{icon}</span> : icon;
});
