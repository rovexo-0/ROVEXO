"use client";

import { memo, useMemo } from "react";
import { StoresHeader, MAX_STORE_PRODUCTS } from "@/components/home/stores/StoresHeader";
import { StoreCard } from "@/components/home/stores/StoreCard";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import css from "@/components/home/stores/StoresSection.module.css";

export type StoresSectionProps = {
  section: ShowcaseSellerSection | null;
};

export const StoresSection = memo(function StoresSection({ section }: StoresSectionProps) {
  const listings = useMemo(
    () => (section ? section.listings.slice(0, MAX_STORE_PRODUCTS) : []),
    [section],
  );

  if (!section || listings.length === 0) return null;

  return (
    <section
      aria-label={`${section.sellerName} store`}
      className={css.section}
      data-home-stores
      data-stores-version="2.0"
    >
      <StoresHeader section={section} />
      <div className={css.rail} role="list">
        {listings.map((product, index) => (
          <div key={product.id} role="listitem" className={css.slide}>
            <StoreCard product={product} priority={index === 0} />
          </div>
        ))}
      </div>
    </section>
  );
});
