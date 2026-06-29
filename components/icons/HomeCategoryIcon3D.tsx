"use client";

import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import type { HomeCategoryIconType } from "@/lib/home/constants";

type HomeCategoryIcon3DProps = {
  type: HomeCategoryIconType;
  className?: string;
  size?: number;
};

/** Premium Icons8 3D Fluency category renders (transparent). */
export function HomeCategoryIcon3D({ type, className, size = 40 }: HomeCategoryIcon3DProps) {
  return (
    <HomeCategoryIconImage
      type={type}
      variant="premium"
      size={size}
      className={className}
    />
  );
}
