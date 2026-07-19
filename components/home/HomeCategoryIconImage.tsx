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
  /** Absolute Final: premium 3D assets removed — always line icons. */
  variant?: "default" | "premium";
};

/** Absolute Final — one icon system (line). Premium/3D category assets are dead. */
export const HomeCategoryIconImage = memo(function HomeCategoryIconImage({
  type,
  className,
  size = 56,
  staged = false,
}: HomeCategoryIconImageProps) {
  const icon = (
    <HomeCategoryIcon3D
      type={type}
      size={size}
      className={cn("rx-category-tile-icon", className)}
    />
  );

  return staged ? <span className="rx-category-icon-stage">{icon}</span> : icon;
});
