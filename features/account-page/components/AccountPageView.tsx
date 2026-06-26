"use client";

import { MenuCard } from "@/features/account-page/components/MenuCard";
import { AccountPageHeader } from "@/features/account-page/components/AccountPageHeader";
import { ProfileCard } from "@/features/account-page/components/ProfileCard";
import { SectionTitle } from "@/features/account-page/components/SectionTitle";
import { LogoutButton } from "@/features/account-page/components/LogoutButton";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import {
  ACCOUNT_DASHBOARD_TILES,
  BUYER_TOOLS_TILES,
  getSellerDashboardTiles,
  QUICK_ACCESS_TILES,
} from "@/lib/dashboard/sections";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountPageViewProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

function MenuSection({
  id,
  title,
  tiles,
  resolveBadge,
}: {
  id: string;
  title: string;
  tiles: Array<{ href: string; label: string; subtitle: string; badge?: MobileBadgeKey }>;
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

export function AccountPageView({ profile, trustData }: AccountPageViewProps) {
  const { badgeCounts, mobileBadges: badges } = useRealtimeNotifications();

  const resolveBadge = (href: string, key?: MobileBadgeKey) =>
    badgeCounts ? resolveHrefBadge(href, badgeCounts) : resolveMobileBadge(key, badges);

  const sellerTiles = profile.isSeller ? getSellerDashboardTiles() : [];

  return (
    <div className="account-page">
      <AccountPageHeader />

      <div className="account-page__content">
        <ProfileCard profile={profile} trustData={trustData} />

        <MenuSection
          id="account-quick-access"
          title="Quick Access"
          tiles={QUICK_ACCESS_TILES}
          resolveBadge={resolveBadge}
        />

        <MenuSection
          id="account-buyer-tools"
          title="Buyer Tools"
          tiles={BUYER_TOOLS_TILES}
          resolveBadge={resolveBadge}
        />

        {profile.isSeller ? (
          <MenuSection
            id="account-seller-tools"
            title="Seller Tools"
            tiles={sellerTiles}
            resolveBadge={resolveBadge}
          />
        ) : null}

        <MenuSection
          id="account-links"
          title="Account"
          tiles={ACCOUNT_DASHBOARD_TILES}
          resolveBadge={resolveBadge}
        />

        <LogoutButton />
      </div>
    </div>
  );
}
