/**
 * ROVEXO Official Listing Card — platform SSOT.
 * Visual reference: official product card specification (image-first, premium).
 */

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { EyeLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { memo, useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SafeImage } from "@/components/ui/SafeImage";

/** Lazy: Homepage uses showShare=false — keep share sheet out of the critical card graph. */
const ShareListingSheet = dynamic(
  () =>
    import("@/components/share/ShareListingSheet").then((mod) => mod.ShareListingSheet),
  { ssr: false },
);
import { useCardImageSrc } from "@/lib/media/use-card-image-src";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackSaveListing } from "@/lib/analytics/marketplace-events";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import {
  formatCardRating,
  formatCardViews,
  formatProductViewsLabel,
  formatListingPrice,
  formatListingPriceIncl,
  humanizeListingCondition,
  resolveListingShippingForIncl,
} from "@/lib/listing-card/format";
import { resolveHomepagePromotionBadge } from "@/lib/homepage/feed-ranking";
import { resolvePublicProfileHref } from "@/lib/profile/public-profile-href";
import { getActiveMarket } from "@/lib/seo/markets";
import { useLiveProductViews } from "@/lib/views/use-live-product-views";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import {
  LISTING_CARD_VIEWPORT_PREFETCH_BUCKET,
  LISTING_CARD_VIEWPORT_PREFETCH_CAP,
  useViewportRoutePrefetch,
} from "@/lib/navigation/viewport-route-prefetch-v1";
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

/** Surfaces where capped viewport RSC prefetch is safe (P0 Mobile Instant Interaction). */
const LISTING_CARD_PREFETCH_SURFACES: ReadonlySet<ListingCardSurface> = new Set([
  "homepage",
  "store",
  "saved",
]);

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
  /**
   * When set with `priority`, the LCP image uses intrinsic width/height instead of
   * `fill` so Next/Image emits 1x/2x srcset (no w=3840 fallback). Delivery only —
   * card CSS still fills the locked figure. Omit for non-LCP cards.
   */
  priorityImageWidth?: number;
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
  showPlatformFee?: boolean;
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
    <span className={css.starIcon} aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
      {filled ? "❤️" : "🤍"}
    </span>
  );
}

function StoreSavedGlyph({ filled }: { filled: boolean }) {
  return (
    <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>
      {filled ? "❤️" : "♡"}
    </span>
  );
}

function IconStar() {
  return (
    <span className={css.starIcon} aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>
      ⭐
    </span>
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
  priorityImageWidth,
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
  showPlatformFee = false,
  showCondition = true,
  showStatusBadge = false,
  favoriteMode = "watchlist",
  isFavorite: isFavoriteProp,
  onFavorite,
}: ListingCardProps) {
  void variant;
  void showPlatformFee;

  const url = hrefOverride ?? `/listing/${product.slug}`;
  const prefetchEnabled = LISTING_CARD_PREFETCH_SURFACES.has(surface);
  const {
    ref: prefetchRef,
    onPointerDown: onPrefetchIntent,
    onTouchStart: onPrefetchTouch,
  } = useViewportRoutePrefetch(url, {
    enabled: prefetchEnabled,
    bucket: LISTING_CARD_VIEWPORT_PREFETCH_BUCKET,
    cap: LISTING_CARD_VIEWPORT_PREFETCH_CAP,
  });
  const amount =
    product.listingType === "auction" && product.auctionCurrentBid != null
      ? product.auctionCurrentBid
      : product.price;
  const shippingForIncl = resolveListingShippingForIncl({
    freeDelivery: product.freeDelivery,
    shippingPrice: product.shippingPrice,
  });
  const inclLabel = formatListingPriceIncl(amount, shippingForIncl);
  const condition = humanizeListingCondition(product.condition);
  const promoted = Boolean(product.isFeatured || product.isBumped) && UUID.test(product.id);

  const { isSaved, toggle: toggleSaved } = useProductWatchlist(
    favoriteMode === "watchlist" ? product.slug : "",
  );
  const pinned = favoriteMode === "watchlist" ? isSaved : Boolean(isFavoriteProp);
  const [likesSeed, setLikesSeed] = useState({ id: product.id, likes: product.likes ?? 0 });
  const [likesOffset, setLikesOffset] = useState(0);
  if (likesSeed.id !== product.id || likesSeed.likes !== (product.likes ?? 0)) {
    setLikesSeed({ id: product.id, likes: product.likes ?? 0 });
    setLikesOffset(0);
  }
  const [shareOpen, setShareOpen] = useState(false);
  const liveViews = useLiveProductViews(product.slug, product.views);
  const { src: cardImageSrc, onError: onCardImageError, unoptimized: cardImageUnoptimized } =
    useCardImageSrc(product.imageUrl, product.imageFullUrl);
  const router = useRouter();
  const sellerProfileHref = resolvePublicProfileHref(product.sellerUsername);

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

      if (surface === "store") {
        setLikesOffset((current) => current + (saving ? 1 : -1));
      }

      if (favoriteMode === "watchlist") {
        void toggleSaved().then((ok) => {
          if (ok === false && surface === "store") {
            setLikesOffset((current) => current + (saving ? -1 : 1));
          }
        });
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
    [favoriteMode, pinned, onFavorite, product.id, product.title, surface, toggleSaved],
  );

  const isHomepageCard = surface === "homepage";
  const isStoreCard = surface === "store";
  const showIncl = showBuyerProtection && !isStoreCard;
  const likesCount = Math.max(0, Math.floor(product.likes ?? 0) + likesOffset);
  const lcpIntrinsic =
    Boolean(priority) &&
    typeof priorityImageWidth === "number" &&
    Number.isFinite(priorityImageWidth) &&
    priorityImageWidth > 0;
  const lcpWidth =
    lcpIntrinsic && priorityImageWidth ? Math.round(priorityImageWidth) : undefined;
  const lcpHeight = lcpWidth ? Math.round((lcpWidth * 5) / 4) : undefined;
  const showFooter =
    isStoreCard
      ? showRating || showViews
      : !isHomepageCard && (showSeller || showRating || showViews);
  const ratingEnd = surface === "homepage" && showRating && !showSeller && !showViews;
  const soldBadge = Boolean(
    statusBadgeLabel && /^sold$/i.test(statusBadgeLabel.trim()),
  );
  const promotionBadge =
    showStatusBadge && surface === "homepage"
      ? statusBadgeLabel
        ? { label: statusBadgeLabel, tone: soldBadge ? ("sold" as const) : ("featured" as const) }
        : resolveHomepagePromotionBadge(product)
      : showStatusBadge && statusBadgeLabel
        ? { label: statusBadgeLabel, tone: soldBadge ? ("sold" as const) : ("featured" as const) }
        : null;

  return (
    <article
      className={cn(css.root, isHomepageCard && css.rootHomepage, className)}
      data-hp-listing-card="official"
      data-hp-listing-version={isHomepageCard ? "homepage-rev-2" : LISTING_CARD_UI_VERSION}
      data-hp-listing-status={LISTING_CARD_UI_STATUS}
      data-listing-card="rovexo"
      data-listing-surface={surface}
    >
      <Link
        ref={prefetchRef as (node: HTMLAnchorElement | null) => void}
        href={url}
        prefetch={false}
        onPointerDown={prefetchEnabled ? onPrefetchIntent : undefined}
        onTouchStart={prefetchEnabled ? onPrefetchTouch : undefined}
        className={cn(css.hitArea, isHomepageCard && css.hitAreaHomepage)}
        aria-label={product.title}
        onClick={go}
      >
        <figure className={cn(css.visual, isHomepageCard && css.visualHomepage)}>
          <SafeImage
            src={cardImageSrc}
            alt={product.title}
            fill={!lcpIntrinsic}
            width={lcpWidth}
            height={lcpHeight}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={lcpIntrinsic ? undefined : imageSizes ?? IMG_SIZES}
            unoptimized={cardImageUnoptimized}
            onError={onCardImageError}
          />
          {promotionBadge ? (
            <ListingPromotionBadge label={promotionBadge.label} tone={promotionBadge.tone} />
          ) : null}
        </figure>

        {isHomepageCard ? (
          <div className={css.bodyHomepage}>
            <h3 className={css.titleHomepage}>{product.title}</h3>
            {showCondition && condition ? (
              <p className={css.conditionHomepage}>{condition}</p>
            ) : null}
            <p className={css.priceHomepage}>{priceLabel ?? formatListingPrice(amount)}</p>
            {showIncl ? (
              <p className={css.inclTotalHomepage}>
                <span>{inclLabel}</span>
                <ShieldLineIcon className={css.inclShieldHomepage} aria-hidden />
              </p>
            ) : null}
            <div className={css.metaRowHomepage} data-product-card-stats="v1.0">
              {showRating ? (
                <span className={css.ratingHomepage} aria-label={`Rating ${formatCardRating(product)}`}>
                  <IconStar />
                  <span className={css.ratingValueHomepage}>{formatCardRating(product)}</span>
                </span>
              ) : (
                <span className={css.inclSpacerHomepage} aria-hidden />
              )}
              {showViews ? (
                <span
                  className={css.viewsHomepage}
                  aria-label={formatProductViewsLabel(liveViews)}
                  data-view-live={product.slug}
                >
                  <EyeLineIcon className={css.viewsIconHomepage} aria-hidden />
                  {formatCardViews(liveViews)}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
        <div className={css.body}>
          <h3 className={css.title}>{product.title}</h3>
          {showCondition && condition ? <p className={css.condition}>{condition}</p> : null}
          <p className={css.price}>{priceLabel ?? formatListingPrice(amount)}</p>
          {showIncl ? (
            <p className={css.protection}>
              <span>{inclLabel}</span>
              <ShieldLineIcon className={css.protectionIcon} aria-hidden />
            </p>
          ) : null}

          {showFooter ? (
            <>
              {isStoreCard ? null : <div className={css.divider} role="presentation" />}
              <div
                className={cn(css.footer, ratingEnd && css.footerRatingEnd)}
                data-product-card-stats={isStoreCard ? "v1.0" : undefined}
              >
                {!ratingEnd ? (
                  <div className={css.footerLeft}>
                    {showSeller ? (
                      sellerProfileHref ? (
                        <button
                          type="button"
                          className={css.sellerProfileLink}
                          aria-label={`View ${product.sellerName} profile`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            router.push(sellerProfileHref);
                          }}
                        >
                          <Avatar
                            src={product.sellerAvatar}
                            alt={product.sellerName}
                            name={product.sellerName}
                            size="sm"
                            className={css.sellerAvatar}
                          />
                        </button>
                      ) : (
                        <Avatar
                          src={product.sellerAvatar}
                          alt={product.sellerName}
                          name={product.sellerName}
                          size="sm"
                          className={css.sellerAvatar}
                        />
                      )
                    ) : null}
                    {showRating ? (
                      <span className={css.rating} aria-label={`Rating ${formatCardRating(product)}`}>
                        <IconStar />
                        <span className={css.ratingValue}>{formatCardRating(product)}</span>
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {ratingEnd ? (
                  <span className={css.rating} aria-label={`Rating ${formatCardRating(product)}`}>
                    <IconStar />
                    <span className={css.ratingValue}>{formatCardRating(product)}</span>
                  </span>
                ) : null}
                {showViews ? (
                  <span
                    className={css.views}
                    aria-label={formatProductViewsLabel(liveViews)}
                    data-view-live={product.slug}
                  >
                    {isStoreCard ? (
                      <span aria-hidden>👁</span>
                    ) : (
                      <EyeLineIcon className={css.viewsIcon} aria-hidden />
                    )}
                    {formatCardViews(liveViews)}
                  </span>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
        )}
      </Link>
      {showFavorite ? (
        <button
          type="button"
          className={cn(css.save, isStoreCard && css.saveStore)}
          data-active={pinned ? "true" : "false"}
          data-store-saved={isStoreCard ? "true" : undefined}
          aria-label={pinned ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={pinned}
          onClick={onSave}
        >
          {isStoreCard ? (
            <>
              <StoreSavedGlyph filled={pinned} />
              <span>{formatCardViews(likesCount)}</span>
            </>
          ) : (
            <IconHeart filled={pinned} />
          )}
        </button>
      ) : null}

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

export function ListingCardSkeletonGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} className={className} />
      ))}
    </>
  );
}
