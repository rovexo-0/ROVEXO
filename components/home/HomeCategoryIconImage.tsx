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
};

export const HomeCategoryIconImage = memo(function HomeCategoryIconImage({
  type,
  className,
  size,
}: HomeCategoryIconImageProps) {
  return (
    <HomeCategoryIcon3D
      type={type}
      size={size}
      className={cn("rx-category-tile-icon", className)}
    />
  );
});
