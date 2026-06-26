"use client";

import { MenuCard } from "@/features/account-page/components/MenuCard";
import { AccountPageHeader } from "@/features/account-page/components/AccountPageHeader";
import { ProfileCard } from "@/features/account-page/components/ProfileCard";
import { SectionTitle } from "@/features/account-page/components/SectionTitle";
import { LogoutButton } from "@/features/account-page/components/LogoutButton";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import {
  getBusinessHubTiles,
  getBuyHubTiles,
  getSellHubTiles,
  getSupportHubTiles,
} from "@/lib/mobile-ui/hubs";
import { QUICK_ACCESS_TILES } from "@/lib/dashboard/sections";
import type { MobileBadgeKey, MobileTile } from "@/lib/mobile-ui/types";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type PremiumAccountDashboardProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

function HubSection({
  id,
  title,
  tiles,
  resolveBadge,
}: {
  id: string;
  title: string;
  tiles: MobileTile[];
  resolveBadge: (href: string, key?: MobileBadgeKey) => number;
}) {
  return (
    <section className="account-section" aria-labelledby={id}>
      <SectionTitle id={id}>{title}</SectionTitle>
      <div className="account-menu-grid">
        {tiles.map((tile) => (
          <MenuCard
            key={`${id}-${tile.href}-${tile.label}`}
            href={tile.href}
            title={tile.label}
            subtitle={tile.subtitle}
            badgeCount={resolveBadge(tile.href, tile.badge)}
          />
        ))}
      </div>
    </section>
  );
}

export function PremiumAccountDashboard({ profile, trustData }: PremiumAccountDashboardProps) {
  const { badgeCounts, mobileBadges: badges } = useRealtimeNotifications();

  const resolveBadge = (href: string, key?: MobileBadgeKey) =>
    badgeCounts ? resolveHrefBadge(href, badgeCounts) : resolveMobileBadge(key, badges);

  const buyTiles = getBuyHubTiles();
  const sellTiles = getSellHubTiles(profile);
  const businessTiles = getBusinessHubTiles(profile);
  const supportTiles = getSupportHubTiles();

  return (
    <div className="account-page">
      <AccountPageHeader />

      <div className="account-page__content">
        <ProfileCard profile={profile} trustData={trustData} />

        <HubSection
          id="account-quick-access"
          title="Quick Access"
          tiles={QUICK_ACCESS_TILES}
          resolveBadge={resolveBadge}
        />

        <HubSection id="account-buy-hub" title="Buy Hub" tiles={buyTiles} resolveBadge={resolveBadge} />

        <HubSection id="account-sell-hub" title="Sell Hub" tiles={sellTiles} resolveBadge={resolveBadge} />

        <HubSection
          id="account-business-hub"
          title="Business Hub"
          tiles={businessTiles}
          resolveBadge={resolveBadge}
        />

        <HubSection
          id="account-support-hub"
          title="Support Hub"
          tiles={supportTiles}
          resolveBadge={resolveBadge}
        />

        <LogoutButton />
      </div>
    </div>
  );
}
