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
      className={cn(
        "premium-card mx-ds-4 overflow-hidden px-ds-5 py-ds-6",
        className,
      )}
    >
      <h2 id="home-hero-search-heading" className="relative z-[1] text-2xl font-bold tracking-tight text-text-primary">
        Find your next deal
      </h2>
      <p className="relative z-[1] mt-ds-2 text-sm leading-relaxed text-text-secondary">
        Search fashion, electronics, home, vehicles and more on ROVEXO.
      </p>
      <div className="relative z-[1] mt-ds-5">
        <HeaderSearchBar inputId="home-hero-search" placeholder="Search ROVEXO…" size="large" />
      </div>
    </MotionDiv>
  );
}
