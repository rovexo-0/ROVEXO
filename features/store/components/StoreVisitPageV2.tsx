/**
 * ROVEXO Visit Store v2.0 — Compact Owner Freeze
 * Route ONLY: `/store/[slug]`
 * Never used by Profile `/user/[username]`.
 *
 * First screen: Hero → Identity → Meta → Share/Report (+ Follow) → Tabs → Listings.
 * Removed: intermediate info cards · Message CTA · profile shortcut · listing filter control.
 */

"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCanonicalHeader } from "@/features/account-canonical/header/AccountCanonicalHeader";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListingCard } from "@/components/ui/ListingCard";
import { Modal } from "@/components/ui/Modal";
import { SafeImage } from "@/components/ui/SafeImage";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/Button";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { useToast } from "@/components/ui/Toast";
import { FollowButton, type FollowCounts } from "@/components/follow/FollowButton";
import {
  buildRatingDistribution,
  RATING_DISTRIBUTION_LADDER,
} from "@/lib/reviews/rating-distribution";
import { FOLLOW_RATING_BADGE_STAR_COLOR } from "@/lib/reviews/follow-rating-badge-spec-v1";
import type { Review } from "@/lib/reviews/types";
import type { Product } from "@/lib/products/types";
import type { StoreRecord } from "@/lib/store/store-repository";
import { storeListingCardAttr } from "@/lib/store/store-listing-card-premium-v1";
import {
  STORE_V2_CANONICAL,
  STORE_V2_VERSION,
} from "@/lib/store/store-v2-final-v1";
import { HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE } from "@/lib/listings/holiday-mode-visibility-v1";
import { ShareIcon } from "@/features/product-detail/icons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import "@/styles/rovexo/store-visit-v2.css";

/** Discrete flag icon — Store hero only (20–22px purple, no chrome). */
function ReportFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={22}
      height={22}
      aria-hidden
    >
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.5 4L16 12H5" />
    </svg>
  );
}

type MainTab = "listings" | "reviews";

const LISTINGS_PAGE_SIZE = 24;
const REVIEWS_PAGE_SIZE = 10;

const REPORT_REASONS = [
  "Scam or fraud",
  "Counterfeit sales",
  "Harassment",
  "Unsafe or illegal activity",
  "Other",
] as const;

export type StoreVisitPageV2Props = {
  store: StoreRecord;
  listings: Product[];
  reviews: Review[];
  memberSinceLabel: string;
  isOwnStore: boolean;
  initialFollowing: boolean;
  followerCount: number;
  followingCount: number;
  loadFailed?: boolean;
};

function memberSinceYear(label: string): string {
  const year = label.match(/\b(20\d{2})\b/)?.[1];
  return year ? `Member since ${year}` : `Member since ${label}`;
}

function formatRelativeReviewTime(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Math.max(0, nowMs - then);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function StarRow({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <span className={cn("sv2__stars", className)} aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn("sv2__star", i < filled && "sv2__star--on")}
          style={i < filled ? { color: FOLLOW_RATING_BADGE_STAR_COLOR } : undefined}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function StoreVisitPageV2({
  store,
  listings,
  reviews,
  memberSinceLabel,
  isOwnStore,
  initialFollowing,
  followerCount: initialFollowerCount,
  followingCount: initialFollowingCount,
  loadFailed = false,
}: StoreVisitPageV2Props) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [tab, setTab] = useState<MainTab>("listings");
  const [listingsVisible, setListingsVisible] = useState(LISTINGS_PAGE_SIZE);
  const [reviewsVisible, setReviewsVisible] = useState(REVIEWS_PAGE_SIZE);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);
  const [storeId, setStoreId] = useState(store.sellerId);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] =
    useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  if (store.sellerId !== storeId) {
    setStoreId(store.sellerId);
    setFollowerCount(initialFollowerCount);
    setFollowingCount(initialFollowingCount);
    setListingsVisible(LISTINGS_PAGE_SIZE);
    setReviewsVisible(REVIEWS_PAGE_SIZE);
  }

  const onFollowCountsChange = useCallback((counts: FollowCounts) => {
    setFollowerCount(counts.followerCount);
    setFollowingCount(counts.followingCount);
  }, []);

  const activeListings = loadFailed ? [] : listings;
  const visibleListings = activeListings.slice(0, listingsVisible);
  const hasMoreListings = listingsVisible < activeListings.length;

  const reviewCount = Math.max(0, store.reviewCount, reviews.length);
  const averageRating =
    store.reviewCount > 0 && store.rating > 0
      ? store.rating
      : reviews.length > 0
        ? reviews.reduce((total, row) => total + Number(row.rating), 0) / reviews.length
        : 0;
  const ratingDistribution = useMemo(() => buildRatingDistribution(reviews), [reviews]);
  const visibleReviews = reviews.slice(0, reviewsVisible);
  const hasMoreReviews = reviewsVisible < reviews.length;

  const storeSharePath = `/store/${encodeURIComponent(store.storeSlug || store.storeId)}`;
  const shareInFlightRef = useRef(false);

  const isShareAbort = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const name = "name" in error ? String((error as { name: unknown }).name) : "";
    if (name === "AbortError") return true;
    return false;
  };

  const copyStoreLinkFallback = useCallback(
    async (absoluteStoreUrl: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(absoluteStoreUrl);
          pushToast({ title: "Store link copied", variant: "success" });
          return;
        }
        throw new Error("clipboard-unavailable");
      } catch {
        try {
          const input = document.createElement("textarea");
          input.value = absoluteStoreUrl;
          input.setAttribute("readonly", "");
          input.style.position = "fixed";
          input.style.top = "0";
          input.style.left = "-9999px";
          document.body.appendChild(input);
          input.focus();
          input.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(input);
          if (!ok) throw new Error("execCommand-copy-failed");
          pushToast({ title: "Store link copied", variant: "success" });
        } catch {
          window.prompt("Copy store link", absoluteStoreUrl);
        }
      }
    },
    [pushToast],
  );

  /**
   * P2 Share Store — native sheet first.
   * MUST call navigator.share() in the same synchronous turn as the tap.
   * Clipboard toast ONLY when share is missing or throws a non-AbortError.
   */
  const handleShare = useCallback(() => {
    if (shareInFlightRef.current) return;

    const absoluteStoreUrl = new URL(
      storeSharePath,
      typeof window !== "undefined" ? window.location.href : "https://www.rovexo.co.uk",
    ).href;

    // 1) Unsupported → clipboard only
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      void copyStoreLinkFallback(absoluteStoreUrl);
      return;
    }

    // 2) Invoke native share IMMEDIATELY — no pre-validation, no awaits before this call
    shareInFlightRef.current = true;
    let sharePromise: Promise<void>;
    try {
      sharePromise = navigator.share({
        title: store.storeName,
        text: "Check out this ROVEXO Store",
        url: absoluteStoreUrl,
      });
    } catch (error) {
      shareInFlightRef.current = false;
      if (isShareAbort(error)) return;
      void copyStoreLinkFallback(absoluteStoreUrl);
      return;
    }

    void sharePromise.then(
      () => {
        shareInFlightRef.current = false;
      },
      (error: unknown) => {
        shareInFlightRef.current = false;
        // 3) User cancelled Share Sheet → success. No toast. No clipboard.
        if (isShareAbort(error)) return;
        // 4) Real runtime error → clipboard + toast
        void copyStoreLinkFallback(absoluteStoreUrl);
      },
    );
  }, [copyStoreLinkFallback, store.storeName, storeSharePath]);

  const submitReport = useCallback(async () => {
    setReportSubmitting(true);
    try {
      const response = await fetch("/api/users/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: store.sellerId,
          reason: reportReason,
          message: reportDetails.trim() || undefined,
        }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(storeSharePath)}`);
        return;
      }
      if (!response.ok) {
        pushToast({ title: "Unable to submit report.", variant: "error" });
        return;
      }
      pushToast({ title: "Store report submitted.", variant: "success" });
      setReportOpen(false);
      setReportDetails("");
    } finally {
      setReportSubmitting(false);
    }
  }, [pushToast, reportDetails, reportReason, router, store.sellerId, storeSharePath]);

  return (
    <BetaAppShell>
      <div
        className="sv2"
        data-store-version={STORE_V2_VERSION}
        data-store-canonical={STORE_V2_CANONICAL}
        data-store-freeze="PRODUCTION_FREEZE_ACTIVE"
        data-store-compact="v2"
        data-full-width-engine="v1.0"
        data-master-full-width="v1.0-master-fw"
      >
        <AccountCanonicalHeader
          centeredTitle="Store"
          fallbackHref="/search"
          backLabel="Back"
          closeFallbackHref="/"
        />

        <HubPageMain className="sv2__main">
          <div className="sv2__banner" aria-hidden data-store-hero-banner="v2" />

          <section className="sv2__hero" data-store-hero="v2" data-store-mobile-canonical="v2.0">
            <div className="sv2__hero-icons" role="group" aria-label="Store actions">
              <button
                type="button"
                className={cn("sv2__icon-btn", "sv2__icon-btn--share", focusRing)}
                aria-label="Share store"
                data-store-share="v2"
                onClick={() => {
                  handleShare();
                }}
              >
                <ShareIcon size={22} className="sv2__icon" />
              </button>
              {!isOwnStore ? (
                <button
                  type="button"
                  className={cn("sv2__icon-btn", focusRing)}
                  aria-label="Report store"
                  onClick={() => setReportOpen(true)}
                >
                  <ReportFlagIcon className="sv2__icon" />
                </button>
              ) : null}
            </div>

            <div className="sv2__avatar-wrap">
              <Avatar
                src={store.avatarUrl}
                alt={store.storeName}
                name={store.storeName}
                size="xl"
                className="sv2__avatar"
              />
              {store.verified ? (
                <span className="sv2__avatar-verified" aria-hidden>
                  <VerifiedBadge title="Verified Seller" size={18} />
                </span>
              ) : null}
            </div>

            <h1 className="sv2__name">
              <span>{store.storeName}</span>
              {store.verified ? (
                <VerifiedBadge
                  className="sv2__name-verified"
                  title="Verified Seller"
                  size={16}
                />
              ) : null}
            </h1>
            <p className="sv2__username">@{store.storeSlug}</p>

            <div className="sv2__meta" aria-label="Store stats">
              <span>
                <span aria-hidden>⭐</span>{" "}
                {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                <span className="sv2__meta-muted">
                  {" "}
                  ({reviewCount.toLocaleString("en-GB")})
                </span>
              </span>
              <span className="sv2__dot" aria-hidden>
                ·
              </span>
              <span>{followerCount.toLocaleString("en-GB")} followers</span>
              <span className="sv2__dot" aria-hidden>
                ·
              </span>
              <span>{followingCount.toLocaleString("en-GB")} following</span>
              <span className="sv2__dot" aria-hidden>
                ·
              </span>
              <span>{memberSinceYear(memberSinceLabel)}</span>
            </div>

            {!isOwnStore ? (
              <div className="sv2__actions sv2__actions--follow-only">
                <div className="sv2__follow-slot">
                  <FollowButton
                    userId={store.sellerId}
                    initialFollowing={initialFollowing}
                    followerCount={followerCount}
                    followingCount={followingCount}
                    onCountsChange={onFollowCountsChange}
                    storeCta
                  />
                </div>
              </div>
            ) : null}
          </section>

          <nav className="sv2__tabs" aria-label="Store sections" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "listings"}
              className={cn("sv2__tab", tab === "listings" && "sv2__tab--active")}
              onClick={() => setTab("listings")}
            >
              Listings {activeListings.length || store.listingCount}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "reviews"}
              className={cn("sv2__tab", tab === "reviews" && "sv2__tab--active")}
              onClick={() => setTab("reviews")}
            >
              Reviews {reviewCount}
            </button>
          </nav>

          {tab === "listings" ? (
            <section className="sv2__section" aria-label="Listings">
              {activeListings.length > 0 ? (
                <>
                  <div
                    className="rx-listing-grid sv2__grid"
                    {...storeListingCardAttr("visit")}
                  >
                    {visibleListings.map((product) => (
                      <ListingCard
                        key={product.id}
                        product={product}
                        variant="grid"
                        {...HP_CANONICAL_LISTING_PROPS}
                        surface="store"
                      />
                    ))}
                  </div>
                  {hasMoreListings ? (
                    <button
                      type="button"
                      className={cn("sv2__load-more", focusRing)}
                      onClick={() => setListingsVisible((n) => n + LISTINGS_PAGE_SIZE)}
                    >
                      Load more
                    </button>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title={store.holidayModeEnabled ? "Store on holiday" : "No listings yet"}
                  description={
                    store.holidayModeEnabled
                      ? HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE
                      : "This seller has no active listings right now."
                  }
                />
              )}
            </section>
          ) : null}

          {tab === "reviews" ? (
            <section className="sv2__section" aria-label="Reviews">
              <div className="sv2__reviews-board">
                <div className="sv2__reviews-summary">
                  <p className="sv2__reviews-avg">
                    {reviewCount > 0 ? averageRating.toFixed(1) : "—"}
                  </p>
                  <StarRow
                    value={reviewCount > 0 ? averageRating : 0}
                    className="sv2__stars--lg"
                  />
                  <p className="sv2__reviews-count">
                    ({reviewCount.toLocaleString("en-GB")} reviews)
                  </p>
                </div>
                {reviewCount > 0 ? (
                  <ul className="sv2__rating-dist" aria-label="Rating distribution">
                    {RATING_DISTRIBUTION_LADDER.map(({ stars, key }) => {
                      const count = ratingDistribution[key];
                      const pct =
                        reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                      return (
                        <li key={key} className="sv2__rating-dist-row">
                          <span className="sv2__rating-dist-label">{stars}</span>
                          <span className="sv2__rating-dist-track" aria-hidden>
                            <span
                              className="sv2__rating-dist-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="sv2__rating-dist-count">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>

              {visibleReviews.length > 0 ? (
                <>
                  <ul className="sv2__review-list">
                    {visibleReviews.map((review) => {
                      const listingHref = review.productSlug
                        ? `/listing/${encodeURIComponent(review.productSlug)}`
                        : null;
                      return (
                        <li
                          key={review.id}
                          className="sv2__review"
                          style={{ contentVisibility: "auto" }}
                        >
                          <div className="sv2__review-body">
                            <Avatar
                              src={review.reviewerAvatarUrl}
                              alt={review.reviewerName ?? "Member"}
                              name={review.reviewerName ?? "Member"}
                              size="md"
                            />
                            <div className="sv2__review-main">
                              <div className="sv2__review-head">
                                <span className="sv2__review-author">
                                  {review.reviewerName ?? "Member"}
                                </span>
                                <StarRow value={review.rating} />
                                <time
                                  className="sv2__review-time"
                                  dateTime={review.createdAt}
                                >
                                  {formatRelativeReviewTime(review.createdAt)}
                                </time>
                              </div>
                              {review.verifiedPurchase ? (
                                <span className="sv2__verified-purchase">
                                  Verified Purchase
                                </span>
                              ) : null}
                              {review.comment?.trim() ? (
                                <p className="sv2__review-text">{review.comment.trim()}</p>
                              ) : null}
                            </div>
                            {listingHref ? (
                              <Link
                                href={listingHref}
                                className={cn(
                                  "sv2__review-product",
                                  !review.productImageUrl && "sv2__review-product--empty",
                                  focusRing,
                                )}
                                aria-label={
                                  review.productTitle
                                    ? `View ${review.productTitle}`
                                    : "View listing"
                                }
                              >
                                {review.productImageUrl ? (
                                  <SafeImage
                                    src={review.productImageUrl}
                                    alt={review.productTitle ?? "Purchased item"}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                ) : null}
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {hasMoreReviews ? (
                    <button
                      type="button"
                      className={cn("sv2__load-more", focusRing)}
                      onClick={() => setReviewsVisible((n) => n + REVIEWS_PAGE_SIZE)}
                    >
                      View all reviews
                    </button>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  premiumIllustrationId="reviews"
                  title="No reviews yet"
                  description="Reviews from buyers will appear here after completed orders."
                />
              )}
            </section>
          ) : null}
        </HubPageMain>

        <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report">
          <p className="text-sm text-text-secondary">
            Report <strong>{store.storeName}</strong>. Reports are reviewed by ROVEXO moderation.
          </p>
          <label className="mt-ds-4 flex flex-col gap-ds-2 text-sm">
            <span className="font-medium text-text-primary">Reason</span>
            <select
              value={reportReason}
              onChange={(event) =>
                setReportReason(event.target.value as (typeof REPORT_REASONS)[number])
              }
              className="rx-input min-h-ds-7 px-ds-3 py-ds-2"
            >
              {REPORT_REASONS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-ds-4 flex flex-col gap-ds-2 text-sm">
            <span className="font-medium text-text-primary">Details (optional)</span>
            <textarea
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              rows={4}
              maxLength={1000}
              className="rx-input min-h-[96px] px-ds-3 py-ds-2"
            />
          </label>
          <div className="mt-ds-4 flex justify-end gap-ds-2">
            <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitReport()}
              disabled={reportSubmitting}
            >
              Submit report
            </Button>
          </div>
        </Modal>
      </div>
    </BetaAppShell>
  );
}
