"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import type { PromotionPreviewVariant } from "@/lib/promotions/catalog";
import { getPromoteIllustration } from "@/lib/promotions/illustrations";

type PromotionPreviewProps = {
  variant: PromotionPreviewVariant;
};

export function PromotionPreview({ variant }: PromotionPreviewProps) {
  const art = getPromoteIllustration(variant);

  return (
    <div
      className="promo-v1-preview"
      data-promo-illustration={variant}
      role="img"
      aria-label={art.alt}
    >
      <div className="promo-v1-preview__art">
        <SafeImage
          src={art.src}
          alt={art.alt}
          fill
          className="promo-v1-illust"
          sizes="(max-width: 640px) 40vw, 280px"
          priority={variant === "search-bump"}
          fallback="hide"
        />
      </div>
    </div>
  );
}
