/**
 * ROVEXO Visit Store — `/store/[slug]` only.
 * Never used by Profile `/user/[username]`.
 *
 * No Store Cover/banner. Starts at avatar + identity · Follow / Message / Share · listings.
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
import { Modal } from "@/components/ui/Modal";
import { SafeImage } from "@/components/ui/SafeImage";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/Button";
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
import {
  STORE_V2_CANONICAL,
  STORE_V2_VERSION,
} from "@/lib/store/store-v2-final-v1";
import { HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE } from "@/lib/listings/holiday-mode-visibility-v1";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { copyText } from "@/lib/store-sharing/store-share-v1";
import { StoreShopBundles } from "@/features/store/components/StoreShopBundles";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import "@/styles/rovexo/store-visit-v2.css";

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
  const [overflowOpen, setOverflowOpen] = useState(false);
  const ignoreOverflowBackdropClickRef = useRef(false);
  const [messageBusy, setMessageBusy] = useState(false);

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

  const activeListings = useMemo(
    () => (loadFailed ? [] : listings),
    [loadFailed, listings],
  );
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
      const copied = await copyText(absoluteStoreUrl);
      if (copied) {
        pushToast({ title: "Store link copied", variant: "success" });
        return;
      }
      window.prompt("Copy store link", absoluteStoreUrl);
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

  const handleMessage = useCallback(async () => {
    if (messageBusy) return;
    const productSlug = activeListings[0]?.slug;
    if (!productSlug) {
      pushToast({ title: "Messaging is temporarily unavailable.", variant: "error" });
      return;
    }
    setMessageBusy(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug }),
      });
      const payload = (await response.json().catch(() => null)) as { href?: string } | null;
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(storeSharePath)}`);
        return;
      }
      if (!response.ok || !payload?.href) {
        pushToast({ title: "Messaging is temporarily unavailable.", variant: "error" });
        return;
      }
      router.push(payload.href);
    } catch {
      pushToast({ title: "Messaging is temporarily unavailable.", variant: "error" });
    } finally {
      setMessageBusy(false);
    }
  }, [activeListings, messageBusy, pushToast, router, storeSharePath]);

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
        className={cn("sv2", overflowOpen && "sv2--overflow-open")}
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
          rightAction={
            <button
              type="button"
              className={cn("sv2__overflow-btn", focusRing)}
              aria-label="Store menu"
              aria-expanded={overflowOpen}
              data-store-header-overflow="v1"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                ignoreOverflowBackdropClickRef.current = true;
                setOverflowOpen((open) => !open);
                window.setTimeout(() => {
                  ignoreOverflowBackdropClickRef.current = false;
                }, 0);
              }}
            >
              <PlatformEmoji emoji={PLATFORM_EMOJI.more} size={22} />
            </button>
          }
        />
        {overflowOpen ? (
          <>
            <button
              type="button"
              className="sv2__overflow-backdrop"
              aria-label="Close store menu"
              onClick={() => {
                if (ignoreOverflowBackdropClickRef.current) return;
                setOverflowOpen(false);
              }}
            />
            <div
              className="sv2__overflow-menu"
              role="menu"
              data-store-overflow-menu="v1"
              data-store-overflow-role={isOwnStore ? "owner" : "visitor"}
            >
              {isOwnStore ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="sv2__overflow-item"
                    aria-label="Share Store"
                    data-store-overflow-owner="share"
                    onClick={() => {
                      setOverflowOpen(false);
                      handleShare();
                    }}
                  >
                    Share Store
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="sv2__overflow-item"
                    aria-label="Edit Store"
                    data-store-overflow-owner="edit"
                    onClick={() => {
                      setOverflowOpen(false);
                      router.push("/account/edit-profile");
                    }}
                  >
                    Edit Store
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className="sv2__overflow-item"
                  aria-label="Report store"
                  data-store-overflow-visitor="report"
                  onClick={() => {
                    setOverflowOpen(false);
                    setReportOpen(true);
                  }}
                >
                  Report
                </button>
              )}
            </div>
          </>
        ) : null}

        <HubPageMain className="sv2__main">
          <section className="sv2__hero" data-store-hero="v2" data-store-mobile-canonical="v2.0">
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

            <div className={cn("sv2__actions", isOwnStore && "sv2__actions--own")}>
              {!isOwnStore ? (
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
              ) : null}
              {!isOwnStore ? (
                <button
                  type="button"
                  className={cn("sv2__action-btn", "sv2__action-btn--message", focusRing)}
                  disabled={messageBusy}
                  onClick={() => void handleMessage()}
                >
                  <PlatformEmoji emoji={PLATFORM_EMOJI.chat} size={16} />
                  Message
                </button>
              ) : null}
              <button
                type="button"
                className={cn("sv2__action-btn", "sv2__action-btn--share", focusRing)}
                aria-label="Share store"
                data-store-share="v2"
                onClick={() => {
                  handleShare();
                }}
              >
                <PlatformEmoji emoji={PLATFORM_EMOJI.share} size={16} />
                Share
              </button>
            </div>
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
            <div className="sv2__section" aria-label="Listings">
              <StoreShopBundles
                sellerId={store.sellerId}
                sellerName={store.storeName || "Seller"}
                listings={activeListings}
                visibleCount={listingsVisible}
                onLoadMore={() => setListingsVisible((n) => n + LISTINGS_PAGE_SIZE)}
                isOwnStore={isOwnStore}
                holidayModeEnabled={store.holidayModeEnabled}
                holidayEmptyMessage={HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE}
              />
            </div>
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
