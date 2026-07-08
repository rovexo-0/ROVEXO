"use client";

import { useTransition } from "react";
import { AccountIcon } from "@/components/account/AccountIcons";
import { LogoutLineIcon } from "@/components/icons/RvxLineIcons";
import { AccountMenuRow } from "@/features/account-center/components/AccountMenuRow";
import {
  ACCOUNT_CANONICAL_MENU,
  ACCOUNT_LOGOUT_MENU_ITEM,
  type AccountMenuItem,
} from "@/lib/account-center/canonical-menu";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { signOut } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/wallet/utils";

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

export function AccountMenuList({ walletBalance = null }: { walletBalance?: number | null }) {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <nav className="ac-hub__menu" aria-label="My Account">
      <div className="ac-hub__menu-card">
        {ACCOUNT_CANONICAL_MENU.map((item) => (
          <AccountMenuRow
            key={item.id}
            id={`ac-hub-${item.id}`}
            href={item.href}
            title={item.title}
            badge={resolveMenuBadge(item, badgeCounts, mobileBadges)}
            trailing={
              item.showWalletBalance && walletBalance != null ? (
                <span className="ac-hub__wallet-balance">{formatCurrency(walletBalance)}</span>
              ) : undefined
            }
            icon={<AccountMenuIcon name={item.icon} />}
          />
        ))}
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
