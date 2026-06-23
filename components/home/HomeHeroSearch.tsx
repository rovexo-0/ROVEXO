"use client";

import type { CSSProperties } from "react";
import { RovexoLogo3D } from "@/components/brand/RovexoLogo3D";
import { AppStoreButtons } from "@/components/home/AppStoreButtons";
import { MotionDiv } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

type HomeHeroSearchProps = {
  className?: string;
};

export function HomeHeroSearch({ className }: HomeHeroSearchProps) {
  return (
    <MotionDiv
      aria-labelledby="home-hero-search-heading"
      className={cn("hero-banner-2026 hero-banner-2026--royal mx-auto px-ds-4", className)}
    >
      <div className="hero-banner-2026__particles" aria-hidden>
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} className="hero-banner-2026__particle" style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
      <div className="hero-banner-2026__lines" aria-hidden />
      <div className="hero-banner-2026__glow" aria-hidden />

      <div className="hero-banner-2026__content hero-banner-2026__content--split">
        <div className="hero-banner-2026__brand-col">
          <RovexoLogo3D className="h-14 w-14 sm:h-16 sm:w-16" />
          <p className="hero-banner-2026__eyebrow">Premium Marketplace</p>
        </div>

        <div className="hero-banner-2026__copy-col">
          <h2 id="home-hero-search-heading" className="hero-banner-2026__title">
            Find your next deal
          </h2>
          <p className="hero-banner-2026__subtitle">
            Buy and sell with buyer protection across the UK
          </p>
          <AppStoreButtons />
        </div>
      </div>
    </MotionDiv>
  );
}
