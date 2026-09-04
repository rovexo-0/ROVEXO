"use client";

import {
  buildBusinessMenuSections,
  type BusinessMenuItem,
} from "@/lib/account-center/business-menu";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { useTranslation } from "@/lib/i18n/use-translation";
import "@/styles/rovexo/business-onboarding-v1.css";

function resolveMenuBadge(
  item: BusinessMenuItem,
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

type BusinessMenuSectionsProps = {
  storeSlug?: string | null;
};

export function BusinessMenuSections({ storeSlug }: BusinessMenuSectionsProps) {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const { tx } = useTranslation();
  const sections = buildBusinessMenuSections(storeSlug);

  return (
    <nav className="ac-canonical__menu" aria-label={tx("Business")} data-business-menu="master-v2">
      {sections.map((section) => (
        <div key={section.id} className="cds-section">
          <CanonicalCard variant="list">
            {section.items.map((item) => (
              <CanonicalMenuRow
                key={item.id}
                id={`business-menu-${item.id}`}
                href={item.comingSoon ? undefined : item.href}
                title={item.title}
                description={item.subtitle}
                value={item.value}
                comingSoon={item.comingSoon}
                badge={item.comingSoon ? 0 : resolveMenuBadge(item, badgeCounts, mobileBadges)}
                showChevron={false}
                trailing={
                  <span className="biz-menu__chevron" aria-hidden>
                    ›
                  </span>
                }
                icon={
                  <span className="ac-canonical__menu-emoji" aria-hidden>
                    {item.emoji}
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
