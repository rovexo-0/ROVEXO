"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { BottomNavV2Icon } from "@/components/ui/BottomNavV2Icon";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { cn } from "@/lib/cn";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";
import { useSearchOverlayOptional } from "@/features/search/client";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { MenuItemConfig } from "@/lib/platform-visual/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import "./bottom-navigation.css";

export type BottomNavTab = "home" | "search" | "sell" | "saved" | "account";

export type BottomNavigationProps = {
  active?: BottomNavTab;
  className?: string;
  ariaLabel?: string;
  menuItems?: MenuItemConfig[];
  visible?: boolean;
};

type NavItem = {
  id: BottomNavTab;
  label: string;
  href: string;
  icon: BottomNavIconType;
};

function mapMenuItems(items: MenuItemConfig[]): NavItem[] {
  return items.map((item) => ({
    id: (item.id as BottomNavTab) || "home",
    label: item.label,
    href: item.href,
    icon: (item.icon as BottomNavIconType) || "home",
  }));
}

function resolveActiveTab(pathname: string, active?: BottomNavTab): BottomNavTab {
  if (active) return active;
  if (pathname.startsWith("/sell")) return "sell";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/inbox") || pathname.startsWith("/messages")) return "saved";
  if (pathname.startsWith("/saved")) return "account";
  if (pathname.startsWith("/account")) return "account";
  return "home";
}

function NavIcon({ type, href, isActive }: { type: BottomNavIconType; href: string; isActive: boolean }) {
  void isActive;
  return <BottomNavV2Icon type={type} href={href} />;
}

/** White "+" glyph inside the ROVEXO purple Sell FAB. */
function SellPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="rx-sell-plus">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavLink({
  item,
  isActive,
  onNavigate,
  badgeCount = 0,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  badgeCount?: number;
}) {
  const badgeLabel =
    badgeCount > 0
      ? `${item.label}, ${badgeCount > 99 ? "99+" : badgeCount} unread`
      : item.label;

  return (
    <Link
      href={item.href}
      aria-label={badgeLabel}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      onClick={onNavigate}
      className={cn("rx-bottom-nav-item", focusRing, transitionFast)}
    >
      <span className="rx-bottom-nav-icon-wrap">
        <NavIcon type={item.icon} href={item.href} isActive={isActive} />
        {badgeCount > 0 ? (
          <span className="rx-bottom-nav-badge" aria-hidden>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span className="rx-bottom-nav-item__label">{item.label}</span>
    </Link>
  );
}

export function BottomNavigation({
  active,
  className,
  ariaLabel = "Main navigation",
  menuItems,
  visible = true,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const searchOverlay = useSearchOverlayOptional();
  const scroll = useMobileHeaderScrollContext();
  const { mobileBadges } = useRealtimeNotifications();
  const { t, tx } = useTranslation();
  const activeTab = resolveActiveTab(pathname, active);
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const localizedDefaults: NavItem[] = [
    { id: "home", label: t("nav.home"), href: "/", icon: "home" },
    { id: "search", label: t("nav.search"), href: "/search", icon: "search" },
    { id: "saved", label: t("nav.saved"), href: INBOX_ROUTES.hub, icon: "saved" },
    { id: "account", label: t("nav.account"), href: "/account", icon: "account" },
  ];
  const navItems = menuItems?.length
    ? mapMenuItems(menuItems).map((item) => ({ ...item, label: tx(item.label) }))
    : localizedDefaults;
  const home = navItems.find((item) => item.id === "home") ?? localizedDefaults[0];
  const search = navItems.find((item) => item.id === "search") ?? localizedDefaults[1];
  const saved = navItems.find((item) => item.id === "saved") ?? localizedDefaults[2];
  const account = navItems.find((item) => item.id === "account") ?? localizedDefaults[3];
  const sell = menuItems?.find((item) => item.id === "sell" && item.enabled);
  const sellLabel = sell ? tx(sell.label) : t("nav.sell");
  const isSellActive = activeTab === "sell";
  const inboxBadge = Math.max(0, (mobileBadges.messages ?? 0) + (mobileBadges.notifications ?? 0));

  function handleSearchNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/" && searchOverlay) {
      event.preventDefault();
      searchOverlay.open();
    }
  }

  if (!visible) return null;

  // Transaction Hub conversation is full-screen — never mount bottom nav.
  if (pathname.startsWith("/inbox/conversation")) {
    return null;
  }

  return (
    <nav
      data-bottom-nav="v2"
      data-bottom-nav-version="v2-final"
      aria-label={tx(ariaLabel)}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[250ms] max-lg:ease-in-out max-lg:will-change-[transform,opacity]",
        hasScrollBehavior &&
          !isChromeVisible &&
          "max-lg:translate-y-[72px] max-lg:opacity-0 max-lg:pointer-events-none",
        className,
      )}
    >
      <div className="rx-bottom-nav-shell pointer-events-auto relative w-full max-w-none">
        <ul className="rx-bottom-nav-grid">
          <li>
            <NavLink item={home} isActive={activeTab === "home"} />
          </li>
          <li>
            <NavLink item={search} isActive={activeTab === "search"} onNavigate={handleSearchNavigate} />
          </li>

          {sell ? (
            <li>
              <Link
                href={sell.href}
                aria-label={sellLabel}
                aria-current={isSellActive ? "page" : undefined}
                data-active={isSellActive}
                className={cn("rx-bottom-nav-item rx-bottom-nav-item--sell", focusRing, transitionFast)}
              >
                <span className="rx-bottom-nav-sell">
                  <SellPlusIcon />
                </span>
                <span className="rx-bottom-nav-item__label">{sellLabel}</span>
              </Link>
            </li>
          ) : (
            <li>
              <Link
                href="/sell"
                aria-label={sellLabel}
                aria-current={isSellActive ? "page" : undefined}
                data-active={isSellActive}
                className={cn("rx-bottom-nav-item rx-bottom-nav-item--sell", focusRing, transitionFast)}
              >
                <span className="rx-bottom-nav-sell">
                  <SellPlusIcon />
                </span>
                <span className="rx-bottom-nav-item__label">{sellLabel}</span>
              </Link>
            </li>
          )}

          <li>
            <NavLink item={saved} isActive={activeTab === "saved"} badgeCount={inboxBadge} />
          </li>
          <li>
            <NavLink item={account} isActive={activeTab === "account"} />
          </li>
        </ul>
      </div>
    </nav>
  );
}
