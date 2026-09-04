"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { memo, useCallback, type SyntheticEvent } from "react";
import { useCardImageSrc } from "@/lib/media/use-card-image-src";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import {
  formatListingPrice,
  formatListingPriceIncl,
  humanizeListingCondition,
  resolveListingShippingForIncl,
} from "@/lib/listing-card/format";
import { getActiveMarket } from "@/lib/seo/markets";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { Product } from "@/lib/products/types";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import css from "@/components/home/stores/StoreCard.module.css";

export type StoreCardProps = {
  product: Product;
  priority?: boolean;
};

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <PlatformEmoji emoji={filled ? PLATFORM_EMOJI.heart : PLATFORM_EMOJI.heartEmpty} size={18} />
  );
}

export const StoreCard = memo(function StoreCard({ product, priority = false }: StoreCardProps) {
  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;
  const shippingForIncl = resolveListingShippingForIncl({
    freeDelivery: product.freeDelivery,
    shippingPrice: product.shippingPrice,
  });
  const condition = humanizeListingCondition(product.condition);
  const href = `/listing/${product.slug}`;

  const { isSaved, toggle } = useProductWatchlist(product.slug);
  const pinned = isSaved;
  const { src: cardImageSrc, onError: onCardImageError, unoptimized: cardImageUnoptimized } =
    useCardImageSrc(product.imageUrl, product.imageFullUrl);

  const pin = useCallback(
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
    <article className={css.card} data-store-card>
      <Link href={href} className={css.link} aria-label={product.title}>
        <div className={css.media}>
          <SafeImage
            src={cardImageSrc}
            alt={product.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="112px"
            unoptimized={cardImageUnoptimized}
            onError={onCardImageError}
          />
          <button
            type="button"
            className={css.pin}
            data-active={pinned ? "true" : "false"}
            aria-label={pinned ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={pinned}
            onClick={pin}
          >
            <IconHeart filled={pinned} />
          </button>
        </div>
        <p className={css.title}>{product.title}</p>
        {condition ? <p className={css.condition}>{condition}</p> : null}
        <p className={css.price}>{formatListingPrice(amount)}</p>
        <p className={css.total}>{formatListingPriceIncl(amount, shippingForIncl)}</p>
      </Link>
    </article>
  );
});
