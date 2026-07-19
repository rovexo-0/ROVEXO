"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedIcon } from "@/features/product-detail/icons";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { SettingsLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type ProfileCardProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
  settingsHref?: string;
};

export function ProfileCard({
  profile,
  trustData,
  settingsHref = "/account/settings",
}: ProfileCardProps) {
  const fill = trustData
    ? Math.max(0, Math.min(100, trustData.score.score))
    : null;

  return (
    <section className="rx-dash-profile-card" aria-labelledby="dash-profile-name">
      <div className="rx-dash-profile-card__actions">
        <NotificationBell className="rx-dash-profile-card__action" />
        <Link
          href={settingsHref}
          aria-label="Settings"
          className={cn("rx-dash-profile-card__action", focusRing)}
        >
          <SettingsLineIcon className="h-[26px] w-[26px]" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <Link href="/account/profile" className={cn("rounded-full", focusRing)} aria-label="Edit profile">
          <Avatar
            src={profile.avatarUrl}
            alt={profile.fullName}
            name={profile.fullName}
            size="xl"
            className="ring-4 ring-primary/10"
          />
        </Link>

        {profile.isSuperAdmin ? (
          <SuperAdminBadge />
        ) : profile.verified ? (
          <Badge variant="success" className="gap-1">
            <VerifiedIcon className="h-3.5 w-3.5" />
            Verified seller
          </Badge>
        ) : null}

        <div className="flex w-full flex-col gap-1">
          <h2 id="dash-profile-name" className="truncate text-xl font-semibold text-text-primary">
            {profile.fullName}
          </h2>
          <p className="truncate text-sm text-text-secondary">@{profile.username}</p>
          <p className="text-xs text-text-muted">Member since {profile.memberSince}</p>
        </div>

        {trustData ? (
          <Link
            href="/trust"
            className={cn("rx-dash-trust-card w-full text-left", focusRing)}
            aria-label="View Trust Centre"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Trust Score
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
                  {trustData.score.score}
                </p>
                <p className="mt-0.5 text-sm capitalize text-text-secondary">
                  {trustData.score.tier} trust
                </p>
              </div>
              {trustData.progress.next ? (
                <p className="text-right text-xs text-text-muted">
                  {trustData.progress.percent}% to {trustData.progress.next}
                </p>
              ) : null}
            </div>
            <div
              className="rx-dash-trust-meter mt-3"
              role="progressbar"
              aria-valuenow={trustData.score.score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="rx-dash-trust-meter__fill" style={{ width: `${fill}%` }} />
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
