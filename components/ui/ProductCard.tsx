"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { normalizeCondition } from "@/lib/products/utils";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackSaveListing } from "@/lib/analytics/marketplace-events";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { getActiveMarket } from "@/lib/seo/markets";
import { focusRing, transitionNormal, transitionSpring } from "@/components/ui/tokens";

export type ProductCardProps = {
  title: string;
  href: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  condition?: string;
  views?: number;
  productId?: string;
  slug?: string;
  promotionSurface?: "homepage" | "search" | "category" | "listing" | "seller";
  isFeatured?: boolean;
  isBumped?: boolean;
  isFavorite?: boolean;
  onFavorite?: () => void;
  favoriteLabel?: string;
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

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.02.356.057.526.111m1.683 2.342a2.25 2.25 0 1 0 2.433 3.334m-2.433-3.334a2.246 2.246 0 0 0-1.683-.111m1.683 2.342 2.433 3.334M7.217 10.907 3.75 8.25m3.467 2.657L3.75 13.5m13.5-5.25-3.467 2.657m3.467-2.657L20.25 8.25m-3.467 2.657 3.467 2.657" />
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

function triggerHapticFeedback() {
  // Placeholder for native haptic feedback in the future mobile app shell.
}

export function ProductCard({
  title,
  href,
  imageUrl,
  imageAlt,
  price,
  condition,
  views,
  productId,
  slug,
  promotionSurface = "search",
  isFeatured = false,
  isBumped = false,
  isFavorite: isFavoriteProp,
  onFavorite,
  className,
}: ProductCardProps) {
  const router = useRouter();
  const [isFavoriteInternal, setIsFavoriteInternal] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const listingSlug = slug ?? href.replace(/^\/listing\//, "").split("?")[0] ?? "";

  const isFavorite = isFavoriteProp ?? isFavoriteInternal;

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

      if (onFavorite) {
        onFavorite();
      } else {
        setIsFavoriteInternal(willSave);
      }

      if (willSave) {
        triggerHapticFeedback();
        if (productId) {
          const { currency } = getActiveMarket();
          trackSaveListing({
            itemId: productId,
            itemName: title,
            currency,
          });
        }
      }

      setHeartAnimating(true);
      window.setTimeout(() => setHeartAnimating(false), 150);
    },
    [isFavorite, onFavorite, productId, title],
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
        "group flex h-full cursor-pointer flex-col overflow-hidden rounded-[var(--ds-radius-premium)]",
        "premium-card border-0 bg-surface/95",
        transitionNormal,
        "md:hover:-translate-y-1",
        isFeatured && "ring-2 ring-warning/40",
        isBumped && !isFeatured && "ring-2 ring-success/30",
        focusRing,
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[var(--ds-radius-premium)] bg-surface-muted">
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover premium-image-depth",
            transitionNormal,
            "group-hover:scale-[1.04] group-active:scale-[1.02]",
          )}
        />

        {condition && (
          <Badge
            variant="default"
            className="absolute left-ds-2 top-ds-2 px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft"
          >
            {normalizeCondition(condition)}
          </Badge>
        )}

        {isFeatured && (
          <Badge
            variant="warning"
            className="absolute right-ds-2 top-ds-2 px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft"
          >
            Featured
          </Badge>
        )}

        {isBumped && !isFeatured && (
          <Badge
            variant="success"
            className="absolute right-ds-2 top-ds-2 px-ds-2 py-0.5 text-[0.6875rem] shadow-ds-soft"
          >
            Boosted
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-ds-2 p-ds-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-text-primary">
          {title}
        </p>

        <Price amount={price} size="lg" />

        <div className="mt-auto flex items-center justify-between gap-ds-2">
          {views != null ? (
            <p className="inline-flex min-h-ds-7 items-center gap-ds-1 text-xs text-text-secondary">
              <EyeIcon className="h-3.5 w-3.5" />
              <span>{views}</span>
            </p>
          ) : (
            <span aria-hidden />
          )}

          <div className="flex items-center gap-ds-1">
            {listingSlug ? (
              <button
                type="button"
                aria-label="Share listing"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShareOpen(true);
                }}
                className={cn(
                  "flex min-h-ds-7 min-w-ds-7 shrink-0 items-center justify-center rounded-ds-full text-text-secondary",
                  focusRing,
                  transitionSpring,
                )}
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            ) : null}

            <button
              type="button"
              aria-label="Save item"
              aria-pressed={isFavorite}
              onClick={toggleFavorite}
              className={cn(
                "flex min-h-ds-7 min-w-ds-7 shrink-0 items-center justify-center rounded-ds-full text-text-secondary",
                focusRing,
                transitionSpring,
                isFavorite && "text-danger",
                heartAnimating && "scale-90",
              )}
            >
              <HeartIcon filled={isFavorite} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {listingSlug ? (
        <ShareListingSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={title}
          slug={listingSlug}
          productId={productId}
          price={price}
        />
      ) : null}
    </Card>
  );
}
