"use client";

import { memo } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import type { RovexoIconRef } from "@/lib/icons/types";
import { cn } from "@/lib/cn";

type HeroSlideVisualProps = {
  slideId: string;
  icon?: RovexoIconRef;
  className?: string;
};

/** Absolute Final — no premium icon variants on consumer migration paths. */
export const HeroSlideVisual = memo(function HeroSlideVisual({
  slideId,
  icon,
  className,
}: HeroSlideVisualProps) {
  return (
    <div className={cn("import-rx-hero-banner__visual", className)} data-slide={slideId} aria-hidden>
      {icon ? (
        <span className="import-rx-hero-banner__category-icon">
          <RovexoIcon icon={icon} variant="category" />
        </span>
      ) : null}
    </div>
  );
});
