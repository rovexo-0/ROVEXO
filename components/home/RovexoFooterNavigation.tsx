"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { useRovexoMobileHeaderScrollContext } from "@/components/home/RovexoMobileHeaderScrollContext";
import { RovexoIcons } from "@/lib/icons";
import { resolveBottomNavGlassIcon } from "@/lib/icons/resolve";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import type { MenuItemConfig } from "@/lib/platform-visual/types";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";

export type BottomNavTab = "home" | "search" | "sell" | "saved" | "account";

export type RovexoFooterNavigationProps = {
  active?: BottomNavTab;
  className?: string;
  menuItems?: MenuItemConfig[];
  visible?: boolean;
};

type NavItem = {
  id: BottomNavTab;
  label: string;
  href: string;
};

const defaultNavItems: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "search", label: "Search", href: "/search" },
  { id: "sell", label: "Sell", href: "/sell" },
  { id: "saved", label: "Saved", href: "/saved" },
  { id: "account", label: "Account", href: "/account" },
];

function mapMenuItems(items: MenuItemConfig[]): NavItem[] {
  return items.map((item) => ({
    id: (item.id as BottomNavTab) || "home",
    label: item.label,
    href: item.href,
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

function NavIcon({ id }: { id: BottomNavTab }) {
  if (id === "sell") return null;
  return (
    <RovexoIcon
      icon={resolveBottomNavGlassIcon(id as BottomNavIconType)}
      variant="bottomNav"
      className="home-v1-bottom-nav__icon"
    />
  );
}

function AccountNavAvatar({ isActive }: { isActive: boolean }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("Account");

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { profile?: { fullName?: string; avatarUrl?: string | null } } | null) => {
        if (!cancelled && payload?.profile) {
          setName(payload.profile.fullName ?? "Account");
          setAvatarUrl(payload.profile.avatarUrl ?? null);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={28}
        height={28}
        className={cn("home-v1-bottom-nav__avatar", isActive && "ring-2 ring-primary")}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cn(
        "home-v1-bottom-nav__avatar inline-flex items-center justify-center bg-surface-muted text-[10px] font-bold text-text-secondary",
        isActive && "ring-2 ring-primary",
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function RovexoFooterNavigation({
  active,
  className,
  menuItems,
  visible = true,
}: RovexoFooterNavigationProps) {
  const pathname = usePathname();
  const searchOverlay = useSearchOverlayOptional();
  const scroll = useRovexoMobileHeaderScrollContext();
  const resolvedActive = resolveActiveTab(pathname, active);
  const items = menuItems?.length ? mapMenuItems(menuItems) : defaultNavItems;
  const isVisible = visible && (scroll?.isVisible ?? true);

  function handleSearchClick(event: MouseEvent<HTMLAnchorElement>, item: NavItem) {
    if (item.id !== "search" || !searchOverlay) return;
    event.preventDefault();
    searchOverlay.open();
  }

  const sideItems = items.filter((item) => item.id !== "sell");
  const sellItem = items.find((item) => item.id === "sell");
  const leftItems = sideItems.slice(0, 2);
  const rightItems = sideItems.slice(2);

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "home-v1-bottom-nav fixed inset-x-0 bottom-0 z-[90] lg:hidden",
        !isVisible && "translate-y-full",
        className,
      )}
    >
      <div className="home-v1-bottom-nav__shell">
        {leftItems.map((item) => {
          const isActive = resolvedActive === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => handleSearchClick(event, item)}
              className="home-v1-bottom-nav__item"
            >
              <NavIcon id={item.id} />
              <span className="home-v1-bottom-nav__label">{item.label}</span>
            </Link>
          );
        })}

        {sellItem ? (
          <Link
            href={sellItem.href}
            aria-label={sellItem.label}
            aria-current={resolvedActive === "sell" ? "page" : undefined}
            className="home-v1-bottom-nav__sell"
          >
            <RovexoIcon
              icon={RovexoIcons.navigation.sell}
              size={24}
              className="home-v1-bottom-nav__sell-icon"
            />
          </Link>
        ) : null}

        {rightItems.map((item) => {
          const isActive = resolvedActive === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => handleSearchClick(event, item)}
              className="home-v1-bottom-nav__item"
            >
              {item.id === "account" ? <AccountNavAvatar isActive={isActive} /> : <NavIcon id={item.id} />}
              <span className="home-v1-bottom-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default RovexoFooterNavigation;
