"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatCount } from "@/lib/account-center/derive";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";

type AccountCanonicalProfileProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
};

function formatMemberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatRatingLine(rating: number, reviewCount: number): string {
  if (reviewCount <= 0) return "⭐ —";
  return `⭐ ${rating.toFixed(1)} (${formatCount(reviewCount)})`;
}

export function AccountCanonicalProfile({ profile, snapshot }: AccountCanonicalProfileProps) {
  return (
    <section className="ac-canonical__profile" aria-label="Profile">
      <div className="ac-canonical__profile-top">
        <Link href="/account/profile" className={cn("ac-canonical__identity", focusRing)}>
          <span className="ac-canonical__avatar-wrap">
            <Avatar
              src={profile.avatarUrl}
              alt={profile.fullName}
              name={profile.fullName}
              size="lg"
              className="ac-canonical__avatar"
            />
          </span>
          <div className="ac-canonical__identity-copy">
            <div className="ac-canonical__name-row">
              <h1 className="ac-canonical__name">{profile.fullName}</h1>
              {profile.verified ? <span className="ac-canonical__verified-pill">Verified</span> : null}
            </div>
            <p className="ac-canonical__meta">Member since {formatMemberSince(profile.memberSince)}</p>
            <p className="ac-canonical__rating" aria-label={`Rating ${formatRatingLine(snapshot.rating, snapshot.reviewCount)}`}>
              {formatRatingLine(snapshot.rating, snapshot.reviewCount)}
            </p>
          </div>
        </Link>

        <Link
          href="/account/followers"
          className={cn("ac-canonical__followers-row", focusRing)}
          aria-label={`${formatCount(snapshot.followers)} followers`}
        >
          <Users className="ac-canonical__followers-icon" strokeWidth={1.75} aria-hidden />
          <span className="ac-canonical__followers-count">{formatCount(snapshot.followers)}</span>
          <span className="ac-canonical__followers-label">Followers</span>
          <ChevronRight className="ac-canonical__followers-chevron" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
