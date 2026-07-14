"use client";

import { useState, useTransition, type ComponentType } from "react";
import Link from "next/link";
import {
  Bookmark,
  BriefcaseBusiness,
  ChevronRight,
  Heart,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Star,
  Wallet,
  type LucideProps,
} from "lucide-react";
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
import { CanonicalConfirmDialog } from "@/src/components/canonical/dialogs/CanonicalConfirmDialog";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const MENU_ICONS: Record<string, ComponentType<LucideProps>> = {
  listings: LayoutGrid,
  orders: Package,
  messages: MessageSquare,
  wallet: Wallet,
  reviews: Star,
  saved: Heart,
  following: Bookmark,
  business: BriefcaseBusiness,
  settings: Settings,
  security: LogOut,
};

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

function MenuRowIcon({ name }: { name: string }) {
  const Icon = MENU_ICONS[name] ?? Settings;
  return <Icon className="ac-v1__row-icon-svg" strokeWidth={1.75} aria-hidden />;
}

export function AccountMenuSections({ profile }: AccountMenuSectionsProps) {
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();
  const [isPending, startTransition] = useTransition();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const items = buildAccountMenuSections(profile).flatMap((section) => section.items);

  return (
    <nav className="ac-v1__menu" aria-label="My Account" data-account-menu="v1.0">
      <div className="ac-v1__menu-card">
        {items.map((item) => {
          const badge = resolveMenuBadge(item, badgeCounts, mobileBadges);
          const rowClass = cn("ac-v1__row", focusRing, item.comingSoon && "ac-v1__row--disabled");

          const content = (
            <>
              <span className="ac-v1__row-icon" aria-hidden>
                <MenuRowIcon name={item.icon} />
              </span>
              <span className="ac-v1__row-title">{item.title}</span>
              {badge > 0 ? <span className="ac-v1__row-badge">{badge > 99 ? "99+" : badge}</span> : null}
              <ChevronRight className="ac-v1__row-chevron" strokeWidth={1.75} aria-hidden />
            </>
          );

          if (item.href && !item.comingSoon) {
            return (
              <Link key={item.id} id={`ac-v1-${item.id}`} href={item.href} className={rowClass}>
                {content}
              </Link>
            );
          }

          return (
            <div key={item.id} id={`ac-v1-${item.id}`} className={rowClass} aria-disabled>
              {content}
            </div>
          );
        })}

        <button
          type="button"
          id="ac-v1-logout"
          className={cn("ac-v1__row", "ac-v1__row--logout", focusRing)}
          disabled={isPending}
          onClick={() => setLogoutOpen(true)}
        >
          <span className="ac-v1__row-icon" aria-hidden>
            <MenuRowIcon name={ACCOUNT_LOGOUT_MENU_ITEM.icon} />
          </span>
          <span className="ac-v1__row-title">{ACCOUNT_LOGOUT_MENU_ITEM.title}</span>
        </button>
      </div>

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
