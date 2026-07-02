"use client";

import { memo } from "react";
import {
  getPremiumEmptyStatePngSrc,
  getPremiumEmptyStateSrcSet,
  type PremiumEmptyStateId,
} from "@/lib/premium-design/empty-state-library";
import { cn } from "@/lib/cn";

type PremiumEmptyStateImageProps = {
  id: PremiumEmptyStateId;
  className?: string;
  priority?: boolean;
};

export const PremiumEmptyStateImage = memo(function PremiumEmptyStateImage({
  id,
  className,
  priority = false,
}: PremiumEmptyStateImageProps) {
  return (
    <picture className={cn("rx-premium-empty-state", className)}>
      <source
        srcSet={getPremiumEmptyStateSrcSet(id, "avif")}
        sizes="(max-width: 639px) 200px, 280px"
        type="image/avif"
      />
      <source
        srcSet={getPremiumEmptyStateSrcSet(id, "webp")}
        sizes="(max-width: 639px) 200px, 280px"
        type="image/webp"
      />
      <img
        src={getPremiumEmptyStatePngSrc(id)}
        srcSet={getPremiumEmptyStateSrcSet(id, "png")}
        sizes="(max-width: 639px) 200px, 280px"
        alt=""
        width={280}
        height={210}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="rx-premium-empty-state__img"
      />
    </picture>
  );
});
