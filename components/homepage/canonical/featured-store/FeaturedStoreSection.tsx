"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { FeaturedStoreHeader } from "@/components/homepage/canonical/featured-store/FeaturedStoreHeader";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { StoreProfileCard } from "@/components/homepage/canonical/featured-store/StoreProfileCard";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

export type FeaturedStoreSectionProps = {
  sections: ShowcaseSellerSection[];
};

export const FeaturedStoreSection = memo(function FeaturedStoreSection({
  sections,
}: FeaturedStoreSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const profileRailRef = useRef<HTMLDivElement | null>(null);

  const stores = useMemo(() => sections.filter((section) => section.listings.length > 0), [sections]);
  const activeStore = stores[activeIndex] ?? stores[0] ?? null;

  const listings = useMemo(() => (activeStore ? activeStore.listings : []), [activeStore]);

  const selectStore = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (stores.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % stores.length);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [stores.length]);

  useEffect(() => {
    const rail = profileRailRef.current;
    if (!rail) return;
    const card = rail.children[activeIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  if (stores.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Featured stores"
      className={css.block}
      data-hp-featured-store
      data-hp-featured-store-version="v1.0-canonical"
    >
      <div ref={profileRailRef} className={css.profileRail} role="list">
        {stores.map((section, index) => (
          <div key={section.sellerId} role="listitem" className={css.profileRailItem}>
            <button
              type="button"
              className={css.profileRailButton}
              aria-pressed={index === activeIndex}
              aria-label={`Show ${section.sellerName} store`}
              onClick={() => selectStore(index)}
            >
              <StoreProfileCard
                section={section}
                active={index === activeIndex}
                priority={index === 0}
              />
            </button>
          </div>
        ))}
      </div>

      {stores.length > 1 ? (
        <div className={css.profileDots} aria-hidden>
          {stores.map((section, index) => (
            <span
              key={section.sellerId}
              className={css.profileDot}
              data-active={index === activeIndex ? "true" : "false"}
            />
          ))}
        </div>
      ) : null}

      {activeStore ? (
        <>
          <FeaturedStoreHeader section={activeStore} />
          <div className={css.carousel} role="list">
            {listings.map((product, index) => (
              <div key={product.id} role="listitem" className={css.carouselItem}>
                <ListingCard
                  product={product}
                  variant="grid"
                  priority={index < 2}
                  {...HP_CANONICAL_LISTING_PROPS}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
});
