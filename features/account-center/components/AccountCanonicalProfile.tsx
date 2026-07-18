"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatAccountProfileRating } from "@/lib/account-center/format-profile-rating";
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

/**
 * My Account identity header only — Followers live under Selling/Business hubs.
 * Final Master Certification Order: no extra hub chrome beyond the Master Menu.
 */
export function AccountCanonicalProfile({ profile, snapshot }: AccountCanonicalProfileProps) {
  const ratingLine = formatAccountProfileRating(snapshot.rating, snapshot.reviewCount);

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
            <p className="ac-canonical__rating" aria-label={`Rating ${ratingLine}`}>
              {ratingLine}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
