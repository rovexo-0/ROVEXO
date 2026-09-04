"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ACCOUNT_LOGOUT_MENU_ITEM,
  buildAccountMenuSections,
  type AccountMenuItem,
} from "@/lib/account-center/canonical-menu";
import { HolidayModeProfileRow } from "@/features/account-center/components/HolidayModeProfileRow";
import { ThemeProfileRow } from "@/features/account-center/components/ThemeProfileRow";
import {
  PROFILE_BALANCE_ICON,
  ProfileMenuIcon,
} from "@/features/account-center/components/ProfileMenuIcons";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import { clearClientSessionOnLogout } from "@/features/auth/providers/AuthProvider";
import { signOut } from "@/lib/auth/actions";
import type { UserProfile } from "@/lib/profile/types";
import { CanonicalMenuRow } from "@/src/components/canonical";
import { CanonicalConfirmDialog } from "@/src/components/canonical/dialogs/CanonicalConfirmDialog";
import { useTranslation } from "@/lib/i18n/use-translation";
import { prefetchRouteOnIntent } from "@/lib/navigation/viewport-route-prefetch-v1";

/** Re-export for Balance module inheritance (Profile Icon System v1.0). */
export { PROFILE_BALANCE_ICON };
export { PROFILE_ICON_COLORS as PROFILE_MENU_ICONS } from "@/lib/account-center/profile-icon-system-v1";

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
  /** Available-only label for Balance row (never pending/locked). */
  availableBalanceLabel?: string;
  /** Holiday Mode (vacationMode) — inline toggle, no subpage. */
  holidayModeEnabled?: boolean;
  /** Active listings — Smart Visibility for Holiday Mode. */
  activeListingCount?: number;
  /** Compact Profile Business action — first row in the Master Menu. */
  leadingRow?: ReactNode;
};

export function AccountMenuSections({
  profile,
  availableBalanceLabel,
  holidayModeEnabled = false,
  activeListingCount = 0,
  leadingRow = null,
}: AccountMenuSectionsProps) {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const [isPending, startTransition] = useTransition();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { tx } = useTranslation();
  const sections = buildAccountMenuSections(profile, {
    availableBalanceLabel,
    activeListingCount,
  });
  const router = useRouter();
  const warmHrefs = sections
    .flatMap((section) => section.items.map((item) => item.href))
    .filter((href): href is string => Boolean(href))
    .join("|");

  /* P0.3 — warm deterministic Account destinations once hub mounts (deduped). */
  useEffect(() => {
    if (!warmHrefs) return;
    for (const href of warmHrefs.split("|")) {
      prefetchRouteOnIntent(router, href);
    }
  }, [router, warmHrefs]);

  return (
    <nav className="ac-canonical__menu" aria-label={tx("Profile")} data-master-menu="profile-v1" data-profile-icons="v1.0">
      {sections.map((section, index) => (
        <div key={section.id} className="ac-canonical__menu-group" data-section={section.id}>
          {index === 0 ? leadingRow : null}
          {section.items.map((item) => {
            if (item.id === "theme") {
              // Theme is rendered in a dedicated group below — guaranteed on mobile + desktop.
              return null;
            }

            if (item.id === "holiday-mode") {
              return (
                <HolidayModeProfileRow
                  key={item.id}
                  initialEnabled={holidayModeEnabled}
                />
              );
            }

            return (
              <CanonicalMenuRow
                key={item.id}
                id={`ac-canonical-${item.id}`}
                href={item.comingSoon ? undefined : item.href}
                title={item.title}
                description={item.subtitle}
                value={item.value}
                comingSoon={item.comingSoon}
                badge={item.comingSoon ? 0 : resolveMenuBadge(item, badgeCounts, mobileBadges)}
                icon={<ProfileMenuIcon id={item.id} />}
                prefetch={Boolean(item.href) && !item.comingSoon}
              />
            );
          })}
        </div>
      ))}

      {/* Theme Switch v1.0 — always under Rovexo Ideas, before Sign Out (mobile + desktop). */}
      <div className="ac-canonical__menu-group" data-section="theme" data-profile-theme-group="v1.0">
        <ThemeProfileRow />
      </div>

      <div className="ac-canonical__menu-group" data-section="system">
        <CanonicalMenuRow
          id="ac-canonical-logout"
          title={ACCOUNT_LOGOUT_MENU_ITEM.title}
          destructive
          disabled={isPending}
          hideChevron
          onClick={() => setSignOutOpen(true)}
          icon={<ProfileMenuIcon id="logout" />}
        />
      </div>

      <CanonicalConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          startTransition(() => {
            clearClientSessionOnLogout();
            void signOut();
          });
        }}
        title="Sign Out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        destructive
        loading={isPending}
      />
    </nav>
  );
}
