"use client";

import Link from "next/link";
import { memo, useCallback, useRef, useState, type TouchEvent } from "react";
import {
  LEGACY_MIGRATION_CENTER_PATH,
  SELL_WIZARD_PATH,
} from "@/lib/seller/migration/config";
import { MIGRATION_PLATFORMS } from "@/lib/seller/migration/constants";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import "@/styles/import-hero-banner.css";

const AUTO_ADVANCE_MS = 5000;

const PLATFORM_PREVIEW = MIGRATION_PLATFORMS.slice(0, 7)
  .map((platform) => platform.name)
  .join(" · ");

type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  cta?: string;
};

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "sell-faster",
    title: "Sell Faster",
    subtitle: "List in minutes and reach buyers across the UK.",
    href: "/sell/new",
    cta: "Start Selling",
  },
  {
    id: "buyer-protection",
    title: "Buyer Protection",
    subtitle: "Shop with verified sellers and secure checkout.",
    href: "/trust",
    cta: "Learn More",
  },
  {
    id: "zero-fees",
    title: "Zero Listing Fees",
    subtitle: "Publish listings without upfront listing charges.",
    href: "/sell",
    cta: "List Now",
  },
  {
    id: "premium-marketplace",
    title: "Premium Marketplace",
    subtitle: "Discover curated listings with a premium experience.",
    href: "/categories",
    cta: "Browse",
  },
];

const SLIDE_COUNT = 1 + PROMO_SLIDES.length;

function MigrationSlide({ isActive }: { isActive: boolean }) {
  const tabIndex = isActive ? undefined : -1;

  return (
    <div className="import-hero-banner-2026__slide import-hero-banner-2026__slide--migration">
      <p className="import-hero-banner-2026__eyebrow">🚀 Stop Recreating Listings</p>
      <h2 id="store-migration-banner-heading" className="import-hero-banner-2026__title">
        Move Your Entire Store to ROVEXO
      </h2>
      <p className="import-hero-banner-2026__subtitle">
        Import everything. Publish everything. Start selling today.
      </p>
      <p className="import-hero-banner-2026__platforms">{PLATFORM_PREVIEW} and many more…</p>
      <div className="import-hero-banner-2026__actions">
        <Link
          href={SELL_WIZARD_PATH}
          tabIndex={tabIndex}
          className={cn("import-hero-banner-2026__cta import-hero-banner-2026__cta--primary", focusRing)}
        >
          Bring Your Item
        </Link>
        <Link
          href={LEGACY_MIGRATION_CENTER_PATH}
          tabIndex={tabIndex}
          className={cn("import-hero-banner-2026__cta import-hero-banner-2026__cta--secondary", focusRing)}
        >
          Import Your Item
        </Link>
      </div>
    </div>
  );
}

function PromoSlidePanel({ slide, isActive }: { slide: PromoSlide; isActive: boolean }) {
  return (
    <Link
      href={slide.href}
      tabIndex={isActive ? undefined : -1}
      className={cn("import-hero-banner-2026__slide import-hero-banner-2026__slide--promo", focusRing)}
    >
      <p className="import-hero-banner-2026__eyebrow">ROVEXO</p>
      <h2 className="import-hero-banner-2026__title">{slide.title}</h2>
      <p className="import-hero-banner-2026__subtitle">{slide.subtitle}</p>
      {slide.cta ? (
        <span className="import-hero-banner-2026__cta import-hero-banner-2026__cta--primary import-hero-banner-2026__cta--inline">
          {slide.cta}
        </span>
      ) : null}
    </Link>
  );
}

export const StoreMigrationHeroBanner = memo(function StoreMigrationHeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  useVisibilityPolling(
    () => {
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
    if (Math.abs(delta) < 48) return;
    goTo(activeIndex + (delta < 0 ? 1 : -1));
  }

  return (
    <section
      aria-label="ROVEXO hero carousel"
      aria-roledescription="carousel"
      className="px-ds-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="import-hero-banner-2026">
        <div className="import-hero-banner-2026__viewport">
          <div className="import-hero-banner-2026__track" aria-live="polite">
            <div
              className={cn(
                "import-hero-banner-2026__panel",
                activeIndex === 0 && "import-hero-banner-2026__panel--active",
              )}
              aria-hidden={activeIndex !== 0}
            >
              <MigrationSlide isActive={activeIndex === 0} />
            </div>
            {PROMO_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "import-hero-banner-2026__panel",
                  activeIndex === index + 1 && "import-hero-banner-2026__panel--active",
                )}
                aria-hidden={activeIndex !== index + 1}
              >
                <PromoSlidePanel slide={slide} isActive={activeIndex === index + 1} />
              </div>
            ))}
          </div>
        </div>

        <div className="import-hero-banner-2026__dots" role="tablist" aria-label="Hero slides">
          {Array.from({ length: SLIDE_COUNT }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Slide ${index + 1}`}
              onClick={() => goTo(index)}
              className={cn(
                "import-hero-banner-2026__dot",
                index === activeIndex && "import-hero-banner-2026__dot--active",
                focusRing,
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
