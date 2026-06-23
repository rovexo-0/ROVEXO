"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { cn } from "@/lib/cn";
import { normalizeCondition } from "@/lib/products/utils";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { focusRing, transitionNormal, transitionSpring } from "@/components/ui/tokens";

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
  sellerTrustScore,
  listingType,
  auctionEndsAt,
  auctionCurrentBid,
  className,
}: HomeProductCardProps) {
  const router = useRouter();
  const slug = productSlug ?? href.split("/").pop() ?? "";
  const { isSaved, toggle } = useProductWatchlist(slug);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const isAuction = listingType === "auction";
  const countdown = formatCountdown(auctionEndsAt);
  const displayPrice = isAuction && auctionCurrentBid != null ? auctionCurrentBid : price;

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
    <article
      role="article"
      tabIndex={0}
      aria-label={title}
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "marketplace-listing-card group cursor-pointer",
        transitionNormal,
        isFeatured && "ring-2 ring-warning/35",
        focusRing,
        className,
      )}
    >
      <div className="marketplace-listing-card__image">
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          loading="lazy"
          sizes="158px"
          className={cn("object-cover", transitionNormal, "group-hover:scale-[1.03]")}
        />

        <div className="absolute left-1 top-1 flex max-w-[calc(100%-2rem)] flex-wrap gap-0.5">
          {isFeatured ? <Badge variant="warning" className="px-1 py-0.5 text-[9px] leading-none">Featured</Badge> : null}
          {isNew ? <Badge variant="success" className="px-1 py-0.5 text-[9px] leading-none">New</Badge> : null}
          {isAuction ? <Badge variant="danger" className="px-1 py-0.5 text-[9px] leading-none">Auction</Badge> : null}
        </div>

        <button
          type="button"
          aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={isSaved}
          onClick={toggleFavorite}
          className={cn(
            "absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-ds-full bg-surface/90 backdrop-blur-sm",
            focusRing,
            transitionSpring,
            isSaved && "text-danger",
            heartAnimating && "scale-90",
          )}
        >
          <HeartIcon filled={isSaved} className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="marketplace-listing-card__body">
        {condition ? (
          <p className="truncate text-[9px] font-medium uppercase tracking-wide text-text-muted">
            {normalizeCondition(condition)}
          </p>
        ) : null}

        <p className="marketplace-listing-card__title">{title}</p>

        <Price amount={displayPrice} size="xs" className="gap-0.5" />

        {sellerName ? (
          <div className="flex items-center gap-1">
            <Avatar src={sellerAvatar} alt={sellerName} name={sellerName} size="sm" className="!h-5 !w-5" />
            <p className="min-w-0 flex-1 truncate text-[10px] font-medium text-text-primary">{sellerName}</p>
          </div>
        ) : null}

        <div className="marketplace-listing-card__meta">
          <div className="flex min-w-0 items-center gap-1 text-[10px] text-text-secondary">
            {views != null ? (
              <span className="inline-flex items-center gap-0.5">
                <EyeIcon className="h-3 w-3" />
                {views}
              </span>
            ) : null}
            {countdown ? <span className="truncate font-medium text-danger">{countdown}</span> : null}
          </div>
          {sellerTrustScore != null ? (
            <span className="shrink-0 text-[10px] font-medium text-primary">{sellerTrustScore}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
