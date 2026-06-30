"use client";

import { memo } from "react";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import { CategoryPremiumIcon } from "@/components/category/CategoryPremiumIcon";
import { resolveCategoryPremiumIcon } from "@/lib/home/category-premium-library";
import { cn } from "@/lib/cn";

type HomeCategoryIconImageProps = {
  type: HomeCategoryIconType | string;
  className?: string;
  priority?: boolean;
  size?: number;
  containerSize?: number;
  staged?: boolean;
  /** @deprecated All renders use premium PNG */
  variant?: "default" | "premium";
  animated?: boolean;
};

export const HomeCategoryIconImage = memo(function HomeCategoryIconImage({
  type,
  className,
  priority = false,
  size = 40,
  containerSize = 60,
  staged = false,
  animated = true,
}: HomeCategoryIconImageProps) {
  const resolved = resolveCategoryPremiumIcon(type);

  const icon = (
    <CategoryPremiumIcon
      icon={resolved}
      size={size}
      containerSize={containerSize}
      className={cn("rx-category-render__img", className)}
      priority={priority}
      animated={animated}
    />
  );

  return staged ? <span className="rx-category-icon-stage">{icon}</span> : icon;
});
