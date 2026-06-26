"use client";

import Link from "next/link";
import { memo, type ReactNode } from "react";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { ProductCarouselSkeleton } from "@/components/home/ProductCarouselSkeleton";
import { ProductSectionEmpty } from "@/components/home/ProductSectionStates";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type ProductCarouselSectionProps = {
  id: string;
  title: string;
  products: Product[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: boolean;
  hideWhenEmpty?: boolean;
  showBidButton?: boolean;
  viewAllHref?: string;
  footer?: ReactNode;
  className?: string;
};

export const ProductCarouselSection = memo(function ProductCarouselSection({
  id,
  title,
  products,
  loading = false,
  loadingMore = false,
  error = false,
  hideWhenEmpty = true,
  viewAllHref,
  footer,
  className,
}: ProductCarouselSectionProps) {
  if (hideWhenEmpty && !loading && !error && products.length === 0) {
    return null;
  }

  const showViewAll = Boolean(viewAllHref && products.length > 0 && !loading && !error);

  return (
    <section aria-labelledby={id} className={cn("home-section-2026 px-ds-4", className)}>
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <h2 id={id} className="home-section-2026__title text-text-primary">
          {title}
        </h2>
        {showViewAll ? (
          <Link
            href={viewAllHref!}
            className={cn("text-sm font-semibold text-primary hover:opacity-80", focusRing)}
          >
            View all
          </Link>
        ) : null}
      </div>

      <div
        data-carousel-version="2026"
        className={cn(
          "marketplace-listing-carousel -mx-ds-4 px-ds-4 pb-ds-1",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="group"
        aria-roledescription={!error && products.length > 0 ? "carousel" : undefined}
        aria-label={!error && products.length > 0 ? title : undefined}
        aria-busy={loading || loadingMore}
        aria-live={error ? "polite" : undefined}
      >
        {loading ? (
          <ProductCarouselSkeleton count={4} />
        ) : error ? (
          <div className="min-w-full snap-start rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
            Unable to load {title.replace(/^[^\s]+\s/, "").toLowerCase()}.
          </div>
        ) : products.length === 0 ? (
          <div className="min-w-full snap-start">
            <ProductSectionEmpty title={title} />
          </div>
        ) : (
          products.map((product) => (
            <HomeProductCard
              key={product.id}
              {...productToCardProps(product, "homepage")}
            />
          ))
        )}
        {loadingMore ? <ProductCarouselSkeleton count={2} /> : null}
      </div>

      {footer}
    </section>
  );
});
