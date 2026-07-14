"use client";

import { useTransition } from "react";
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
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

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
        <CanonicalSection key={section.id} title={section.title}>
          <CanonicalCard variant="list">
            {section.items.map((item) => (
              <CanonicalMenuRow
                key={item.id}
                id={`ac-canonical-${item.id}`}
                href={item.href}
                title={item.title}
                description={item.subtitle}
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
          </CanonicalCard>
        </CanonicalSection>
      ))}

      <CanonicalSection title="System">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            id="ac-canonical-logout"
            title={ACCOUNT_LOGOUT_MENU_ITEM.title}
            destructive
            disabled={isPending}
            hideChevron
            onClick={() => startTransition(() => void signOut())}
          />
        </CanonicalCard>
      </CanonicalSection>
    </nav>
  );
}
