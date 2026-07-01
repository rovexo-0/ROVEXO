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
        className="rx-hero-banner rx-hero-banner--royal !border-0 !bg-transparent !shadow-none before:!opacity-0"
      >
        <div className="rx-hero-banner__particles" aria-hidden>
          {Array.from({ length: 14 }).map((_, index) => (
            <span key={index} className="rx-hero-banner__particle" style={{ "--i": index } as CSSProperties} />
          ))}
        </div>
        <div className="rx-hero-banner__lines" aria-hidden />
        <div className="rx-hero-banner__glow" aria-hidden />
        <div className="rx-hero-banner__sheen" aria-hidden />

        <div className="rx-hero-banner__content rx-hero-banner__content--split">
          <div className="rx-hero-banner__brand-col">
            <RovexoLogo3D className="h-14 w-14 shrink-0 sm:h-[4.25rem] sm:w-[4.25rem]" />
          </div>

          <div className="rx-hero-banner__copy-col">
            <p className="rx-hero-banner__eyebrow">Official ROVEXO</p>
            <h2 id="home-hero-search-heading" className="rx-hero-banner__headline">
              Premium Marketplace
            </h2>
            <p className="rx-hero-banner__title">Find your next deal</p>
            <p className="rx-hero-banner__subtitle">
              Download the app — buy and sell with buyer protection
            </p>
            <AppStoreButtons />
          </div>
        </div>
      </GlassSurface>
    </MotionDiv>
  );
}
