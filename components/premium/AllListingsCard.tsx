"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, Star } from "lucide-react";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import { productToHref } from "@/components/premium/constants";
import styles from "@/components/premium/AllListingsCard.module.css";

type AllListingsCardProps = {
  product: Product;
  className?: string;
};

function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "New";
}

function formatViews(views?: number): string {
  const value = views ?? 0;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export const AllListingsCard = memo(function AllListingsCard({
  product,
  className,
}: AllListingsCardProps) {
  const router = useRouter();
  const href = productToHref(product);
  const { isSaved, toggle, isPending } = useProductWatchlist(product.slug);

  return (
    <article className={cn(styles.card, className)}>
      <Link href={href} className={styles.link}>
        <div className={styles.media}>
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            loading="lazy"
            className={styles.image}
            sizes="(max-width: 390px) 50vw, 176px"
          />

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
            <Heart
              className={styles.wishlistIcon}
              strokeWidth={1.75}
              fill={isSaved ? "currentColor" : "none"}
              aria-hidden
            />
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
              <Star className={cn(styles.metaIcon, styles.metaIconFilled)} strokeWidth={2} aria-hidden />
              {formatRating(product.rating)}
            </span>
            <span className={styles.views} aria-label={`${formatViews(product.views)} views`}>
              <Eye className={styles.metaIcon} strokeWidth={2} aria-hidden />
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
