"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { memo, useCallback, type SyntheticEvent } from "react";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import { getActiveMarket } from "@/lib/seo/markets";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { Product } from "@/lib/products/types";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

export type FeaturedStoreProductCardProps = {
  product: Product;
  priority?: boolean;
};

function formatPrice(amount: number): string {
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPriceIncl(amount: number): string {
  const fee = calculatePlatformFee(amount);
  const total = Math.round((amount + fee) * 100) / 100;
  return `${formatPrice(total)} incl.`;
}

function humanizeCondition(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const text = raw.replace(/[_-]+/g, " ").trim();
  if (!text || text.toLowerCase() === "unknown") return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export const FeaturedStoreProductCard = memo(function FeaturedStoreProductCard({
  product,
  priority = false,
}: FeaturedStoreProductCardProps) {
  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;
  const condition = humanizeCondition(product.condition);
  const href = `/listing/${product.slug}`;
  const { isSaved, toggle } = useProductWatchlist(product.slug);
  const pinned = isSaved;

  const onSave = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const saving = !pinned;
      void toggle();
      if (saving) {
        const { currency } = getActiveMarket();
        trackGaEvent("add_to_favorites", {
          item_id: product.id,
          item_name: product.title,
          currency,
        });
      }
    },
    [pinned, product.id, product.title, toggle],
  );

  return (
    <article className={css.product} data-hp-store-product>
      <Link href={href} className={css.productLink} aria-label={product.title}>
        <div className={css.productVisual}>
          <SafeImage
            src={product.imageUrl}
            alt={product.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="112px"
          />
          <button
            type="button"
            className={css.productSave}
            data-active={pinned ? "true" : "false"}
            aria-label={pinned ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={pinned}
            onClick={onSave}
          >
            <SaveIcon filled={pinned} />
          </button>
        </div>
        <div className={css.productCopy}>
          <p className={css.productTitle}>{product.title}</p>
          {condition ? <p className={css.productCondition}>{condition}</p> : null}
          <p className={css.productPrice}>{formatPrice(amount)}</p>
          <p className={css.productTotal}>{formatPriceIncl(amount)}</p>
        </div>
      </Link>
    </article>
  );
});
