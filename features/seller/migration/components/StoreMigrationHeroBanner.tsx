"use client";

import Link from "next/link";
import { memo, useCallback, useRef, useState, type CSSProperties, type PointerEvent, type TouchEvent } from "react";
import { HeroSlideVisual } from "@/features/seller/migration/components/HeroSlideVisual";
import { SELL_WIZARD_PATH } from "@/lib/seller/migration/config";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const AUTO_ADVANCE_MS = 5000;
const DRAG_THRESHOLD = 40;

type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  headingId?: string;
  theme?: "blue" | "indigo" | "violet" | "cyan" | "emerald";
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "migration",
    title: "Move Your Entire Store to ROVEXO",
    cta: "Bring Your Items",
    href: SELL_WIZARD_PATH,
    headingId: "store-migration-banner-heading",
    theme: "blue",
  },
  {
    id: "sell-smarter",
    title: "Sell Smarter.",
    subtitle: "Reach millions of buyers.",
    cta: "Start Selling",
    href: "/sell/new",
    theme: "indigo",
  },
  {
    id: "zero-fees",
    title: "Zero Listing Fees",
    subtitle: "List today.",
    cta: "List today.",
    href: "/sell",
    theme: "violet",
  },
  {
    id: "secure-payments",
    title: "Secure Payments",
    subtitle: "Buyer Protection Included.",
    cta: "Learn More",
    href: "/trust",
    theme: "blue",
  },
  {
    id: "fast-delivery",
    title: "Fast Delivery Across Europe",
    cta: "Explore",
    href: "/categories",
    theme: "emerald",
  },
];

const SLIDE_COUNT = HERO_SLIDES.length;

function HeroSlidePanel({
  slide,
  isActive,
  shouldLoadVisual,
}: {
  slide: HeroSlide;
  isActive: boolean;
  shouldLoadVisual: boolean;
}) {
  const tabIndex = isActive ? undefined : -1;

  return (
    <div className="import-rx-hero-banner__slide" data-slide-theme={slide.theme}>
      <div className="import-rx-hero-banner__copy">
        <h2 id={slide.headingId} className="import-rx-hero-banner__title">
          {slide.title}
        </h2>
        {slide.subtitle ? (
          <p className="import-rx-hero-banner__subtitle">{slide.subtitle}</p>
        ) : null}
        <div className="import-rx-hero-banner__actions">
          <Link
            href={slide.href}
            tabIndex={tabIndex}
            className={cn(
              "import-rx-hero-banner__cta import-rx-hero-banner__cta--primary import-rx-hero-banner__cta--inline",
              focusRing,
            )}
          >
            {slide.cta}
          </Link>
        </div>
      </div>
      {shouldLoadVisual ? <HeroSlideVisual slideId={slide.id} /> : null}
    </div>
  );
}

export const StoreMigrationHeroBanner = memo(function StoreMigrationHeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  useVisibilityPolling(
    () => {
      if (isDragging.current) return;
      setActiveIndex((current) => (current + 1) % SLIDE_COUNT);
    },
    AUTO_ADVANCE_MS,
    { immediate: false },
  );

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  }

  function handleTouchEnd(event: TouchEvent) {
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) < DRAG_THRESHOLD) return;
    goTo(activeIndex + (delta < 0 ? 1 : -1));
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    isDragging.current = true;
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent) {
    if (event.pointerType === "touch" || !isDragging.current) return;
    const delta = event.clientX - dragStartX.current;
    isDragging.current = false;
    if (Math.abs(delta) < DRAG_THRESHOLD) return;
    goTo(activeIndex + (delta < 0 ? 1 : -1));
  }

  function handlePointerCancel() {
    isDragging.current = false;
  }

  function shouldLoadVisual(index: number) {
    const distance = Math.min(
      Math.abs(index - activeIndex),
      Math.abs(index - activeIndex + SLIDE_COUNT),
      Math.abs(index - activeIndex - SLIDE_COUNT),
    );
    return distance <= 1;
  }

  return (
    <section
      aria-label="ROVEXO hero carousel"
      aria-roledescription="carousel"
      className="rx-hero-section px-ds-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="import-rx-hero-banner import-rx-hero-banner--v1"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="import-rx-hero-banner__particles" aria-hidden>
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="import-rx-hero-banner__particle" style={{ "--i": index } as CSSProperties} />
          ))}
        </div>

        <div className="import-rx-hero-banner__viewport">
          <div className="import-rx-hero-banner__track" aria-live="polite">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "import-rx-hero-banner__panel",
                  activeIndex === index && "import-rx-hero-banner__panel--active",
                  index < activeIndex && "import-rx-hero-banner__panel--before",
                  index > activeIndex && "import-rx-hero-banner__panel--after",
                )}
                aria-hidden={activeIndex !== index}
                data-slide-theme={slide.theme}
              >
                <HeroSlidePanel
                  slide={slide}
                  isActive={activeIndex === index}
                  shouldLoadVisual={shouldLoadVisual(index)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="import-rx-hero-banner__dots" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Slide ${index + 1}: ${slide.title}`}
              onClick={() => goTo(index)}
              className={cn(
                "import-rx-hero-banner__dot",
                index === activeIndex && "import-rx-hero-banner__dot--active",
                focusRing,
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
