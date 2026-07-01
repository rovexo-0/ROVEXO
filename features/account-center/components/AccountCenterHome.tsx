"use client";

import { AccountCenterHeader } from "@/features/account-center/components/AccountCenterHeader";
import { AccountProfileHero } from "@/features/account-center/components/AccountProfileHero";
import { AccountQuickAccessGrid } from "@/features/account-center/components/AccountQuickAccessGrid";
import { AccountStatsRow } from "@/features/account-center/components/AccountStatsRow";
import { quickAccessBadgeCount } from "@/lib/account-center/badges";
import { ACCOUNT_QUICK_ACCESS } from "@/lib/account-center/modules";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function AccountCenterHome({ profile, trustData }: AccountCenterHomeProps) {
  const { t } = useTranslation();
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();

  const resolveMobile = (key?: Parameters<typeof resolveMobileBadge>[0]) =>
    resolveMobileBadge(key, mobileBadges);

  const resolveQuickBadge = (module: (typeof ACCOUNT_QUICK_ACCESS)[number]) =>
    quickAccessBadgeCount(module, badgeCounts, resolveMobile);

  const modules = ACCOUNT_QUICK_ACCESS.map((module) => ({
    ...module,
    title: t(`account.module.${module.id}` as const),
    subtitle: t(`account.module.${module.id}.sub` as const),
  }));

  return (
    <div className="account-center">
      <div className="account-center__container">
        <AccountCenterHeader title={t("account.title")} variant="home" />
        <AccountProfileHero profile={profile} trustData={trustData} />
        {trustData ? <AccountStatsRow trustData={trustData} /> : null}
        <AccountQuickAccessGrid
          modules={modules}
          resolveBadge={resolveQuickBadge}
          sectionTitle={t("account.quickAccess")}
        />
      </div>
    </div>
  );
}
