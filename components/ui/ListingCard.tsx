/**
 * ROVEXO Official Listing Card — platform SSOT.
 * Visual reference: official product card specification (image-first, premium).
 */

"use client";

import Link from "next/link";
import { Eye, ShieldCheck } from "lucide-react";
import { memo, useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { Avatar } from "@/components/ui/Avatar";
import { SafeImage } from "@/components/ui/SafeImage";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackSaveListing } from "@/lib/analytics/marketplace-events";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import {
  formatCardRating,
  formatCardViews,
  formatListingPrice,
  formatListingPriceIncl,
  humanizeListingCondition,
} from "@/lib/listing-card/format";
import { resolveHomepagePromotionBadge } from "@/lib/homepage/feed-ranking";
import { getActiveMarket } from "@/lib/seo/markets";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import css from "@/components/ui/ListingCard.module.css";

export type ListingCardVariant = "grid" | "carousel";

export type ListingCardSurface =
  | "homepage"
  | "search"
  | "category"
  | "listing"
  | "seller"
  | "store"
  | "saved"
  | "similar"
  | "recently-viewed";

type PromotionSurface = "homepage" | "search" | "category" | "listing" | "seller";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMG_SIZES = "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px";

export const LISTING_CARD_UI_VERSION = "official-2.1" as const;
export const LISTING_CARD_UI_STATUS = "FROZEN" as const;

export { formatCardRating, formatCardViews } from "@/lib/listing-card/format";

export interface ListingCardProps {
  product: Product;
  variant?: ListingCardVariant;
  surface?: ListingCardSurface;
  trackImpressions?: boolean;
  priority?: boolean;
  imageSizes?: string;
  href?: string;
  priceLabel?: string;
  statusBadgeLabel?: string;
  subtitle?: string;
  className?: string;
  showFavorite?: boolean;
  showShare?: boolean;
  showSeller?: boolean;
  showRating?: boolean;
  showViews?: boolean;
  showBuyerProtection?: boolean;
  showCondition?: boolean;
  conditionPlacement?: "badge" | "meta" | "body";
  buyerProtectionPlacement?: "body" | "meta";
  showStatusBadge?: boolean;
  showPhotoCount?: boolean;
  showSubtitle?: boolean;
  favoriteMode?: "watchlist" | "controlled";
  isFavorite?: boolean;
  onFavorite?: () => void;
}

function promotionSurface(surface: ListingCardSurface): PromotionSurface {
  if (
    surface === "homepage" ||
    surface === "search" ||
    surface === "category" ||
    surface === "listing" ||
    surface === "seller"
  ) {
    return surface;
  }
  return "search";
}

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden className={css.starIcon}>
      <path
        fill="var(--ds-color-star)"
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

function ListingPromotionBadge({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  return (
    <span className={css.badge} data-tone={tone}>
      {label}
    </span>
  );
}

export const ListingCard = memo(function ListingCard({
  product,
  variant = "grid",
  surface = "search",
  trackImpressions = true,
  priority = false,
  imageSizes,
  className,
  href: hrefOverride,
  priceLabel,
  statusBadgeLabel,
  showFavorite = true,
  showShare = false,
  showSeller = true,
  showRating = true,
  showViews = true,
  showBuyerProtection = true,
  showCondition = true,
  showStatusBadge = false,
  favoriteMode = "watchlist",
  isFavorite: isFavoriteProp,
  onFavorite,
}: ListingCardProps) {
  void variant;

  const url = hrefOverride ?? `/listing/${product.slug}`;
  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;
  const condition = humanizeListingCondition(product.condition);
  const promoted = Boolean(product.isFeatured || product.isBumped) && UUID.test(product.id);

  const { isSaved, toggle: toggleSaved } = useProductWatchlist(
    favoriteMode === "watchlist" ? product.slug : "",
  );
  const pinned = favoriteMode === "watchlist" ? isSaved : Boolean(isFavoriteProp);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!promoted || !trackImpressions) return;
    trackPromotionEvent(product.id, "impression", promotionSurface(surface));
  }, [promoted, trackImpressions, product.id, surface]);

  const go = useCallback(() => {
    if (promoted) trackPromotionEvent(product.id, "click", promotionSurface(surface));
  }, [promoted, product.id, surface]);

  const onSave = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const saving = !pinned;

      if (favoriteMode === "watchlist") {
        void toggleSaved();
        if (saving) {
          const { currency } = getActiveMarket();
          trackGaEvent("add_to_favorites", { item_id: product.id, item_name: product.title, currency });
        }
      } else {
        onFavorite?.();
        if (saving) {
          const { currency } = getActiveMarket();
          trackSaveListing({ itemId: product.id, itemName: product.title, currency });
        }
      }
    },
    [favoriteMode, pinned, onFavorite, product.id, product.title, toggleSaved],
  );

  const showFooter = showSeller || showRating || showViews;
  const promotionBadge =
    showStatusBadge && surface === "homepage"
      ? statusBadgeLabel
        ? { label: statusBadgeLabel, tone: "featured" as const }
        : resolveHomepagePromotionBadge(product)
      : null;

  return (
    <article
      className={cn(css.root, className)}
      data-hp-listing-card="official"
      data-hp-listing-version={LISTING_CARD_UI_VERSION}
      data-hp-listing-status={LISTING_CARD_UI_STATUS}
      data-listing-card="rovexo"
    >
      <Link href={url} className={css.hitArea} aria-label={product.title} onClick={go}>
        <figure className={css.visual}>
          <SafeImage
            src={product.imageUrl}
            alt={product.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={imageSizes ?? IMG_SIZES}
          />
          {promotionBadge ? (
            <ListingPromotionBadge label={promotionBadge.label} tone={promotionBadge.tone} />
          ) : null}
          {showFavorite ? (
            <button
              type="button"
              className={css.save}
              data-active={pinned ? "true" : "false"}
              aria-label={pinned ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={pinned}
              onClick={onSave}
            >
              <IconHeart filled={pinned} />
            </button>
          ) : null}
        </figure>

        <div className={css.body}>
          <h3 className={css.title}>{product.title}</h3>
          {showCondition && condition ? <p className={css.condition}>{condition}</p> : null}
          <p className={css.price}>{priceLabel ?? formatListingPrice(amount)}</p>
          {showBuyerProtection ? (
            <p className={css.protection}>
              <span>{formatListingPriceIncl(amount)}</span>
              <ShieldCheck className={css.protectionIcon} strokeWidth={2.25} aria-hidden />
            </p>
          ) : null}

          {showFooter ? (
            <>
              <div className={css.divider} role="presentation" />
              <div className={css.footer}>
                <div className={css.footerLeft}>
                  {showSeller ? (
                    <Avatar
                      src={product.sellerAvatar}
                      alt={product.sellerName}
                      name={product.sellerName}
                      size="sm"
                      className={css.sellerAvatar}
                    />
                  ) : null}
                  {showRating ? (
                    <span className={css.rating} aria-label={`Rating ${formatCardRating(product)}`}>
                      <IconStar />
                      <span className={css.ratingValue}>{formatCardRating(product)}</span>
                    </span>
                  ) : null}
                </div>
                {showViews ? (
                  <span className={css.views} aria-label={`${formatCardViews(product.views)} views`}>
                    <Eye className={css.viewsIcon} strokeWidth={2} aria-hidden />
                    {formatCardViews(product.views)}
                  </span>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </Link>

      {showShare ? (
        <ShareListingSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={product.title}
          slug={product.slug}
          productId={product.id}
          price={amount}
        />
      ) : null}
    </article>
  );
});

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(css.root, css.skeleton, className)}
      aria-hidden
      data-listing-card-skeleton="rovexo"
    >
      <div className={css.skeletonMedia} />
      <div className={css.skeletonBody}>
        <div className={`${css.skeletonLine} ${css.skeletonLineTitle}`} />
        <div className={`${css.skeletonLine} ${css.skeletonLineCondition}`} />
        <div className={`${css.skeletonLine} ${css.skeletonLinePrice}`} />
        <div className={`${css.skeletonLine} ${css.skeletonLineProtection}`} />
        <div className={css.skeletonDivider} />
        <div className={`${css.skeletonLine} ${css.skeletonLineFooter}`} />
      </div>
    </article>
  );
}

export function ListingCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </>
  );
}
