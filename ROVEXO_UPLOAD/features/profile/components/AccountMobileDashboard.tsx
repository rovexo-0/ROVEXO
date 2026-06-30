"use client";

import Link from "next/link";
import { MobileHubNavigator } from "@/features/mobile-ui";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfileSignOutButton } from "@/features/profile/components/ProfileSignOutButton";
import { SellerOverviewCards } from "@/features/profile/components/SellerOverviewCards";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";
import { NotificationsMenuIcon } from "@/features/profile/icons";
import { IconButton } from "@/components/ui/IconButton";

type AccountMobileDashboardProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

function AccountHeaderActions({ notificationCount }: { notificationCount: number }) {
  return (
    <div className="relative">
      <IconButton href="/notifications" label="Notifications" variant="ghost" size="md">
        <NotificationsMenuIcon className="h-5 w-5" />
      </IconButton>
      {notificationCount > 0 ? (
        <span className="mhub-badge mhub-badge--danger pointer-events-none absolute right-0 top-0" aria-hidden>
          {notificationCount > 9 ? "9+" : notificationCount}
        </span>
      ) : null}
    </div>
  );
}

function TrustCard({ trustData }: { trustData: TrustDashboardData }) {
  const fill = Math.max(0, Math.min(100, trustData.score.score));
  return (
    <section className="mhub-section" aria-labelledby="account-trust-heading">
      <h2 id="account-trust-heading" className="mhub-section__title">
        Trust Score
      </h2>
      <Link href="/trust" className="mhub-card block" aria-label="View Trust Centre">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-text-primary">{trustData.score.score}</p>
            <p className="mt-0.5 text-sm capitalize text-text-secondary">{trustData.score.tier} trust</p>
          </div>
          {trustData.progress.next ? (
            <p className="text-right text-xs text-text-muted">
              {trustData.progress.percent}% to {trustData.progress.next}
            </p>
          ) : null}
        </div>
        <div
          className="mhub-trust-meter mt-3"
          role="progressbar"
          aria-valuenow={trustData.score.score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="mhub-trust-meter__fill" style={{ width: `${fill}%` }} />
        </div>
      </Link>
    </section>
  );
}

export function AccountMobileDashboard({ profile, trustData }: AccountMobileDashboardProps) {
  return (
    <div className="flex flex-col gap-ds-4">
      <header className="rx-page-header sticky top-0 z-50 -mx-ds-4 px-ds-4">
        <div className="flex items-center justify-between gap-ds-3 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <h1 className="min-w-0 truncate text-2xl font-bold text-text-primary">Account</h1>
          <AccountHeaderActions notificationCount={profile.unreadNotifications} />
        </div>
      </header>

      <section aria-label="Profile header">
        <ProfileHero profile={profile} variant="dashboard" />
      </section>

      {trustData ? <TrustCard trustData={trustData} /> : null}

      {profile.isSeller && profile.sellerStats ? (
        <SellerOverviewCards stats={profile.sellerStats} layout="mobile-dashboard" />
      ) : null}

      <MobileHubNavigator
        profile={profile}
        sectionTitle="Explore ROVEXO"
        badgeSeed={{
          isSeller: profile.isSeller,
          messages: profile.unreadMessages,
          notifications: profile.unreadNotifications,
        }}
      />

      <ProfileSignOutButton />
    </div>
  );
}
