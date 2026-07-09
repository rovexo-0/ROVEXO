"use client";

import { useTransition } from "react";
import { AccountIcon } from "@/components/account/AccountIcons";
import { LogoutLineIcon } from "@/components/icons/RvxLineIcons";
import { AccountMenuExpandable } from "@/features/account-center/components/AccountMenuExpandable";
import { AccountMenuRow } from "@/features/account-center/components/AccountMenuRow";
import {
  ACCOUNT_LOGOUT_MENU_ITEM,
  buildAccountMenu,
  type AccountMenuItem,
} from "@/lib/account-center/canonical-menu";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { signOut } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/wallet/utils";
import type { UserProfile } from "@/lib/profile/types";

function resolveMenuBadge(
  item: AccountMenuItem,
  badgeCounts: ReturnType<typeof useRealtimeNotifications>["badgeCounts"],
  mobileBadges: ReturnType<typeof useRealtimeNotifications>["mobileBadges"],
): number {
  if (!item.badgeKeys?.length) return 0;
  return item.badgeKeys.reduce((total, key) => {
    const fromHref = item.href && badgeCounts ? resolveHrefBadge(item.href, badgeCounts) : 0;
    const fromMobile = resolveMobileBadge(key, mobileBadges);
    return total + Math.max(fromHref, fromMobile);
  }, 0);
}

function AccountMenuIcon({ name }: { name: AccountMenuItem["icon"] }) {
  return (
    <span className="ac-hub__menu-icon" aria-hidden>
      <AccountIcon name={name} />
    </span>
  );
}

type AccountMenuListProps = {
  profile: UserProfile;
  walletBalance?: number | null;
};

export function AccountMenuList({ profile, walletBalance = null }: AccountMenuListProps) {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const [isPending, startTransition] = useTransition();
  const menu = buildAccountMenu(profile);

  return (
    <nav className="ac-hub__menu" aria-label="My Account">
      <div className="ac-hub__menu-card">
        {menu.map((item) =>
          item.expandable && item.children?.length ? (
            <AccountMenuExpandable
              key={item.id}
              item={item}
              icon={<AccountMenuIcon name={item.icon} />}
              defaultOpen={profile.capabilities.hasSellingActivity}
            />
          ) : (
            <AccountMenuRow
              key={item.id}
              id={`ac-hub-${item.id}`}
              href={item.href}
              title={item.title}
              subtitle={item.subtitle}
              comingSoon={item.comingSoon}
              disabled={item.comingSoon}
              badge={resolveMenuBadge(item, badgeCounts, mobileBadges)}
              trailing={
                item.comingSoon ? (
                  <span className="ac-hub__coming-soon">Coming Soon</span>
                ) : item.showWalletBalance && walletBalance != null ? (
                  <span className="ac-hub__wallet-balance">{formatCurrency(walletBalance)}</span>
                ) : undefined
              }
              icon={<AccountMenuIcon name={item.icon} />}
            />
          ),
        )}
        <AccountMenuRow
          id="ac-hub-logout"
          title={ACCOUNT_LOGOUT_MENU_ITEM.title}
          destructive
          disabled={isPending}
          icon={
            <span className="ac-hub__menu-icon ac-hub__menu-icon--danger" aria-hidden>
              <LogoutLineIcon />
            </span>
          }
          onClick={() => startTransition(() => void signOut())}
        />
      </div>
    </nav>
  );
}
