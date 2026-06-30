"use client";

import { CategoryPremiumIcon } from "@/components/category/CategoryPremiumIcon";
import type { HomeCategoryIconType } from "@/lib/home/constants";

type HomeCategoryIcon3DProps = {
  type: HomeCategoryIconType | string;
  className?: string;
  size?: number;
  containerSize?: number;
};

/** Premium PNG category icon (restored ROVEXO 3D photography family). */
export function HomeCategoryIcon3D({
  type,
  className,
  size = 40,
  containerSize = 60,
}: HomeCategoryIcon3DProps) {
  return (
    <CategoryPremiumIcon
      icon={type}
      size={size}
      containerSize={containerSize}
      className={className}
      animated={false}
    />
  );
}
