"use client";

import Link from "next/link";
import { memo, useMemo, type ReactNode } from "react";
import { PremiumListingCard } from "@/components/home/PremiumProductCard";
import {
  HOME_LAUNCH_SECTION_CARD_LIMIT,
  HOME_LAUNCH_VIEW_ALL_LABEL,
} from "@/components/home/home-launch-config";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeProductSectionProps = {
  id: string;
  title: string;
  products: Product[];
  error?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
  hideWhenEmpty?: boolean;
  className?: string;
  footer?: ReactNode;
};

export const HomeProductSection = memo(function HomeProductSection({
  id,
  title,
  products,
  error = false,
  viewAllHref,
  viewAllLabel = HOME_LAUNCH_VIEW_ALL_LABEL,
  hideWhenEmpty = true,
  className,
  footer,
}: HomeProductSectionProps) {
  const visibleProducts = useMemo(
    () => products.slice(0, HOME_LAUNCH_SECTION_CARD_LIMIT),
    [products],
  );

  if (hideWhenEmpty && (error || visibleProducts.length === 0)) {
    return null;
  }

  const showViewAll = Boolean(viewAllHref && visibleProducts.length > 0);

  return (
    <section aria-labelledby={id} className={cn("rx-section px-ds-4", className)}>
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <h2 id={id} className="rx-section__title text-text-primary">
          {title}
        </h2>
        {showViewAll ? (
          <Link
            href={viewAllHref!}
            className={cn("shrink-0 text-sm font-semibold text-primary hover:opacity-80", focusRing)}
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      <div
        className="rx-home-launch-scroll -mx-ds-4 px-ds-4 pb-ds-1"
        role="group"
        aria-roledescription="carousel"
        aria-label={title}
      >
        {visibleProducts.map((product) => (
          <PremiumListingCard
            key={product.id}
            {...productToCardProps(product, "homepage")}
          />
        ))}
      </div>

      {footer}
    </section>
  );
});
