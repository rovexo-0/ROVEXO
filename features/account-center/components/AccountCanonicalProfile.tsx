"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { resolveVerifiedStatus } from "@/lib/master-engine";
import {
  formatAccountProfileRating,
  isNewMemberProfile,
} from "@/lib/account-center/format-profile-rating";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";

type AccountCanonicalProfileProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
};

/**
 * Profile header — Avatar · username · rating · View Profile.
 * Social Followers permanently removed (CEO Social System Removal).
 */
export function AccountCanonicalProfile({ profile, snapshot }: AccountCanonicalProfileProps) {
  const username = profile.username?.trim() || profile.fullName || "Username";
  const href = profile.username?.trim()
    ? `/user/${encodeURIComponent(profile.username.trim())}`
    : "/account/profile";
  const newMember = isNewMemberProfile(snapshot.reviewCount);
  const ratingLabel = formatAccountProfileRating(snapshot.rating, snapshot.reviewCount);
  const ratingValue = newMember ? "0.0" : ratingLabel.slice(0, ratingLabel.indexOf(" ★"));
  const reviewCount = Math.max(0, snapshot.reviewCount);
  const { showBadge } = resolveVerifiedStatus({ isRovexoVerified: profile.verified });

  return (
    <section className="ac-canonical__profile" aria-label="Profile">
      <Link
        href={href}
        className={cn("ac-canonical__identity ac-canonical__identity--full", focusRing)}
        data-profile-header="v1.0"
      >
        <span className="ac-canonical__avatar-wrap">
          <Avatar
            src={profile.avatarUrl}
            alt={username}
            name={username}
            size="lg"
            className="ac-canonical__avatar"
          />
        </span>
        <div className="ac-canonical__identity-copy">
          <h1 className="ac-canonical__name">
            {username}
            {showBadge ? (
              <VerifiedBadge className="ac-canonical__verified-badge" />
            ) : null}
          </h1>
          <p className="ac-canonical__rating" data-rating-ssot={ratingLabel}>
            <span className="ac-canonical__rating-value">{ratingValue}</span>
            <span className="ac-canonical__rating-star" aria-hidden>
              {" "}
              ★{" "}
            </span>
            <span className="ac-canonical__rating-count">({reviewCount})</span>
          </p>
        </div>
        <span className="ac-canonical__profile-trailing">
          <span className="ac-canonical__view-profile">View Profile</span>
          <span className="ac-canonical__profile-chevron" aria-hidden>
            <ChevronRightLineIcon />
          </span>
        </span>
      </Link>
    </section>
  );
}
