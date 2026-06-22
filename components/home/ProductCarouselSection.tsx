"use client";

import Link from "next/link";
import { memo, type ReactNode } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
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
  viewAllHref,
  footer,
  className,
}: ProductCarouselSectionProps) {
  const showViewAll = Boolean(viewAllHref && products.length > 0 && !loading && !error);

  return (
    <section aria-labelledby={id} className={cn("px-ds-4", className)}>
      <div className="mb-ds-3 flex items-end justify-between gap-ds-3">
        <h2 id={id} className="text-lg font-semibold text-text-primary">
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
        className={cn(
          "-mx-ds-4 flex gap-ds-3 overflow-x-auto px-ds-4 pb-ds-1",
          "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="list"
        aria-busy={loading || loadingMore}
      >
        {loading ? (
          <ProductCarouselSkeleton count={4} />
        ) : error ? (
          <div
            role="alert"
            className="min-w-full snap-start rounded-ds-xl border border-danger/30 bg-danger/5 px-ds-5 py-ds-6 text-center text-sm text-text-secondary"
          >
            Unable to load {title.replace(/^[^\s]+\s/, "").toLowerCase()}.
          </div>
        ) : products.length === 0 ? (
          <div className="min-w-full snap-start">
            <ProductSectionEmpty title={title.replace(/^[^\s]+\s/, "")} />
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              role="listitem"
              className="w-[10.5rem] shrink-0 snap-start sm:w-[12.5rem] md:w-[13.75rem]"
            >
              <ProductCard {...productToCardProps(product, "homepage")} />
            </div>
          ))
        )}
        {loadingMore ? <ProductCarouselSkeleton count={2} /> : null}
      </div>

      {footer}
    </section>
  );
});
