"use client";

import { memo } from "react";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import {
  assertCategoryPremiumRender,
  getCategoryPremiumPngSrc,
  getCategoryPremiumSrcSet,
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
  /** Homepage carousel — premium transparent renders only, never falls back to generic icons */
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

    const avifSrcSet = getCategoryPremiumSrcSet(type, "avif");
    const webpSrcSet = getCategoryPremiumSrcSet(type, "webp");
    const pngFallback = getCategoryPremiumPngSrc(type);

    const icon = (
      <span className={cn("rx-category-render", className)}>
        <picture>
          <source srcSet={avifSrcSet} sizes="(max-width: 639px) 56px, (min-width: 1024px) 72px, 64px" type="image/avif" />
          <source srcSet={webpSrcSet} sizes="(max-width: 639px) 56px, (min-width: 1024px) 72px, 64px" type="image/webp" />
          <img
            src={pngFallback}
            srcSet={getCategoryPremiumSrcSet(type, "png")}
            sizes="(max-width: 639px) 56px, (min-width: 1024px) 72px, 64px"
            alt=""
            width={128}
            height={128}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            draggable={false}
            className="rx-category-render__img"
          />
        </picture>
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
