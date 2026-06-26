import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { AccountMobileDashboard } from "@/features/profile/components/AccountMobileDashboard";
import { ProfileDashboardCards } from "@/features/profile/components/ProfileDashboardCards";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfileMenu } from "@/features/profile/components/ProfileMenu";
import { ProfileSignOutButton } from "@/features/profile/components/ProfileSignOutButton";
import { SellerOverviewCards } from "@/features/profile/components/SellerOverviewCards";
import { SettingsIcon } from "@/features/profile/icons";
import { TrustScoreMeter } from "@/features/trust/components/TrustScoreMeter";
import { TrustTierBadge } from "@/features/trust/components/TrustTierBadge";
import { ResponsiveShell } from "@/features/mobile-ui";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";
import Link from "next/link";

type ProfilePageProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function ProfilePage({ profile, trustData }: ProfilePageProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <ResponsiveShell
        mobile={
          <main className="mx-auto w-full max-w-2xl px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
            <AccountMobileDashboard profile={profile} trustData={trustData} />
          </main>
        }
        desktop={
          <>
            <header className="premium-page-header sticky top-0 z-50">
              <div className="flex items-center justify-between gap-ds-3 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
                <h1 className="min-w-0 truncate text-2xl font-bold text-text-primary">My Profile</h1>
                <IconButton href="/account/settings" label="Settings" variant="ghost" size="md">
                  <SettingsIcon className="h-5 w-5" />
                </IconButton>
              </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
              <ProfileHero profile={profile} />

              <ProfileDashboardCards />

              {trustData && (
                <Link href="/trust" className="block">
                  <Card padding="md" interactive>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          Trust Score
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <TrustTierBadge tier={trustData.score.tier} />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-primary">{trustData.score.score}</p>
                    </div>
                    <TrustScoreMeter
                      score={trustData.score.score}
                      tier={trustData.score.tier}
                      progressPercent={trustData.progress.percent}
                      nextTier={trustData.progress.next}
                      showLabel={false}
                      className="mt-3"
                    />
                  </Card>
                </Link>
              )}

              {profile.isSeller && profile.sellerStats && (
                <SellerOverviewCards stats={profile.sellerStats} />
              )}

              <ProfileMenu profile={profile} />

              <ProfileSignOutButton />
            </main>
          </>
        }
      />
    </BetaAppShell>
  );
}
