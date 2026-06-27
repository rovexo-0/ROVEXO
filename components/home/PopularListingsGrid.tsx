"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { ProductGridSkeleton } from "@/components/home/ProductGridSkeleton";
import { ProductSectionEmpty } from "@/components/home/ProductSectionStates";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { cn } from "@/lib/cn";

type PopularListingsGridProps = {
  id: string;
  title: string;
  products: Product[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: boolean;
  footer?: ReactNode;
  className?: string;
};

export const PopularListingsGrid = memo(function PopularListingsGrid({
  id,
  title,
  products,
  loading = false,
  loadingMore = false,
  error = false,
  footer,
  className,
}: PopularListingsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    const images = node.querySelectorAll("img[loading='lazy']");
    images.forEach((image) => {
      if (image instanceof HTMLImageElement && !image.complete) {
        image.style.opacity = "0";
        image.addEventListener(
          "load",
          () => {
            image.style.transition = "opacity 240ms ease";
            image.style.opacity = "1";
          },
          { once: true },
        );
      }
    });
  }, [products]);

  return (
    <section aria-labelledby={id} className={cn("px-ds-4", className)}>
      <h2 id={id} className="rx-section__title mb-ds-2 text-text-primary">
        {title}
      </h2>

      <div
        ref={gridRef}
        className="rx-listing-grid"
        role="group"
        aria-roledescription={!error && products.length > 0 ? "carousel" : undefined}
        aria-label={!error && products.length > 0 ? title : undefined}
        aria-busy={loading || loadingMore}
        aria-live={error ? "polite" : undefined}
      >
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <div className="w-full [grid-column:1/-1] rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
            Unable to load popular listings.
          </div>
        ) : products.length === 0 ? (
          <div className="[grid-column:1/-1]">
            <ProductSectionEmpty title="Popular listings" />
          </div>
        ) : (
          products.map((product) => (
            <HomeProductCard key={product.id} {...productToCardProps(product, "homepage")} />
          ))
        )}
        {loadingMore ? <ProductGridSkeleton count={2} /> : null}
      </div>

      {footer}
    </section>
  );
});
