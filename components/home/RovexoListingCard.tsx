"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import { productToHref } from "@/components/home/constants";
import styles from "@/components/home/RovexoListingCard.module.css";

export type ListingCardVariant = "default" | "featured" | "new" | "boosted";

type ListingCardProps = {
  product: Product;
  variant?: ListingCardVariant;
  className?: string;
  layout?: "rail" | "grid";
};

function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "New";
}

function formatViews(views?: number): string {
  const value = views ?? 0;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function isPremiumListing(product: Product): boolean {
  return product.sellerTier === "premium" || product.listingType === "premium";
}

function getPrimaryBadge(product: Product): string | null {
  if (product.isFeatured) return "Featured";
  if (product.isBumped) return "Boost";
  if (isPremiumListing(product)) return "Premium";
  return null;
}

export const RovexoListingCard = memo(function RovexoListingCard({
  product,
  className,
  layout = "rail",
}: ListingCardProps) {
  const router = useRouter();
  const href = productToHref(product);
  const { isSaved, toggle, isPending } = useProductWatchlist(product.slug);
  const badge = useMemo(() => getPrimaryBadge(product), [product]);

  return (
    <article className={cn(styles.card, layout === "grid" && styles.gridCard, className)}>
      <Link href={href} className={styles.link}>
        <div className={styles.media}>
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            loading="lazy"
            className={styles.image}
            sizes={layout === "grid" ? "176px" : "176px"}
          />

          {badge ? <span className={styles.badge}>{badge}</span> : null}

          <button
            type="button"
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void toggle();
            }}
            className={cn(styles.wishlist, isSaved && styles.wishlistSaved)}
          >
            <RovexoIcon icon={RovexoIcons.actions.wishlist} size={20} className={styles.wishlistIcon} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.title}>{product.title}</p>
          <p className={styles.price}>£{product.price.toLocaleString()}</p>
          <div className={styles.metaRow}>
            <span
              className={styles.rating}
              aria-label={`Rating ${formatRating(product.rating)} out of 5`}
            >
              <RovexoIcon icon={RovexoIcons.actions.star} size={16} className={cn(styles.metaIcon, styles.metaIconFilled)} />
              {formatRating(product.rating)}
            </span>
            <span className={styles.views} aria-label={`${formatViews(product.views)} views`}>
              <RovexoIcon icon={RovexoIcons.actions.eye} size={16} className={styles.metaIcon} />
              {formatViews(product.views)}
            </span>
          </div>
        </div>
      </Link>

      <button type="button" className={styles.srOnly} onClick={() => router.push(href)}>
        View {product.title}
      </button>
    </article>
  );
});
