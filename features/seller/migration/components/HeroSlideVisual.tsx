"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";

type HeroSlideVisualProps = {
  slideId: string;
  className?: string;
};

export const HeroSlideVisual = memo(function HeroSlideVisual({
  slideId,
  className,
}: HeroSlideVisualProps) {
  return (
    <div
      className={cn("import-rx-hero-banner__visual", className)}
      data-visual={slideId}
      aria-hidden
    >
      <div className="import-rx-hero-banner__visual-scene">
        {slideId === "migration" ? (
          <>
            <span className="import-rx-hero-banner__parcel" />
            <span className="import-rx-hero-banner__logo import-rx-hero-banner__logo--a">eBay</span>
            <span className="import-rx-hero-banner__logo import-rx-hero-banner__logo--b">Etsy</span>
            <span className="import-rx-hero-banner__logo import-rx-hero-banner__logo--c">Shop</span>
          </>
        ) : null}
        {slideId === "sell-smarter" ? <span className="import-rx-hero-banner__rocket" /> : null}
        {slideId === "zero-fees" ? <span className="import-rx-hero-banner__gift" /> : null}
        {slideId === "secure-payments" ? <span className="import-rx-hero-banner__shield" /> : null}
        {slideId === "fast-delivery" ? <span className="import-rx-hero-banner__parcel import-rx-hero-banner__parcel--delivery" /> : null}
      </div>
    </div>
  );
});
