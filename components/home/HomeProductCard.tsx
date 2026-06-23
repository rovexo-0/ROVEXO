"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { cn } from "@/lib/cn";
import { normalizeCondition } from "@/lib/products/utils";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { focusRing, transitionNormal, transitionSpring } from "@/components/ui/tokens";
import { calculateProtectedFee } from "@/lib/orders/pricing";

export type HomeProductCardProps = {
  title: string;
  href: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  originalPrice?: number | null;
  condition?: string;
  views?: number;
  productId?: string;
  productSlug?: string;
  promotionSurface?: "homepage" | "search" | "category" | "listing" | "seller";
  isFeatured?: boolean;
  isBumped?: boolean;
  isNew?: boolean;
  sellerName?: string;
  sellerAvatar?: string | null;
  sellerVerified?: boolean;
  sellerTrustScore?: number;
  sellerTier?: string;
  sellerResponseRate?: number;
  location?: string;
  rating?: number;
  reviewCount?: number;
  listingType?: string;
  auctionEndsAt?: string | null;
  auctionCurrentBid?: number | null;
  layout?: "carousel" | "grid";
  showBidButton?: boolean;
  className?: string;
};

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
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

export function HomeProductCard({
  title,
  href,
  imageUrl,
  imageAlt,
  price,
  originalPrice,
  condition,
  views,
  productId,
  productSlug,
  promotionSurface = "homepage",
  isFeatured = false,
  isBumped = false,
  isNew = false,
  sellerName,
  sellerAvatar,
  sellerVerified = false,
  sellerTrustScore,
  sellerResponseRate,
  location,
  rating = 0,
  reviewCount = 0,
  listingType,
  auctionEndsAt,
  auctionCurrentBid,
  layout = "carousel",
  showBidButton = false,
  className,
}: HomeProductCardProps) {
  const router = useRouter();
  const slug = productSlug ?? href.split("/").pop() ?? "";
  const { isSaved, toggle } = useProductWatchlist(slug);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const isAuction = listingType === "auction";
  const countdown = formatCountdown(auctionEndsAt);
  const displayPrice = isAuction && auctionCurrentBid != null ? auctionCurrentBid : price;
  const protectionFee = calculateProtectedFee(displayPrice);

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

      const willSave = !isSaved;
      void toggle();

      if (willSave && productId) {
        const { currency } = getActiveMarket();
        trackGaEvent("add_to_favorites", {
          item_id: productId,
          item_name: title,
          currency,
        });
      }

      setHeartAnimating(true);
      window.setTimeout(() => setHeartAnimating(false), 150);
    },
    [isSaved, productId, title, toggle],
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
    <Card
      padding="none"
      role="article"
      tabIndex={0}
      aria-label={title}
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden",
        transitionNormal,
        "active:-translate-y-0.5 active:shadow-ds-medium md:hover:-translate-y-0.5 md:hover:shadow-ds-medium",
        isFeatured && "ring-2 ring-warning/35",
        focusRing,
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-muted",
          layout === "grid" ? "aspect-[4/5]" : "aspect-[4/5] sm:aspect-square",
        )}
      >
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          loading="lazy"
          sizes={layout === "grid" ? "(max-width: 640px) 50vw, 25vw" : "14rem"}
          className={cn("object-cover", transitionNormal, "group-hover:scale-[1.03]")}
        />

        <div className="absolute left-ds-2 top-ds-2 flex max-w-[calc(100%-3rem)] flex-wrap gap-ds-1">
          {isFeatured ? (
            <Badge variant="warning" className="px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft">
              Featured
            </Badge>
          ) : null}
          {isNew ? (
            <Badge variant="success" className="px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft">
              New
            </Badge>
          ) : null}
          {isAuction ? (
            <Badge variant="danger" className="px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft">
              Auction
            </Badge>
          ) : null}
          {sellerVerified ? (
            <Badge variant="default" className="bg-primary/90 px-ds-2 py-0.5 text-[0.6875rem] text-primary-foreground shadow-ds-soft">
              Verified
            </Badge>
          ) : null}
        </div>

        <div className="absolute bottom-ds-2 left-ds-2 right-ds-2 flex flex-wrap gap-ds-1">
          {sellerTrustScore != null ? (
            <Badge
              variant="default"
              className="bg-surface/92 px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft backdrop-blur-sm"
            >
              Trust {sellerTrustScore}
            </Badge>
          ) : null}
          <Badge
            variant="default"
            className="bg-surface/92 px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft backdrop-blur-sm"
          >
            Protected +{new Intl.NumberFormat(undefined, { style: "currency", currency: getActiveMarket().currency, maximumFractionDigits: 2 }).format(protectionFee)}
          </Badge>
        </div>

        <button
          type="button"
          aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={isSaved}
          onClick={toggleFavorite}
          className={cn(
            "absolute right-ds-2 top-ds-2 flex min-h-ds-7 min-w-ds-7 items-center justify-center rounded-ds-full",
            "bg-surface/90 text-text-secondary shadow-ds-soft backdrop-blur-sm",
            focusRing,
            transitionSpring,
            isSaved && "text-danger",
            heartAnimating && "scale-90",
          )}
        >
          <HeartIcon filled={isSaved} className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-ds-2 p-ds-3">
        {condition ? (
          <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-secondary">
            {normalizeCondition(condition)}
          </p>
        ) : null}

        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-text-primary">
          {title}
        </p>

        <div className="flex items-center gap-ds-2">
          <Price amount={displayPrice} size="lg" />
          {originalPrice && originalPrice > price ? (
            <span className="text-xs text-text-muted line-through">
              {new Intl.NumberFormat(undefined, { style: "currency", currency: getActiveMarket().currency }).format(originalPrice)}
            </span>
          ) : null}
        </div>

        {sellerName ? (
          <div className="flex items-center gap-ds-2">
            <Avatar src={sellerAvatar} alt={sellerName} name={sellerName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{sellerName}</p>
              <div className="flex flex-wrap items-center gap-x-ds-2 gap-y-0.5 text-[0.6875rem] text-text-secondary">
                {location ? <span>{location}</span> : null}
                {sellerResponseRate != null ? <span>{sellerResponseRate}% response</span> : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-ds-2 text-xs text-text-secondary">
          <div className="flex items-center gap-ds-2">
            {views != null ? (
              <span className="inline-flex items-center gap-ds-1">
                <EyeIcon className="h-3.5 w-3.5" />
                {views}
              </span>
            ) : null}
            {countdown ? <span className="font-medium text-danger">{countdown}</span> : null}
          </div>
          <Rating value={rating} reviewCount={reviewCount} size="sm" />
        </div>

        {(showBidButton || isAuction) && countdown ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openProduct();
            }}
            className={cn(
              "mt-ds-1 min-h-ds-7 w-full rounded-ds-full bg-primary text-xs font-semibold text-primary-foreground",
              "shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-transform active:scale-[0.97]",
              focusRing,
            )}
          >
            Place bid
          </button>
        ) : null}
      </div>
    </Card>
  );
}
