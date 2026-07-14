"use client";

import { useState, useTransition } from "react";
import { AccountIcon } from "@/components/account/AccountIcons";
import {
  ACCOUNT_LOGOUT_MENU_ITEM,
  buildAccountMenuSections,
  type AccountMenuItem,
} from "@/lib/account-center/canonical-menu";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { signOut } from "@/lib/auth/actions";
import type { UserProfile } from "@/lib/profile/types";
import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { CanonicalConfirmDialog } from "@/src/components/canonical/dialogs/CanonicalConfirmDialog";

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

type AccountMenuSectionsProps = {
  profile: UserProfile;
};

export function AccountMenuSections({ profile }: AccountMenuSectionsProps) {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const [isPending, startTransition] = useTransition();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const sections = buildAccountMenuSections(profile);

  return (
    <nav className="ac-v1__menu" aria-label="My Account" data-account-menu="v1.0">
      {sections.map((section) => (
        <CanonicalCard key={section.id} variant="list" className="ac-v1__menu-card">
          {section.items.map((item) => (
            <CanonicalMenuRow
              key={item.id}
              id={`ac-v1-${item.id}`}
              href={item.href}
              title={item.title}
              description={item.subtitle}
              comingSoon={item.comingSoon}
              disabled={item.comingSoon}
              badge={resolveMenuBadge(item, badgeCounts, mobileBadges)}
              trailing={
                item.showVerifiedBadge ? (
                  <span className="ac-v1__verified-pill">Verified</span>
                ) : undefined
              }
              icon={
                <span className="ac-v1__menu-icon" aria-hidden>
                  <AccountIcon name={item.icon} />
                </span>
              }
            />
          ))}
        </CanonicalCard>
      ))}

      <CanonicalCard variant="list" className="ac-v1__menu-card ac-v1__menu-card--logout">
        <CanonicalMenuRow
          id="ac-v1-logout"
          title={ACCOUNT_LOGOUT_MENU_ITEM.title}
          destructive
          disabled={isPending}
          hideChevron
          onClick={() => setLogoutOpen(true)}
          icon={
            <span className="ac-v1__menu-icon" aria-hidden>
              <AccountIcon name={ACCOUNT_LOGOUT_MENU_ITEM.icon} />
            </span>
          }
        />
      </CanonicalCard>

      <CanonicalConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          startTransition(() => void signOut());
        }}
        title="Log out?"
        description="You will need to sign in again to access your account."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        destructive
        loading={isPending}
      />
    </nav>
  );
}
