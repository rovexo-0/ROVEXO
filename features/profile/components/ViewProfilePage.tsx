/**
 * My Profile / View Profile v8.0 — Absolute Authority
 * Header: Back · My Profile / @username · More — Share removed.
 * UI redesign: premium hero · stats · actions · Listings/Reviews/About.
 * Functionality unchanged — live data only · fail-closed empty states.
 */

"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListingCard } from "@/components/ui/ListingCard";
import { SafeImage } from "@/components/ui/SafeImage";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { useToast } from "@/components/ui/Toast";
import { resolveVerifiedStatus } from "@/lib/master-engine";
import type { PublicSellerProfile } from "@/lib/profile/public";
import { resolvePublicProfileHref } from "@/lib/profile/public-profile-href";
import type { Review } from "@/lib/reviews/types";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildRatingDistribution,
  RATING_DISTRIBUTION_LADDER,
} from "@/lib/reviews/rating-distribution";
import { SELLER_RATING_RULES } from "@/lib/reviews/seller-rating-system-v1";
import { FOLLOW_RATING_BADGE_STAR_COLOR } from "@/lib/reviews/follow-rating-badge-spec-v1";
import { FollowButton, type FollowCounts } from "@/components/follow/FollowButton";
import { CanonicalProfileAvatar, type CanonicalProfileAvatarHandle } from "@/features/profile/components/CanonicalProfileAvatar";
import { ProfileCommandCentreButton } from "@/features/profile/components/ProfileCommandCentreButton";
import type { PublicTrustSummary } from "@/lib/trust/types";
import type { ProfileCommandCentreEntry } from "@/lib/profile/command-centre-entry-v1";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { storeListingCardAttr } from "@/lib/store/store-listing-card-premium-v1";
import { HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE } from "@/lib/listings/holiday-mode-visibility-v1";
import "@/styles/rovexo/view-profile-v1.css";

export const MY_PROFILE_VERSION = "v8.0" as const;
export const MY_PROFILE_DOM = "v8.0-your-store" as const;

type MainTab = "store" | "reviews" | "about";
type StoreFilter = "active" | "sold" | "drafts";
type ReviewFilter = "all" | "members" | "automatic";

export type ViewProfilePageProps = {
  profile: PublicSellerProfile;
  reviews: Review[];
  trustSummary: PublicTrustSummary;
  isOwnProfile: boolean;
  jsonLdScript?: string;
  /** Fail-closed → empty Your Store (no Retry / Home / technical UI). */
  loadFailed?: boolean;
  /** Own-profile Admin / Super Admin CTA only — null = do not render. */
  commandCentre?: ProfileCommandCentreEntry | null;
};

const CREATE_LISTING_HREF = "/sell";

function profilePublicUrl(username: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/user/${username}`;
  }
  return `https://www.rovexo.co.uk/user/${username}`;
}

function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function StarRow({ value }: { value: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <span className="vp-v1__stars" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn("vp-v1__star", i < filled && "vp-v1__star--on")}
          style={i < filled ? { color: FOLLOW_RATING_BADGE_STAR_COLOR } : undefined}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StorefrontIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 7.5 5.5 4h13L21 7.5H3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21v-6h6v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ViewProfilePage({
  profile,
  reviews,
  trustSummary,
  isOwnProfile,
  jsonLdScript,
  loadFailed = false,
  commandCentre = null,
}: ViewProfilePageProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [tab, setTab] = useState<MainTab>("store");
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("active");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveAvatarUrl, setLiveAvatarUrl] = useState(profile.avatarUrl);
  const avatarRef = useRef<CanonicalProfileAvatarHandle>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Scam or fraud");
  const [reportMessage, setReportMessage] = useState("");
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [followingCount, setFollowingCount] = useState(profile.followingCount);
  const [countProfileId, setCountProfileId] = useState(profile.id);

  if (profile.id !== countProfileId) {
    setCountProfileId(profile.id);
    setFollowerCount(profile.followerCount);
    setFollowingCount(profile.followingCount);
    setLiveAvatarUrl(profile.avatarUrl);
  }

  const openAvatarSheet = useCallback(() => {
    setMenuOpen(false);
    avatarRef.current?.openSheet();
  }, []);

  const onAvatarUpdated = useCallback(
    (next: string | null) => {
      setLiveAvatarUrl(next);
      pushToast({
        title: next ? "Photo updated." : "Photo removed.",
        variant: "success",
      });
      router.refresh();
    },
    [pushToast, router],
  );

  const onFollowCountsChange = useCallback((counts: FollowCounts) => {
    setFollowerCount(counts.followerCount);
    setFollowingCount(counts.followingCount);
  }, []);
  const [isPending, startTransition] = useTransition();

  const phoneVerified = trustSummary.verifications.includes("phone");
  const stripeVerified = trustSummary.verifications.includes("payment");
  const googleVerified = trustSummary.badges.some((b) => /google/i.test(b));
  const { showBadge: showVerifiedBadge } = resolveVerifiedStatus({
    isRovexoVerified: profile.emailVerified,
  });

  // Fail-closed: any load failure → empty store lists (never error chrome)
  const activeListings = loadFailed ? [] : profile.listings;
  const soldListings = loadFailed ? [] : profile.soldListings;
  const draftListings = loadFailed || !isOwnProfile ? [] : profile.draftListings;

  const storeItems =
    storeFilter === "active"
      ? activeListings
      : storeFilter === "sold"
        ? soldListings
        : draftListings;

  const storeState: "empty" | "functional" =
    storeItems.length > 0 ? "functional" : "empty";

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "automatic") {
      return reviews.filter((r) => !r.comment?.trim());
    }
    if (reviewFilter === "members") {
      return reviews.filter((r) => Boolean(r.comment?.trim()));
    }
    return reviews;
  }, [reviews, reviewFilter]);

  const reviewCount = Math.max(0, profile.reviewCount, reviews.length);
  const averageRating =
    profile.reviewCount > 0 && profile.rating > 0
      ? profile.rating
      : reviews.length > 0
        ? reviews.reduce((total, row) => total + Number(row.rating), 0) / reviews.length
        : 0;
  const ratingDistribution = useMemo(
    () => buildRatingDistribution(reviews),
    [reviews],
  );

  function copyProfileLink() {
    setMenuOpen(false);
    const url = profilePublicUrl(profile.username);
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(url);
        pushToast({ title: "Profile link copied.", variant: "success" });
      } catch {
        pushToast({ title: "Unable to copy link.", variant: "error" });
      }
    });
  }

  function openReport() {
    setMenuOpen(false);
    setReportOpen(true);
  }

  function blockUser() {
    setMenuOpen(false);
    startTransition(async () => {
      try {
        const response = await fetch("/api/account/blocked-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: profile.username }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to block user.", variant: "error" });
          return;
        }
        pushToast({ title: "User blocked.", variant: "success" });
      } catch {
        pushToast({ title: "Unable to block user.", variant: "error" });
      }
    });
  }

  function messageUser() {
    setMenuOpen(false);
    const productSlug = activeListings[0]?.slug;
    if (!productSlug) {
      pushToast({ title: "Messaging is temporarily unavailable.", variant: "error" });
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productSlug }),
        });
        const payload = (await response.json().catch(() => null)) as {
          href?: string;
        } | null;
        if (!response.ok || !payload?.href) {
          pushToast({ title: "Messaging is temporarily unavailable.", variant: "error" });
          return;
        }
        router.push(payload.href);
      } catch {
        pushToast({ title: "Messaging is temporarily unavailable.", variant: "error" });
      }
    });
  }

  function submitReport() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/users/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: profile.id,
            reason: reportReason,
            message: reportMessage.trim() || undefined,
          }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to submit report.", variant: "error" });
          return;
        }
        pushToast({ title: "Report submitted.", variant: "success" });
        setReportOpen(false);
        setReportMessage("");
      } catch {
        pushToast({ title: "Unable to submit report.", variant: "error" });
      }
    });
  }

  return (
    <BetaAppShell bottomNavTab={isOwnProfile ? "account" : undefined}>
      {jsonLdScript ? (
        <JsonLdScript id="jsonld-features-profile-components-ViewProfilePage-tsx" data={jsonLdScript} />
      ) : null}

      <div
        className="vp-v1"
        data-view-profile={MY_PROFILE_DOM}
        data-my-profile={MY_PROFILE_VERSION}
        data-full-width-engine="v1.0"
        data-master-full-width="v1.0-master-fw"
        data-fail-closed="empty-only"
      >
        <CanonicalPageHeader
          title={isOwnProfile ? "My Profile" : `@${profile.username}`}
          backHref={isOwnProfile ? "/account" : "/search"}
        />

        {menuOpen ? (
          <div className="vp-v1__menu-sheet" role="dialog" aria-label="More">
            <button
              type="button"
              className="vp-v1__menu-backdrop"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="vp-v1__menu-panel">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/account/edit-profile");
                    }}
                  >
                    <span>Edit Profile</span>
                    <span aria-hidden>›</span>
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={openAvatarSheet}
                  >
                    <span>Change Profile Picture</span>
                    <span aria-hidden>›</span>
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/account/profile/bio");
                    }}
                  >
                    <span>Add / Edit Bio</span>
                    <span aria-hidden>›</span>
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={() => void copyProfileLink()}
                  >
                    <span>Copy Profile Link</span>
                    <span aria-hidden>›</span>
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/settings");
                    }}
                  >
                    <span>Settings</span>
                    <span aria-hidden>›</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="vp-v1__menu-item"
                    disabled={isPending}
                    onClick={messageUser}
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={() => void copyProfileLink()}
                  >
                    <span>Copy Profile Link</span>
                    <span aria-hidden>›</span>
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav vp-v1__menu-item--danger"
                    disabled={isPending}
                    onClick={blockUser}
                  >
                    <span>Block User</span>
                    <span aria-hidden>›</span>
                  </button>
                  <button
                    type="button"
                    className="vp-v1__menu-item vp-v1__menu-item--nav"
                    onClick={openReport}
                  >
                    <span>Report User</span>
                    <span aria-hidden>›</span>
                  </button>
                </>
              )}
              <button type="button" className="vp-v1__menu-item" onClick={() => setMenuOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <HubPageMain className="vp-v1__main">
          {profile.coverUrl ? (
            <div className="vp-v1__cover">
              <SafeImage src={profile.coverUrl} alt="" fill className="object-cover" sizes="100vw" />
            </div>
          ) : null}

          <section className="vp-v1__hero">
            <div className="vp-v1__hero-top">
              <div className="vp-v1__avatar-wrap">
                {isOwnProfile ? (
                  <CanonicalProfileAvatar
                    ref={avatarRef}
                    name={profile.username}
                    avatarUrl={liveAvatarUrl}
                    onUpdated={onAvatarUpdated}
                  />
                ) : (
                  <Avatar
                    src={profile.avatarUrl}
                    alt={profile.username}
                    name={profile.username}
                    size="xl"
                    className="vp-v1__avatar"
                  />
                )}
              </div>

              <div className="vp-v1__hero-copy">
                <h1 className="vp-v1__name">
                  <span className="vp-v1__name-text">{profile.username}</span>
                  {showVerifiedBadge ? (
                    <VerifiedBadge
                      className="vp-v1__verified-badge"
                      title="Verified Seller"
                      size={16}
                    />
                  ) : null}
                </h1>
                <p className="vp-v1__username">@{profile.username}</p>

                {profile.badgeLabel ? (
                  <p className="vp-v1__badge-chip" data-seller-badge="xlvi">
                    <span className="vp-v1__badge-diamond" aria-hidden>
                      ◆
                    </span>
                    {profile.badgeLabel}
                  </p>
                ) : null}

                <div className="vp-v1__rating-line" aria-label={`Rating ${averageRating.toFixed(1)}`}>
                  <StarRow value={averageRating} />
                  <span className="vp-v1__rating-line-text">
                    {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}{" "}
                    <span className="vp-v1__rating-count">
                      ({reviewCount.toLocaleString("en-GB")} Reviews)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="vp-v1__stats" aria-label="Profile stats">
              <Link
                href={`/user/${encodeURIComponent(profile.username)}/followers`}
                className="vp-v1__stat vp-v1__stat--link"
                data-follow-stat="followers"
              >
                <strong data-testid="profile-follower-count">
                  {followerCount.toLocaleString("en-GB")}
                </strong>
                <span>Followers</span>
              </Link>
              <Link
                href={`/user/${encodeURIComponent(profile.username)}/following`}
                className="vp-v1__stat vp-v1__stat--link"
                data-follow-stat="following"
              >
                <strong data-testid="profile-following-count">
                  {followingCount.toLocaleString("en-GB")}
                </strong>
                <span>Following</span>
              </Link>
              <div className="vp-v1__stat">
                <strong>{profile.listingCount}</strong>
                <span>Listings</span>
              </div>
            </div>

            <div
              className={cn("vp-v1__actions", !isOwnProfile && "vp-v1__actions--single")}
            >
              {isOwnProfile ? (
                <Link
                  href="/account/edit-profile"
                  className={cn("vp-v1__action-btn", "vp-v1__action-btn--primary", focusRing)}
                >
                  Edit Profile
                </Link>
              ) : (
                <>
                  <FollowButton
                    userId={profile.id}
                    initialFollowing={profile.isFollowing}
                    followerCount={followerCount}
                    followingCount={followingCount}
                    onCountsChange={onFollowCountsChange}
                    className="vp-v1__follow-btn"
                  />
                  <button
                    type="button"
                    className={cn("vp-v1__action-btn", "vp-v1__action-btn--secondary", focusRing)}
                    disabled={isPending}
                    onClick={messageUser}
                  >
                    <MessageBubbleIcon />
                    Message
                  </button>
                </>
              )}
              {isOwnProfile ? (
                <Link
                  href="/account/profile/bio"
                  className={cn("vp-v1__action-btn", "vp-v1__action-btn--secondary", focusRing)}
                >
                  Edit Bio
                </Link>
              ) : null}
              <button
                type="button"
                className={cn("vp-v1__menu-btn", focusRing)}
                aria-label="More"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                ···
              </button>
            </div>

            {isOwnProfile && commandCentre ? (
              <ProfileCommandCentreButton entry={commandCentre} />
            ) : null}
          </section>

          <nav className="vp-v1__tabs" aria-label="Profile sections">
            {(
              [
                ["store", "Listings"],
                ["reviews", "Reviews"],
                ["about", "About"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={cn("vp-v1__tab", tab === id && "vp-v1__tab--active")}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === "store" ? (
            <section
              className="vp-v1__section"
              aria-label="Listings"
              data-your-store={storeState}
              data-your-store-filter={storeFilter}
            >
              <div className="vp-v1__section-head">
                <h2 className="vp-v1__section-title">
                  {storeFilter === "active"
                    ? `Active listings (${activeListings.length})`
                    : storeFilter === "sold"
                      ? `Sold listings (${soldListings.length})`
                      : `Drafts (${isOwnProfile ? draftListings.length : 0})`}
                </h2>
                {isOwnProfile && storeFilter === "active" ? (
                  <Link href="/seller/listings" className="vp-v1__section-link">
                    View all
                  </Link>
                ) : null}
              </div>

              <div className="vp-v1__chips" role="tablist" aria-label="Store status">
                {(
                  [
                    ["active", `Active (${activeListings.length})`],
                    ["sold", `Sold (${soldListings.length})`],
                    ["drafts", `Drafts (${isOwnProfile ? draftListings.length : 0})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={storeFilter === id}
                    className={cn("vp-v1__chip", storeFilter === id && "vp-v1__chip--active")}
                    onClick={() => setStoreFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {storeState === "functional" ? (
                <div
                  className="rx-listing-grid vp-v1__grid"
                  {...storeListingCardAttr(isOwnProfile ? "store" : "visit")}
                >
                  {storeItems.map((product) => (
                    <ListingCard
                      key={product.id}
                      product={product}
                      variant="grid"
                      {...HP_CANONICAL_LISTING_PROPS}
                      surface="store"
                      showStatusBadge={storeFilter === "sold"}
                      statusBadgeLabel="SOLD"
                    />
                  ))}
                </div>
              ) : (
                <YourStoreEmptyState
                  showCreateCta={isOwnProfile}
                  holidayMode={!isOwnProfile && profile.holidayModeEnabled}
                />
              )}
            </section>
          ) : null}

          {tab === "reviews" ? (
            <section className="vp-v1__section" aria-label="Reviews">
              <div className="vp-v1__reviews-summary">
                <p className="vp-v1__reviews-avg">
                  {reviewCount > 0 ? averageRating.toFixed(1) : "—"}
                </p>
                <StarRow value={reviewCount > 0 ? averageRating : 0} />
                <p className="vp-v1__reviews-count">{reviewCount} reviews</p>
              </div>

              {reviewCount > 0 ? (
                <ul className="vp-v1__rating-dist" aria-label="Rating distribution">
                  {RATING_DISTRIBUTION_LADDER.map(({ stars, key }) => {
                    const count = ratingDistribution[key];
                    const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                    return (
                      <li key={key} className="vp-v1__rating-dist-row">
                        <span className="vp-v1__rating-dist-label">{stars}★</span>
                        <span className="vp-v1__rating-dist-track" aria-hidden>
                          <span
                            className="vp-v1__rating-dist-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="vp-v1__rating-dist-count">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div className="vp-v1__chips" role="tablist" aria-label="Review filters">
                {(
                  [
                    ["all", "All"],
                    ["members", "Members"],
                    ["automatic", "Automatic"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={cn("vp-v1__chip", reviewFilter === id && "vp-v1__chip--active")}
                    onClick={() => setReviewFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredReviews.length > 0 ? (
                <ul className="vp-v1__review-list">
                  {filteredReviews.map((review) => (
                    <li key={review.id} className="vp-v1__review">
                      <div className="vp-v1__review-head">
                        <StarRow value={review.rating} />
                        {(review.verifiedPurchase ?? true) ? (
                          <span className="vp-v1__verified-purchase">
                            {SELLER_RATING_RULES.verifiedPurchaseLabel}
                          </span>
                        ) : null}
                      </div>
                      {review.comment ? (
                        <p className="vp-v1__review-text">{review.comment}</p>
                      ) : (
                        <p className="vp-v1__review-text vp-v1__review-text--muted">
                          Automatic review
                        </p>
                      )}
                      <p className="vp-v1__review-meta">
                        {(() => {
                          const href = resolvePublicProfileHref(review.reviewerUsername);
                          const label = review.reviewerUsername?.trim() || "Member";
                          return href ? (
                            <Link href={href} className="vp-v1__review-author">
                              {label}
                            </Link>
                          ) : (
                            <span>{label}</span>
                          );
                        })()}
                        <span aria-hidden>·</span>
                        <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  premiumIllustrationId="reviews"
                  title="No reviews yet"
                  description="Reviews from buyers will appear here after completed orders."
                />
              )}
            </section>
          ) : null}

          {tab === "about" ? (
            <section className="vp-v1__section vp-v1__about" aria-label="About">
              <h2 className="vp-v1__about-title">Bio</h2>
              {profile.bio?.trim() ? (
                <div className="vp-v1__bio">
                  <p className="vp-v1__bio-text">{profile.bio.trim()}</p>
                  {isOwnProfile ? (
                    <Link href="/account/profile/bio" className="vp-v1__bio-edit">
                      Edit Bio
                    </Link>
                  ) : null}
                </div>
              ) : isOwnProfile ? (
                <div className="vp-v1__bio-empty-card" data-about-bio="empty">
                  <p className="vp-v1__bio-empty-title">Add your bio.</p>
                  <p className="vp-v1__bio-empty-body">
                    Tell buyers a little more about yourself.
                  </p>
                  <Link href="/account/profile/bio" className="vp-v1__add-bio">
                    + Add Bio
                  </Link>
                </div>
              ) : (
                <p className="vp-v1__bio-empty">No bio yet.</p>
              )}

              <h2 className="vp-v1__about-title">Seller information</h2>
              <ul className="vp-v1__about-list">
                <li className="vp-v1__about-row">
                  <span>Join date</span>
                  <strong>{profile.memberSince}</strong>
                </li>
                <li className="vp-v1__about-row">
                  <span>Rating</span>
                  <strong>
                    {averageRating > 0 ? `${averageRating.toFixed(1)} ★` : "0.0 ★"}
                  </strong>
                </li>
                <li className="vp-v1__about-row">
                  <span>Reviews</span>
                  <strong>{reviewCount}</strong>
                </li>
                {showVerifiedBadge ? (
                  <li className="vp-v1__about-row vp-v1__about-row--on">
                    <span>Verified Seller</span>
                    <strong>
                      <VerifiedBadge className="vp-v1__verified-badge" />
                    </strong>
                  </li>
                ) : null}
                {profile.lastSeenLabel ? (
                  <li className="vp-v1__about-row">
                    <span>Last active</span>
                    <strong>{profile.lastSeenLabel}</strong>
                  </li>
                ) : null}
              </ul>

              <h2 className="vp-v1__about-title">Profile details</h2>
              <ul className="vp-v1__about-list">
                {profile.country ? (
                  <li className="vp-v1__about-row">
                    <span>Country</span>
                    <strong>{profile.country}</strong>
                  </li>
                ) : null}
                <li className={cn("vp-v1__about-row", profile.emailVerified && "vp-v1__about-row--on")}>
                  Email verified
                </li>
                <li className={cn("vp-v1__about-row", googleVerified && "vp-v1__about-row--on")}>
                  Google verified
                </li>
                <li className={cn("vp-v1__about-row", phoneVerified && "vp-v1__about-row--on")}>
                  Phone verified
                </li>
                <li className={cn("vp-v1__about-row", stripeVerified && "vp-v1__about-row--on")}>
                  Stripe verified
                </li>
              </ul>
            </section>
          ) : null}
        </HubPageMain>

        {reportOpen ? (
          <div className="vp-v1__menu-sheet" role="dialog" aria-label="Report user">
            <button
              type="button"
              className="vp-v1__menu-backdrop"
              aria-label="Close"
              onClick={() => setReportOpen(false)}
            />
            <div className="vp-v1__menu-panel vp-v1__report">
              <p className="vp-v1__report-title">Report @{profile.username}</p>
              <label className="vp-v1__report-label">
                Reason
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="vp-v1__report-select"
                >
                  {[
                    "Scam or fraud",
                    "Counterfeit sales",
                    "Harassment",
                    "Unsafe or illegal activity",
                    "Other",
                  ].map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>
              <label className="vp-v1__report-label">
                Details (optional)
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="vp-v1__report-textarea"
                />
              </label>
              <button
                type="button"
                className="vp-v1__menu-item vp-v1__menu-item--primary"
                disabled={isPending}
                onClick={submitReport}
              >
                Submit report
              </button>
              <button type="button" className="vp-v1__menu-item" onClick={() => setReportOpen(false)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </BetaAppShell>
  );
}

function YourStoreEmptyState({
  showCreateCta,
  holidayMode = false,
}: {
  showCreateCta: boolean;
  holidayMode?: boolean;
}) {
  if (holidayMode) {
    return (
      <div className="vp-v1__store-empty" data-your-store-empty="holiday-mode">
        <div className="vp-v1__store-empty-icon" aria-hidden>
          <StorefrontIcon />
        </div>
        <p className="vp-v1__store-empty-title">{HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div className="vp-v1__store-empty" data-your-store-empty="v8.0">
      <div className="vp-v1__store-empty-icon" aria-hidden>
        <StorefrontIcon />
      </div>
      <p className="vp-v1__store-empty-title">You haven&apos;t listed any items yet.</p>
      <p className="vp-v1__store-empty-body">
        Start selling on ROVEXO
        <br />
        and reach thousands of buyers.
      </p>
      {showCreateCta ? (
        <Link href={CREATE_LISTING_HREF} className="vp-v1__create-listing" data-create-listing="v8.0">
          <span className="vp-v1__create-listing-icon" aria-hidden>
            +
          </span>
          Create Listing
        </Link>
      ) : null}
    </div>
  );
}

function MessageBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H12l-4.5 3V16.5H5A1.5 1.5 0 0 1 3.5 15V8A1.5 1.5 0 0 1 5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
