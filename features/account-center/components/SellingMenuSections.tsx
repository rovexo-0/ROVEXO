"use client";

import { AccountIcon } from "@/components/account/AccountIcons";
import {
  buildSellingMenuSections,
  type SellingMenuItem,
} from "@/lib/account-center/selling-menu";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { useTranslation } from "@/lib/i18n/use-translation";

function resolveMenuBadge(
  item: SellingMenuItem,
  badgeCounts: ReturnType<typeof useRealtimeNotifications>["badgeCounts"],
  mobileBadges: ReturnType<typeof useRealtimeNotifications>["mobileBadges"],
): number {
  if (!item.badgeKeys?.length) return 0;
  return item.badgeKeys.reduce((total, key) => {
    const fromHref = badgeCounts ? resolveHrefBadge(item.href, badgeCounts) : 0;
    const fromMobile = resolveMobileBadge(key, mobileBadges);
    return total + Math.max(fromHref, fromMobile);
  }, 0);
}

export function SellingMenuSections() {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const { tx } = useTranslation();
  const sections = buildSellingMenuSections();

  return (
    <nav className="ac-canonical__menu" aria-label={tx("Selling")} data-selling-menu="master-v2">
      {sections.map((section) => (
        <div key={section.id} className="cds-section">
          <CanonicalCard variant="list">
            {section.items.map((item) => (
              <CanonicalMenuRow
                key={item.id}
                id={`selling-menu-${item.id}`}
                href={item.href}
                title={item.title}
                description={item.subtitle}
                badge={resolveMenuBadge(item, badgeCounts, mobileBadges)}
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name={item.icon} />
                  </span>
                }
              />
            ))}
          </CanonicalCard>
        </div>
      ))}
    </nav>
  );
}
