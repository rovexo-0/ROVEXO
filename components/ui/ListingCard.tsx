"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { trackPromotionEvent } from "@/components/promotions/PromotionAnalyticsBeacon";
import { trackSaveListing } from "@/lib/analytics/marketplace-events";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import { resolveHomepagePromotionBadge } from "@/lib/homepage/feed-ranking";
import styles from "@/components/ui/ListingCard.module.css";

/**
 * ROVEXO canonical listing card — the single source of truth for every product
 * listing surface (homepage rails, search, category, seller/store, saved,
 * similar, recently viewed, and any future grid or carousel).
 *
 * The card is entirely configuration-driven: every surface renders THIS
 * component with different flags. New features (verified, delivery, finance,
 * AI score, auction timer, boost, sponsored, ...) must be added as additive
 * props here — never as a new card component.
 */

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Promotion analytics only accepts real persisted products (UUID ids). Demo
 *  and enriched homepage placeholders use non-UUID ids and must be skipped. */
function isTrackableProductId(id: string): boolean {
  return UUID_RE.test(id);
}

/** Maps any listing surface onto the promotion-analytics surface enum. */
function toPromotionSurface(surface: ListingCardSurface): PromotionSurface {
  switch (surface) {
    case "homepage":
    case "search":
    case "category":
    case "listing":
    case "seller":
      return surface;
    default:
      return "search";
  }
}

/** Single responsive hint for every layout preset — does not change rendered box geometry. */
const DEFAULT_IMAGE_SIZES =
  "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px";

export interface ListingCardProps {
  /** Single data source. The card derives everything it renders from here. */
  product: Product;
  /**
   * Layout preset for the parent container (rail scroller vs grid). Does not
   * change any visual styling inside the card — containers own scroll/wrap only.
   */
  variant?: ListingCardVariant;
  /** Analytics / promotion context for the surface rendering the card. */
  surface?: ListingCardSurface;
  /**
   * Whether this card should record a promotion impression. Duplicated carousel
   * copies pass `false` so a single product is not counted multiple times.
   */
  trackImpressions?: boolean;
  /** Eagerly load this card's image (used for above-the-fold LCP elements). */
  priority?: boolean;
  /** Override the responsive `sizes` attribute for the image. */
  imageSizes?: string;
  /** Override link destination (e.g. business store search). */
  href?: string;
  /** Override rendered price text while preserving price row layout. */
  priceLabel?: string;
  /** Override status badge label (badge text/color may differ per listing data). */
  statusBadgeLabel?: string;
  className?: string;

  // ---- Additive feature toggles (defaults are sensible for all surfaces) ----
  showFavorite?: boolean;
  showShare?: boolean;
  showSeller?: boolean;
  showRating?: boolean;
  showViews?: boolean;
  showBuyerProtection?: boolean;
  showCondition?: boolean;
  /**
   * Where the condition label renders:
   * - "badge": overlaid on the image (default, used by grid surfaces).
   * - "meta": inline in the metadata row (used by the homepage hierarchy).
   */
  conditionPlacement?: "badge" | "meta";
  showStatusBadge?: boolean;
  showPhotoCount?: boolean;

  // ---- Favourite behaviour ----
  /**
   * "watchlist" persists the favourite via the shared product watchlist.
   * "controlled" defers to `isFavorite` / `onFavorite` (e.g. the Saved page).
   */
  favoriteMode?: "watchlist" | "controlled";
  isFavorite?: boolean;
  onFavorite?: () => void;
}

function formatPrice(amount: number): string {
  return `£${amount.toLocaleString()}`;
}

function formatViews(views?: number): string {
  const value = views ?? 0;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "New";
}

function formatCondition(condition?: string): string | null {
  if (!condition?.trim()) return null;
  const clean = condition.replace(/[_-]+/g, " ").trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
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

type StatusBadge = {
  label: string;
  tone: "featured" | "boost" | "premium" | "new" | "auction" | "verified" | "business";
};

function resolveStatusBadge(product: Product): StatusBadge | null {
  if (product.listingType === "auction") return { label: "Auction", tone: "auction" };
  const homepageBadge = resolveHomepagePromotionBadge(product);
  if (homepageBadge) return homepageBadge;
  return null;
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l.9-1.4A1 1 0 0 1 9.4 4h5.2a1 1 0 0 1 .84.46L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12.5" r="3.1" fill="#fff" />
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  // Inline SVG (not a 3D image) so the disc's `color` controls the heart:
  // dark outline when inactive, solid bright red when saved — always readable.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return <Fluency3DIcon icon="feature-share" size={18} className={className} />;
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
  conditionPlacement = "badge",
  showStatusBadge = true,
  showPhotoCount = true,
  favoriteMode = "watchlist",
  isFavorite: isFavoriteProp,
  onFavorite,
}: ListingCardProps) {
  void variant;
  const href = hrefOverride ?? `/listing/${product.slug}`;
  const promotionSurface = toPromotionSurface(surface);
  const isPromoted =
    Boolean(product.isFeatured || product.isBumped) && isTrackableProductId(product.id);

  const { isSaved, toggle: toggleWatchlist } = useProductWatchlist(
    favoriteMode === "watchlist" ? product.slug : "",
  );
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isFavorite = favoriteMode === "watchlist" ? isSaved : Boolean(isFavoriteProp);

  const isAuction = product.listingType === "auction";
  const countdown = isAuction ? formatCountdown(product.auctionEndsAt) : null;
  const displayPrice =
    isAuction && product.auctionCurrentBid != null ? product.auctionCurrentBid : product.price;
  const statusBadge = useMemo(() => {
    if (statusBadgeLabel) return { label: statusBadgeLabel, tone: "featured" as const };
    return resolveStatusBadge(product);
  }, [product, statusBadgeLabel]);
  const photoCount = product.imageCount ?? 0;
  const sellerHandle = product.sellerUsername
    ? `@${product.sellerUsername}`
    : product.sellerName;
  const conditionLabel = showCondition ? formatCondition(product.condition) : null;
  const conditionOnImage = conditionPlacement === "badge" && conditionLabel;
  const conditionInMeta = conditionPlacement === "meta" && conditionLabel;

  useEffect(() => {
    if (!isPromoted || !trackImpressions) return;
    trackPromotionEvent(product.id, "impression", promotionSurface);
  }, [isPromoted, trackImpressions, product.id, promotionSurface]);

  const handleNavigate = useCallback(() => {
    if (isPromoted) {
      trackPromotionEvent(product.id, "click", promotionSurface);
    }
  }, [isPromoted, product.id, promotionSurface]);

  const toggleFavorite = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const willSave = !isFavorite;

      if (favoriteMode === "watchlist") {
        void toggleWatchlist();
        if (willSave) {
          const { currency } = getActiveMarket();
          trackGaEvent("add_to_favorites", {
            item_id: product.id,
            item_name: product.title,
            currency,
          });
        }
      } else {
        onFavorite?.();
        if (willSave) {
          const { currency } = getActiveMarket();
          trackSaveListing({ itemId: product.id, itemName: product.title, currency });
        }
      }

      setHeartAnimating(true);
      window.setTimeout(() => setHeartAnimating(false), 200);
    },
    [favoriteMode, isFavorite, onFavorite, product.id, product.title, toggleWatchlist],
  );

  const openShare = useCallback((event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShareOpen(true);
  }, []);

  return (
    <article
      className={cn(styles.card, className)}
      data-listing-card="rovexo"
    >
      <Link href={href} className={styles.link} aria-label={product.title} onClick={handleNavigate}>
        <div className={styles.media}>
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={imageSizes ?? DEFAULT_IMAGE_SIZES}
            className={styles.image}
          />

          {showStatusBadge && statusBadge ? (
            <span className={cn(styles.statusBadge, styles[`status_${statusBadge.tone}`])}>
              {statusBadge.label}
            </span>
          ) : null}

          {conditionOnImage ? (
            <span className={styles.conditionBadge}>{conditionLabel}</span>
          ) : null}

          {showPhotoCount && photoCount > 1 ? (
            <span className={styles.photoCount} aria-label={`${photoCount} photos`}>
              <CameraIcon className={styles.photoCountIcon} />
              {photoCount}
            </span>
          ) : null}
        </div>

        <div className={styles.body}>
          <div className={styles.bodyStack}>
            <p className={styles.title}>{product.title}</p>

            <div className={styles.priceRow}>
              <span className={styles.price}>{priceLabel ?? formatPrice(displayPrice)}</span>
              {product.originalPrice && product.originalPrice > displayPrice ? (
                <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
              ) : null}
            </div>

            {showBuyerProtection ? (
              <span className={styles.protection}>
                <RovexoIcon icon={RovexoIcons.security.shield} size={13} className={styles.protectionIcon} />
                Buyer Protection
              </span>
            ) : null}

            {showSeller ? (
              <div className={styles.seller}>
                <span className={styles.sellerAvatar}>
                  {product.sellerAvatar ? (
                    <Image
                      src={product.sellerAvatar}
                      alt=""
                      width={20}
                      height={20}
                      className={styles.sellerAvatarImg}
                    />
                  ) : (
                    <span className={styles.sellerAvatarFallback} aria-hidden>
                      {product.sellerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className={styles.sellerName}>{sellerHandle}</span>
                {showRating ? (
                  <span className={styles.sellerRating} aria-label={`Rating ${formatRating(product.rating)}`}>
                    <RovexoIcon
                      icon={RovexoIcons.actions.star}
                      size={13}
                      className={styles.sellerRatingIcon}
                    />
                    {formatRating(product.rating)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {conditionInMeta || showViews || countdown ? (
            <div className={styles.metaRow}>
              {conditionInMeta ? (
                <span className={styles.metaCondition}>{conditionLabel}</span>
              ) : null}
              <span className={styles.metaRight}>
                {showViews ? (
                  <span className={styles.views} aria-label={`${formatViews(product.views)} views`}>
                    <RovexoIcon icon={RovexoIcons.actions.eye} size={14} className={styles.metaIcon} />
                    {formatViews(product.views)}
                  </span>
                ) : null}
                {countdown ? <span className={styles.countdown}>{countdown}</span> : null}
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      {showFavorite ? (
        <button
          type="button"
          aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isFavorite}
          onClick={toggleFavorite}
          className={cn(
            styles.favorite,
            isFavorite && styles.favoriteActive,
            heartAnimating && styles.favoriteAnimating,
          )}
        >
          <HeartIcon filled={isFavorite} className={styles.favoriteIcon} />
        </button>
      ) : null}

      {showShare ? (
        <button
          type="button"
          aria-label="Share listing"
          onClick={openShare}
          className={styles.share}
        >
          <ShareIcon className={styles.shareIcon} />
        </button>
      ) : null}

      {showShare ? (
        <ShareListingSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={product.title}
          slug={product.slug}
          productId={product.id}
          price={displayPrice}
        />
      ) : null}
    </article>
  );
});
