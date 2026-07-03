"use client";

import { useState } from "react";
import Image from "next/image";
import { AccountAvatarSheet } from "@/features/account-center/components/AccountQuickAccessGrid";
import { AccountTrustAnalytics } from "@/features/account-center/components/AccountTrustAnalytics";
import { AccountKpiRow } from "@/features/account-center/components/AccountKpiRow";
import { PremiumAccountIcon } from "@/components/icons/PremiumAccountIcon";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import { buildAccountProfileView, formatCount } from "@/lib/account-center/derive";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountProfileCardProps = {
  profile: UserProfile;
  trustData: TrustDashboardData;
};

function CameraGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden width={16} height={16}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 7.5h2l1-2h7l1 2h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
      />
      <circle cx="10" cy="11" r="2.5" />
    </svg>
  );
}

function VerifiedGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden width={16} height={16}>
      <path d="M10 1.5l2.09 1.52 2.58-.02 .79 2.45 2.09 1.5-.8 2.45.8 2.45-2.09 1.5-.79 2.45-2.58-.02L10 18.5l-2.09-1.52-2.58.02-.79-2.45L2.45 13l.8-2.45-.8-2.45 2.09-1.5.79-2.45 2.58.02L10 1.5z" />
      <path d="M8.6 12.3 6.4 10.1l1.06-1.06 1.14 1.14 3-3L12.66 8.2 8.6 12.3z" fill="#fff" />
    </svg>
  );
}

function RatingStars({ rounded }: { rounded: number }) {
  return (
    <span className="ac2-profile__stars" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rounded ? "is-filled" : undefined}>
          ★
        </span>
      ))}
    </span>
  );
}

export function AccountProfileCard({ profile, trustData }: AccountProfileCardProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const view = buildAccountProfileView(profile, trustData);

  const initials = profile.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <section className="ac2-profile" aria-labelledby="ac2-profile-name">
        <div className="ac2-profile__identity">
          <div className="ac2-profile__avatar-wrap">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn("ac2-profile__avatar", focusRing)}
              aria-label="Change profile photo"
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={120} height={120} className="h-full w-full object-cover" />
              ) : (
                <span className="ac2-profile__initials">{initials}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn("ac2-profile__camera", focusRing)}
              aria-label="Change photo"
            >
              <CameraGlyph />
            </button>
          </div>

          <h2 id="ac2-profile-name" className="ac2-profile__name">
            {profile.fullName}
          </h2>

          <div className="ac2-profile__handle">
            <span className="ac2-profile__username">@{profile.username}</span>
            {profile.isSuperAdmin ? <SuperAdminBadge /> : null}
            {profile.verified ? (
              <span className="ac2-profile__verified">
                <VerifiedGlyph />
                Verified
              </span>
            ) : null}
          </div>

          <div className="ac2-profile__rating-row">
            <RatingStars rounded={view.ratingRounded} />
            <span className="ac2-profile__rating">{view.rating.toFixed(1)}</span>
            <span className="ac2-profile__followers">
              <PremiumAccountIcon icon="eye" size={20} />
              <strong>{formatCount(view.followers)}</strong> Followers
            </span>
          </div>

          <p className="ac2-profile__since">
            <PremiumAccountIcon icon="calendar" size={18} />
            Member since {profile.memberSince}
          </p>
        </div>

        <AccountTrustAnalytics view={view} />
        <AccountKpiRow trustData={trustData} />
      </section>

      <AccountAvatarSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        name={profile.fullName}
        avatarUrl={avatarUrl}
        onUpdated={setAvatarUrl}
      />
    </>
  );
}
