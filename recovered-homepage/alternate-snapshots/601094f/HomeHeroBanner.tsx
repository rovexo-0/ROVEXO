"use client";

import type { CSSProperties } from "react";
import { RovexoLogo3D } from "@/components/brand/RovexoLogo3D";
import { AppStoreButtons } from "@/components/home/AppStoreButtons";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { MotionDiv } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

type HomeHeroBannerProps = {
  className?: string;
};

export function HomeHeroBanner({ className }: HomeHeroBannerProps) {
  return (
    <MotionDiv
      aria-labelledby="home-hero-search-heading"
      className={cn("mx-auto px-ds-4", className)}
    >
      <GlassSurface
        as="section"
        depth={3}
        glow
        className="hero-banner-2026 hero-banner-2026--royal !border-0 !bg-transparent !shadow-none before:!opacity-0"
      >
        <div className="hero-banner-2026__particles" aria-hidden>
          {Array.from({ length: 14 }).map((_, index) => (
            <span key={index} className="hero-banner-2026__particle" style={{ "--i": index } as CSSProperties} />
          ))}
        </div>
        <div className="hero-banner-2026__lines" aria-hidden />
        <div className="hero-banner-2026__glow" aria-hidden />
        <div className="hero-banner-2026__sheen" aria-hidden />

        <div className="hero-banner-2026__content hero-banner-2026__content--split">
          <div className="hero-banner-2026__brand-col">
            <RovexoLogo3D className="h-14 w-14 shrink-0 sm:h-[4.25rem] sm:w-[4.25rem]" />
          </div>

          <div className="hero-banner-2026__copy-col">
            <p className="hero-banner-2026__eyebrow">Official ROVEXO</p>
            <h2 id="home-hero-search-heading" className="hero-banner-2026__headline">
              Premium Marketplace
            </h2>
            <p className="hero-banner-2026__title">Find your next deal</p>
            <p className="hero-banner-2026__subtitle">
              Download the app — buy and sell with buyer protection
            </p>
            <AppStoreButtons />
          </div>
        </div>
      </GlassSurface>
    </MotionDiv>
  );
}
