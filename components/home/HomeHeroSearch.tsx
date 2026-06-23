"use client";

import { HeaderSearchBar } from "@/components/header/HeaderSearchBar";
import { MotionDiv } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

type HomeHeroSearchProps = {
  className?: string;
};

export function HomeHeroSearch({ className }: HomeHeroSearchProps) {
  return (
    <MotionDiv
      aria-labelledby="home-hero-search-heading"
      className={cn("hero-banner-2026 mx-auto", className)}
    >
      <div className="hero-banner-2026__orb hero-banner-2026__orb--left" aria-hidden />
      <div className="hero-banner-2026__orb hero-banner-2026__orb--right" aria-hidden />
      <div className="hero-banner-2026__mesh" aria-hidden />

      <div className="hero-banner-2026__content">
        <p className="hero-banner-2026__eyebrow">Premium marketplace</p>
        <h2 id="home-hero-search-heading" className="hero-banner-2026__title">
          Find your next deal
        </h2>
        <p className="hero-banner-2026__subtitle">
          Fashion, electronics, home, vehicles and more
        </p>
        <div className="hero-banner-2026__search">
          <HeaderSearchBar inputId="home-hero-search" placeholder="Search ROVEXO…" size="large" className="w-full" />
        </div>
      </div>
    </MotionDiv>
  );
}
