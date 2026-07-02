"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { resolveBottomNavGlassIcon } from "@/lib/icons/resolve";
import { Avatar } from "@/components/ui/Avatar";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { MenuItemConfig } from "@/lib/platform-visual/types";
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

const defaultNavItems: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: "home" },
  { id: "search", label: "Search", href: "/search", icon: "search" },
  { id: "saved", label: "Saved", href: "/saved", icon: "saved" },
  { id: "account", label: "Account", href: "/account", icon: "account" },
];

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
  if (pathname.startsWith("/saved")) return "saved";
  if (pathname.startsWith("/account")) return "account";
  return "home";
}

function NavIcon({ type }: { type: BottomNavIconType }) {
  return (
    <RovexoIcon icon={resolveBottomNavGlassIcon(type)} size={32} className="rx-bottom-nav-tab-icon" />
  );
}

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      onClick={onNavigate}
      className={cn("rx-bottom-nav-item", focusRing, transitionFast)}
    >
      <span className="rx-bottom-nav-icon-wrap">
        <NavIcon type={item.icon} />
      </span>
      <span className="rx-bottom-nav-item__label">{item.label}</span>
    </Link>
  );
}

function AccountNavLink({ isActive, accountItem }: { isActive: boolean; accountItem: NavItem }) {
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { profile?: { fullName?: string; avatarUrl?: string | null } } | null) => {
        if (!cancelled && payload?.profile) {
          setProfile({
            name: payload.profile.fullName ?? "Account",
            avatarUrl: payload.profile.avatarUrl ?? null,
          });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href={accountItem.href}
      aria-label={accountItem.label}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      className={cn("rx-bottom-nav-item", focusRing, transitionFast)}
    >
      <span className="rx-bottom-nav-icon-wrap">
        {profile ? (
          <Avatar
            src={profile.avatarUrl}
            alt={profile.name}
            name={profile.name}
            size="nav"
            className={cn(isActive && "ring-2 ring-primary")}
          />
        ) : (
          <NavIcon type="account" />
        )}
      </span>
      <span className="rx-bottom-nav-item__label">{accountItem.label}</span>
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
  const activeTab = resolveActiveTab(pathname, active);
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const navItems = menuItems?.length ? mapMenuItems(menuItems) : defaultNavItems;
  const home = navItems.find((item) => item.id === "home") ?? defaultNavItems[0];
  const search = navItems.find((item) => item.id === "search") ?? defaultNavItems[1];
  const saved = navItems.find((item) => item.id === "saved") ?? defaultNavItems[2];
  const account = navItems.find((item) => item.id === "account") ?? defaultNavItems[3];
  const sell = menuItems?.find((item) => item.id === "sell" && item.enabled);
  const isSellActive = activeTab === "sell";

  function handleSearchNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/" && searchOverlay) {
      event.preventDefault();
      searchOverlay.open();
    }
  }

  if (!visible) return null;

  return (
    <nav
      data-bottom-nav="2026"
      aria-label={ariaLabel}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-ds-3",
        "pb-[max(env(safe-area-inset-bottom),0px)]",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[250ms] max-lg:ease-in-out max-lg:will-change-[transform,opacity]",
        hasScrollBehavior &&
          !isChromeVisible &&
          "max-lg:translate-y-[120px] max-lg:opacity-0 max-lg:pointer-events-none",
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
                aria-label={sell.label}
                aria-current={isSellActive ? "page" : undefined}
                data-active={isSellActive}
                className={cn("rx-bottom-nav-item rx-bottom-nav-item--sell", focusRing, transitionFast)}
              >
                <span className="rx-bottom-nav-sell">
                  <RovexoIcon icon={RovexoIcons.navigation.sell} size={34} />
                </span>
                <span className="rx-bottom-nav-item__label">{sell.label}</span>
              </Link>
            </li>
          ) : (
            <li>
              <Link
                href="/sell"
                aria-label="Sell"
                aria-current={isSellActive ? "page" : undefined}
                data-active={isSellActive}
                className={cn("rx-bottom-nav-item rx-bottom-nav-item--sell", focusRing, transitionFast)}
              >
                <span className="rx-bottom-nav-sell">
                  <RovexoIcon icon={RovexoIcons.navigation.sell} size={34} />
                </span>
                <span className="rx-bottom-nav-item__label">Sell</span>
              </Link>
            </li>
          )}

          <li>
            <NavLink item={saved} isActive={activeTab === "saved"} />
          </li>
          <li>
            <AccountNavLink isActive={activeTab === "account"} accountItem={account} />
          </li>
        </ul>
      </div>
    </nav>
  );
}
