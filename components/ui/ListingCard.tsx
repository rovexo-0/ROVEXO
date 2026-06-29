"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { cn } from "@/lib/cn";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackSaveListing } from "@/lib/analytics/marketplace-events";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { getActiveMarket } from "@/lib/seo/markets";
import { formatPublishedTime } from "@/lib/home/format-published-time";
import { focusRing, transitionNormal, transitionSpring } from "@/components/ui/tokens";

export type ListingCardProps = {
  title: string;
  href: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  originalPrice?: number | null;
  condition?: string;
  publishedAt?: string | null;
  premiumMeta?: boolean;
  views?: number;
  productId?: string;
  slug?: string;
  productSlug?: string;
  promotionSurface?: "homepage" | "search" | "category" | "listing" | "seller";
  isFeatured?: boolean;
  isBumped?: boolean;
  isNew?: boolean;
  location?: string;
  rating?: number;
  reviewCount?: number;
  listingType?: string;
  sellerVerified?: boolean;
  auctionEndsAt?: string | null;
  auctionCurrentBid?: number | null;
  isFavorite?: boolean;
  onFavorite?: () => void;
  /** Use persisted home watchlist when slug is available. */
  useHomeWatchlist?: boolean;
  showShare?: boolean;
  imageFit?: "cover" | "contain";
  imageSizes?: string;
  imageQuality?: number;
  className?: string;
};

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <Fluency3DIcon
      icon={filled ? "feature-heart-filled" : "feature-heart"}
      size={20}
      className={className}
    />
  );
}

function ShareIcon({ className }: { className?: string }) {
  return <Fluency3DIcon icon="feature-share" size={20} className={className} />;
}

function formatCountdown(endsAt: string | null | undefined): string | null {
  if (!endsAt) return null;
  const remaining = new Date(endsAt).getTime() - Date.now();
  if (remaining <= 0) return "Ended";
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)}d left`;
  return `${hours}h ${minutes}m`;
}

export function ListingCard({
  title,
  href,
  imageUrl,
  imageAlt,
  price,
  originalPrice,
  condition,
  publishedAt,
  premiumMeta = false,
  views,
  productId,
  slug,
  productSlug,
  promotionSurface = "search",
  isFeatured = false,
  isBumped = false,
  isNew = false,
  location,
  rating,
  reviewCount,
  listingType,
  sellerVerified = false,
  auctionEndsAt,
  auctionCurrentBid,
  isFavorite: isFavoriteProp,
  onFavorite,
  useHomeWatchlist = false,
  showShare = true,
  imageFit = "cover",
  imageSizes = "182px",
  imageQuality,
  className,
}: ListingCardProps) {
  const router = useRouter();
  const resolvedSlug = slug ?? productSlug ?? href.replace(/^\/listing\//, "").split("?")[0] ?? "";
  const watchlistSlug = productSlug ?? resolvedSlug;
  const { isSaved, toggle: toggleWatchlist } = useProductWatchlist(useHomeWatchlist ? watchlistSlug : "");
  const [isFavoriteInternal, setIsFavoriteInternal] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isFavorite = useHomeWatchlist ? isSaved : (isFavoriteProp ?? isFavoriteInternal);
  const isAuction = listingType === "auction";
  const countdown = formatCountdown(auctionEndsAt);
  const displayPrice = isAuction && auctionCurrentBid != null ? auctionCurrentBid : price;
  const showRating = rating != null && rating > 0;
  const showViews = views != null;
  const showStats = !premiumMeta && (showRating || showViews || (isAuction && countdown));
  const publishedLabel = formatPublishedTime(publishedAt);
  const showPremiumMeta = premiumMeta && (condition || location || publishedLabel);

  useEffect(() => {
    if (!productId || (!isFeatured && !isBumped)) return;
    trackPromotionEvent(productId, "impression", promotionSurface);
  }, [isBumped, isFeatured, productId, promotionSurface]);

  const openProduct = useCallback(() => {
    if (productId && (isFeatured || isBumped)) {
      trackPromotionEvent(productId, "click", promotionSurface);
    }
    router.push(href);
  }, [href, isBumped, isFeatured, productId, promotionSurface, router]);

  const toggleFavorite = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const willSave = !isFavorite;

      if (useHomeWatchlist) {
        void toggleWatchlist();
        if (willSave && productId) {
          const { currency } = getActiveMarket();
          trackGaEvent("add_to_favorites", {
            item_id: productId,
            item_name: title,
            currency,
          });
        }
      } else if (onFavorite) {
        onFavorite();
        if (willSave && productId) {
          const { currency } = getActiveMarket();
          trackSaveListing({ itemId: productId, itemName: title, currency });
        }
      } else {
        setIsFavoriteInternal(willSave);
        if (willSave && productId) {
          const { currency } = getActiveMarket();
          trackSaveListing({ itemId: productId, itemName: title, currency });
        }
      }

      setHeartAnimating(true);
      window.setTimeout(() => setHeartAnimating(false), 180);
    },
    [isFavorite, onFavorite, productId, title, toggleWatchlist, useHomeWatchlist],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProduct();
      }
    },
    [openProduct],
  );

  return (
    <div
      data-listing-card-version="rovexo-v1"
      tabIndex={0}
      aria-label={title}
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "rx-listing-card rx-listing-card group cursor-pointer",
        transitionNormal,
        isFeatured && "ring-2 ring-warning/35",
        isBumped && !isFeatured && "ring-2 ring-success/30",
        focusRing,
        className,
      )}
    >
      <div className="rx-listing-card__media rx-listing-card__image">
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          loading="lazy"
          sizes={imageSizes}
          quality={imageQuality}
          className={cn(imageFit === "contain" ? "object-contain" : "object-cover", transitionNormal)}
        />

        <div className="rx-listing-card__badges absolute left-1.5 top-1.5 flex max-w-[calc(100%-2.75rem)] flex-wrap gap-0.5">
          {isFeatured ? (
            <Badge variant="warning" className="rx-listing-card__badge rx-listing-card__badge px-1 py-0.5 text-[9px] leading-none uppercase">
              Featured
            </Badge>
          ) : null}
          {isNew ? (
            <Badge variant="success" className="rx-listing-card__badge rx-listing-card__badge px-1 py-0.5 text-[9px] leading-none uppercase">
              NEW
            </Badge>
          ) : null}
          {isBumped && !isFeatured ? (
            <Badge variant="danger" className="rx-listing-card__badge rx-listing-card__badge px-1 py-0.5 text-[9px] leading-none uppercase">
              Hot
            </Badge>
          ) : null}
          {isAuction ? (
            <Badge variant="danger" className="rx-listing-card__badge rx-listing-card__badge px-1 py-0.5 text-[9px] leading-none uppercase">
              Auction
            </Badge>
          ) : null}
          {sellerVerified ? (
            <Badge
              variant="primary"
              className="rx-listing-card__badge rx-listing-card__badge--verified rx-listing-card__badge rx-listing-card__badge--verified px-1 py-0.5 text-[8px] leading-none uppercase"
            >
              Verified
            </Badge>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={isFavorite ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={isFavorite}
          onClick={toggleFavorite}
          className={cn(
            "rx-listing-card__action rx-listing-card__action--heart rx-listing-card__heart absolute flex items-center justify-center",
            focusRing,
            transitionSpring,
            isFavorite && "text-danger",
            heartAnimating && "is-animating",
          )}
        >
          <HeartIcon filled={isFavorite} className="h-4 w-4" />
        </button>

        {showShare && resolvedSlug ? (
          <button
            type="button"
            aria-label="Share listing"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setShareOpen(true);
            }}
            className={cn(
              "rx-listing-card__action rx-listing-card__action--share rx-listing-card__share absolute flex items-center justify-center",
              focusRing,
              transitionSpring,
            )}
          >
            <ShareIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="rx-listing-card__body rx-listing-card__body">
        <p className="rx-listing-card__title rx-listing-card__title">{title}</p>

        <Price
          amount={displayPrice}
          originalAmount={originalPrice}
          size="sm"
          className="rx-listing-card__price rx-listing-card__price gap-0.5"
        />

        {showPremiumMeta ? (
          <div className="rx-listing-card__meta">
            {condition ? <span className="rx-listing-card__meta-item">{condition}</span> : null}
            {location ? <span className="rx-listing-card__meta-item">{location}</span> : null}
            {publishedLabel ? (
              <span className="rx-listing-card__meta-item">{publishedLabel}</span>
            ) : null}
          </div>
        ) : null}

        {showStats ? (
          <div className="rx-listing-card__stats rx-listing-card__stats">
            {showRating ? (
              <span className="rx-listing-card__stat rx-listing-card__stat">
                <span aria-hidden>⭐</span>
                {rating!.toFixed(1)}
                {reviewCount != null && reviewCount > 0 ? ` (${reviewCount})` : ""}
              </span>
            ) : null}
            {showViews ? (
              <span className="rx-listing-card__stat rx-listing-card__stat">
                <span aria-hidden>👁</span>
                {views}
              </span>
            ) : null}
            {isAuction && countdown ? (
              <span className="rx-listing-card__stat rx-listing-card__stat--urgent rx-listing-card__stat rx-listing-card__stat--urgent">
                {countdown}
              </span>
            ) : null}
          </div>
        ) : null}

        {!premiumMeta && location ? (
          <p className="rx-listing-card__location rx-listing-card__location">
            <span aria-hidden>📍</span>
            {location}
          </p>
        ) : null}
      </div>

      {showShare && resolvedSlug ? (
        <ShareListingSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={title}
          slug={resolvedSlug}
          productId={productId}
          price={displayPrice}
        />
      ) : null}
    </div>
  );
}
