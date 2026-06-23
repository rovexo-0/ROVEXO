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
      <h2 id={id} className="mb-ds-3 text-lg font-semibold tracking-tight text-text-primary">
        {title}
      </h2>

      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-ds-3 md:grid-cols-3 lg:grid-cols-4"
        role={error ? "group" : "list"}
        aria-busy={loading || loadingMore}
        aria-live={error ? "polite" : undefined}
      >
        {loading ? (
          <div className="col-span-2 grid grid-cols-2 gap-ds-3 md:col-span-3 md:grid-cols-3 lg:col-span-4 lg:grid-cols-4">
            <ProductGridSkeleton count={4} />
          </div>
        ) : error ? (
          <div className="col-span-2 rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary md:col-span-3 lg:col-span-4">
            Unable to load popular listings.
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-2 md:col-span-3 lg:col-span-4">
            <ProductSectionEmpty title="Popular listings" />
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} role="listitem">
              <HomeProductCard {...productToCardProps(product, "homepage")} layout="grid" />
            </div>
          ))
        )}
        {loadingMore ? (
          <div className="col-span-2 grid grid-cols-2 gap-ds-3">
            <ProductGridSkeleton count={2} />
          </div>
        ) : null}
      </div>

      {footer}
    </section>
  );
});
