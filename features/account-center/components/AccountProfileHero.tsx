"use client";

import { useState } from "react";
import Image from "next/image";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import { AccountAvatarSheet } from "@/features/account-center/components/AccountQuickAccessGrid";
import { AccountTrustCard } from "@/features/account-center/components/AccountTrustCard";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountProfileHeroProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M5 1.5V4M11 1.5V4M2 7h12" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 7.5h2l1-2h7l1 2h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
      />
      <circle cx="10" cy="11" r="2.5" />
    </svg>
  );
}

function profileBadges(profile: UserProfile): string[] {
  const badges: string[] = [];
  if (profile.isSeller && profile.sellerStats && profile.sellerStats.sales >= 10) {
    badges.push("Top Seller");
  }
  if (profile.accountType === "business") badges.push("Business Verified");
  if (profile.isSuperAdmin) badges.push("Enterprise");
  return badges;
}

export function AccountProfileHero({ profile, trustData }: AccountProfileHeroProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const badges = profileBadges(profile);
  const initials = profile.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <section className="account-center-hero" aria-labelledby="account-center-profile-name">
        <div className="account-center-hero__wave" aria-hidden />
        <div className="account-center-hero__content">
          <div className="account-center-hero__identity">
            <div className="account-center-hero__avatar-wrap">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn("account-center-hero__avatar", focusRing)}
                aria-label="Change profile photo"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" width={120} height={120} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-text-muted">
                    {initials}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn("account-center-hero__camera", focusRing)}
                aria-label="Change photo"
              >
                <CameraIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="account-center-hero__meta">
              <h2 id="account-center-profile-name" className="account-center-hero__name">
                {profile.fullName}
              </h2>
              <p className="account-center-hero__username">@{profile.username}</p>
              <p className="account-center-hero__since">
                <CalendarIcon className="h-4 w-4" />
                Member since {profile.memberSince}
              </p>
            </div>
          </div>

          <div className="account-center-hero__badges">
            {profile.isSuperAdmin ? <SuperAdminBadge /> : null}
            {profile.verified ? (
              <span className="account-center-hero__badge account-center-hero__badge--verified">
                Verified
              </span>
            ) : null}
            {badges.map((badge) => (
              <span key={badge} className="account-center-hero__badge">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {trustData ? <AccountTrustCard trustData={trustData} /> : null}
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
