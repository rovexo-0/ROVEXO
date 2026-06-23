"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { HOME_PROMO_SLIDES } from "@/lib/home/constants";
import { getCategoryImageUrl } from "@/lib/categories/visuals";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const AUTO_ADVANCE_MS = 5500;

export const HomePromoBanner = memo(function HomePromoBanner({ className }: { className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const slides = HOME_PROMO_SLIDES;
  const slide = slides[activeIndex]!;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) < 48) return;
    goTo(activeIndex + (delta < 0 ? 1 : -1));
  }

  return (
    <section
      aria-labelledby="home-promo-heading"
      aria-roledescription="carousel"
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Link
        href={slide.href}
        className={cn(
          "relative block overflow-hidden rounded-ds-xl shadow-ds-medium",
          "transition-transform duration-ds-fast active:scale-[0.995]",
          focusRing,
        )}
      >
        <div className="relative aspect-[2.35/1] w-full sm:aspect-[2.6/1]">
          <Image
            src={getCategoryImageUrl(slide.categorySlug)}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
            priority={activeIndex === 0}
          />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-90",
              slide.accent,
            )}
            aria-hidden
          />
          <div className="absolute inset-0 flex flex-col justify-end p-ds-5 text-primary-foreground">
            <h2 id="home-promo-heading" className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
              {slide.title}
            </h2>
            <p className="mt-ds-1 max-w-sm text-sm text-primary-foreground/90">{slide.subtitle}</p>
          </div>
        </div>
      </Link>

      <div className="mt-ds-3 flex items-center justify-center gap-ds-2" role="tablist" aria-label="Promo slides">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Slide ${index + 1}: ${item.title}`}
            onClick={() => goTo(index)}
            className={cn(
              "h-2 rounded-ds-full transition-all duration-ds-normal",
              index === activeIndex ? "w-6 bg-primary shadow-[0_0_12px_rgba(37,99,235,0.55)]" : "w-2 bg-border",
              focusRing,
            )}
          />
        ))}
      </div>
    </section>
  );
});
