"use client";

import Link from "next/link";
import { memo, type ReactNode } from "react";
import { PremiumProductCard } from "@/components/home/PremiumProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { ProductCarouselSkeleton } from "@/components/home/ProductCarouselSkeleton";
import { ProductGridSkeleton } from "@/components/home/ProductGridSkeleton";
import { ProductSectionEmpty } from "@/components/home/ProductSectionStates";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeProductSectionLayout = "featured-grid" | "scroll-grid";

type HomeProductSectionProps = {
  id: string;
  title: string;
  products: Product[];
  loading?: boolean;
  error?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
  layout?: HomeProductSectionLayout;
  skeletonCount?: number;
  hideWhenEmpty?: boolean;
  className?: string;
  footer?: ReactNode;
};

export const HomeProductSection = memo(function HomeProductSection({
  id,
  title,
  products,
  loading = false,
  error = false,
  viewAllHref,
  viewAllLabel = "View all →",
  layout = "scroll-grid",
  skeletonCount = 4,
  hideWhenEmpty = false,
  className,
  footer,
}: HomeProductSectionProps) {
  if (hideWhenEmpty && !loading && !error && products.length === 0) {
    return null;
  }

  const showViewAll = Boolean(viewAllHref && products.length > 0 && !loading && !error);
  const gridClassName =
    layout === "featured-grid"
      ? "rx-home-featured-grid"
      : "rx-home-premium-scroll rx-home-premium-scroll--desktop-grid";

  return (
    <section aria-labelledby={id} className={cn("rx-section px-ds-4", className)}>
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <h2 id={id} className="rx-section__title text-text-primary">
          {title}
        </h2>
        {showViewAll ? (
          <Link
            href={viewAllHref!}
            className={cn("text-sm font-semibold text-primary hover:opacity-80", focusRing)}
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className={cn(gridClassName, layout === "featured-grid" && "rx-home-featured-grid--loading")}>
          {layout === "featured-grid" ? (
            <ProductGridSkeleton count={skeletonCount} />
          ) : (
            <ProductCarouselSkeleton count={skeletonCount} />
          )}
        </div>
      ) : error ? (
        <div className="rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
          Unable to load {title.toLowerCase()}.
        </div>
      ) : products.length === 0 ? (
        <div className={cn(gridClassName, "rx-home-featured-grid--empty")}>
          <ProductSectionEmpty title={title} />
        </div>
      ) : (
        <div
          className={cn(gridClassName, "-mx-ds-4 px-ds-4 pb-ds-1")}
          role="group"
          aria-roledescription={layout === "scroll-grid" ? "carousel" : undefined}
          aria-label={title}
        >
          {products.map((product) => (
            <PremiumProductCard
              key={product.id}
              {...productToCardProps(product, "homepage")}
            />
          ))}
        </div>
      )}

      {footer}
    </section>
  );
});
