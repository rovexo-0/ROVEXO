"use client";

import { memo } from "react";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import { HomeCategoryIcon3D } from "@/components/icons/HomeCategoryIcon3D";
import { cn } from "@/lib/cn";

type HomeCategoryIconImageProps = {
  type: HomeCategoryIconType;
  className?: string;
  priority?: boolean;
  size?: number;
  staged?: boolean;
  /** Homepage rail — official Premium 3D SVG icons only (no raster thumbnails). */
  variant?: "default" | "premium";
};

export const HomeCategoryIconImage = memo(function HomeCategoryIconImage({
  type,
  className,
  priority = false,
  size = 56,
  staged = false,
  variant = "default",
}: HomeCategoryIconImageProps) {
  const isPremium = variant === "premium";

  const icon = (
    <HomeCategoryIcon3D
      type={type}
      size={size}
      className={cn(
        isPremium ? "rx-category-icon-3d rx-category-icon-3d--premium" : "rx-category-tile-icon",
        className,
      )}
    />
  );

  const wrapped = (
    <span
      className={cn(isPremium && "rx-category-icon-premium")}
      data-home-category-icon={isPremium ? "premium-3d" : "default-3d"}
      data-priority={priority ? "high" : undefined}
    >
      {icon}
    </span>
  );

  return staged ? <span className="rx-category-icon-stage">{wrapped}</span> : wrapped;
});
