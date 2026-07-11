"use client";

import { useTransition } from "react";
import { AccountIcon } from "@/components/account/AccountIcons";
import { AccountMenuRow } from "@/features/account-center/components/AccountMenuRow";
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
  const sections = buildAccountMenuSections(profile);

  return (
    <nav className="ac-canonical__menu" aria-label="My Account">
      {sections.map((section) => (
        <section key={section.id} className="ac-canonical__section" aria-labelledby={`ac-section-${section.id}`}>
          <h2 id={`ac-section-${section.id}`} className="ac-canonical__section-title">
            {section.title}
          </h2>
          <div className="ac-canonical__section-card">
            {section.items.map((item) => (
              <AccountMenuRow
                key={item.id}
                id={`ac-canonical-${item.id}`}
                href={item.href}
                title={item.title}
                subtitle={item.subtitle}
                comingSoon={item.comingSoon}
                disabled={item.comingSoon}
                badge={resolveMenuBadge(item, badgeCounts, mobileBadges)}
                trailing={
                  item.showVerifiedBadge ? (
                    <span className="ac-canonical__verified-pill">Verified</span>
                  ) : undefined
                }
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name={item.icon} />
                  </span>
                }
              />
            ))}
          </div>
        </section>
      ))}

      <section className="ac-canonical__section ac-canonical__section--system" aria-label="System">
        <AccountMenuRow
          id="ac-canonical-logout"
          title={ACCOUNT_LOGOUT_MENU_ITEM.title}
          destructive
          disabled={isPending}
          hideChevron
          icon={null}
          onClick={() => startTransition(() => void signOut())}
        />
      </section>
    </nav>
  );
}
