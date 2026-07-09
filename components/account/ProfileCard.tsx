"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { TrustAnalytics } from "@/components/account/TrustAnalytics";
import { StatisticsRow } from "@/components/account/StatisticsRow";
import { AccountAvatarSheet } from "@/features/account-center/components/AccountQuickAccessGrid";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import { BusinessBadge } from "@/components/ui/BusinessBadge";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { buildAccountProfileView } from "@/lib/account-center/derive";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type ProfileCardProps = {
  profile: UserProfile;
  trustData: TrustDashboardData;
};

function BellGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14.5 6 9.5z" />
      <path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" />
    </svg>
  );
}

function GearGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z" />
    </svg>
  );
}

/** Notification + settings actions relocated into the profile card (the account
 *  page no longer renders a separate top header). */
function ProfileCardActions() {
  const { unreadCount } = useRealtimeNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <div className="acx-card-profile__toolbar">
      <Link
        href="/notifications"
        aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className={cn("acx-card-profile__btn", focusRing)}
      >
        <BellGlyph />
        {hasUnread ? <span className="acx-card-profile__dot" aria-hidden /> : null}
      </Link>
      <Link href="/account/settings" aria-label="Settings" className={cn("acx-card-profile__btn", focusRing)}>
        <GearGlyph />
      </Link>
    </div>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 7.5h2l1-2h7l1 2h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" />
      <circle cx="10" cy="11" r="2.5" />
    </svg>
  );
}

function VerifiedGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.09 1.52 2.58-.02 .79 2.45 2.09 1.5-.8 2.45.8 2.45-2.09 1.5-.79 2.45-2.58-.02L10 18.5l-2.09-1.52-2.58.02-.79-2.45L2.45 13l.8-2.45-.8-2.45 2.09-1.5.79-2.45 2.58.02L10 1.5z" />
      <path d="M8.6 12.3 6.4 10.1l1.06-1.06 1.14 1.14 3-3L12.66 8.2 8.6 12.3z" fill="#fff" />
    </svg>
  );
}

function RatingStars({ rounded }: { rounded: number }) {
  return (
    <span className="acx-profile__stars" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rounded ? "is-filled" : undefined}>
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * Premium profile card — two columns (profile identity left, trust ring right),
 * with the four-column statistics row spanning the full card width beneath them.
 */
export function ProfileCard({ profile, trustData }: ProfileCardProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? null);
  const normalizedAvatar = normalizeAvatarUrl(avatarUrl);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const avatarBroken = failedAvatar === normalizedAvatar;
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
      <section className="acx-card-profile" aria-labelledby="acx-profile-name">
        <ProfileCardActions />
        <div className="acx-card-profile__cols">
          <div className="acx-profile">
            <div className="acx-profile__avatar-wrap">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn("acx-profile__avatar", focusRing)}
                aria-label="Change profile photo"
              >
                {avatarUrl && !avatarBroken ? (
                  <SafeImage
                    src={normalizedAvatar}
                    alt=""
                    width={140}
                    height={140}
                    fallback="hide"
                    onError={() => setFailedAvatar(normalizedAvatar)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="acx-profile__initials">{initials}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn("acx-profile__camera", focusRing)}
                aria-label="Change photo"
              >
                <CameraGlyph />
              </button>
            </div>

            <h2 id="acx-profile-name" className="acx-profile__name">
              {profile.fullName}
            </h2>

            <div className="acx-profile__handle">
              <span className="acx-profile__username">@{profile.username}</span>
              {profile.isSuperAdmin ? <SuperAdminBadge /> : null}
              {profile.capabilities.hasBusinessVerification ? <BusinessBadge compact /> : null}
              {profile.verified ? (
                <span className="acx-profile__verified">
                  <VerifiedGlyph />
                  Verified
                </span>
              ) : null}
            </div>

            <div className="acx-profile__rating-row">
              <RatingStars rounded={view.ratingRounded} />
              <span className="acx-profile__rating">{view.rating.toFixed(1)}</span>
            </div>

            <p className="acx-profile__since">Member since {profile.memberSince}</p>
          </div>

          <TrustAnalytics score={view.score} sentiment={view.sentiment} />
        </div>

        <StatisticsRow factors={trustData.factors} />
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
