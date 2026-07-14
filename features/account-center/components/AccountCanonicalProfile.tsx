"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatAccountProfileRating } from "@/lib/account-center/format-profile-rating";
import { AccountSellerLevelBadge } from "@/features/account-center/components/AccountSellerLevelBadge";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";

type AccountCanonicalProfileProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
  sellerPerformance: AccountSellerPerformanceSummary;
};

function formatMemberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function AccountCanonicalProfile({
  profile,
  snapshot,
  sellerPerformance,
}: AccountCanonicalProfileProps) {
  const ratingLine = formatAccountProfileRating(snapshot.rating, snapshot.reviewCount);
  const publicHref = profile.username ? `/user/${profile.username}` : "/account/profile";
  const profileIncomplete =
    !profile.fullName.trim() || !profile.username.trim() || !profile.avatarUrl;

  return (
    <section className="ac-v1__profile-card" aria-label="Profile" data-account-profile-card="v1.0">
      <div className="ac-v1__profile-main">
        <Avatar
          src={profile.avatarUrl}
          alt={profile.fullName}
          name={profile.fullName}
          size="xl"
          className="ac-v1__profile-avatar"
        />
        <div className="ac-v1__profile-copy">
          <h1 className="ac-v1__profile-name">{profile.fullName || "Your profile"}</h1>
          {profile.username ? (
            <p className="ac-v1__profile-username">@{profile.username}</p>
          ) : null}
          <p className="ac-v1__profile-meta">Member since {formatMemberSince(profile.memberSince)}</p>
          <div className="ac-v1__profile-badges">
            <AccountSellerLevelBadge level={sellerPerformance.level} />
            <span className="ac-v1__profile-rating" aria-label={`Rating ${ratingLine}`}>
              {ratingLine}
            </span>
          </div>
        </div>
      </div>

      {profileIncomplete ? (
        <p className="ac-v1__profile-note" role="status">
          Complete your profile to help buyers recognise you.
        </p>
      ) : null}

      <div className="ac-v1__profile-actions">
        <Link href={publicHref} className={cn("ac-v1__profile-btn", focusRing)}>
          View Public Profile
        </Link>
        <Link href="/account/profile" className={cn("ac-v1__profile-btn", focusRing)}>
          Edit Profile
        </Link>
      </div>
    </section>
  );
}
