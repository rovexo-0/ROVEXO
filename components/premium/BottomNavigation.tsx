"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent } from "react";
import { BottomNavIcon3D, type BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { useMobileHeaderScrollContext } from "@/components/premium/MobileHeaderScrollContext";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import type { MenuItemConfig } from "@/lib/platform-visual/types";

export type BottomNavTab = "home" | "search" | "sell" | "saved" | "account";

export type BottomNavigationProps = {
  active?: BottomNavTab;
  className?: string;
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
  { id: "sell", label: "Sell", href: "/sell", icon: "sell" },
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

export function BottomNavigation({
  active,
  className,
  menuItems,
  visible = true,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const searchOverlay = useSearchOverlayOptional();
  const scroll = useMobileHeaderScrollContext();
  const resolvedActive = resolveActiveTab(pathname, active);
  const items = menuItems?.length ? mapMenuItems(menuItems) : defaultNavItems;
  const isVisible = visible && (scroll?.isVisible ?? true);

  function handleSearchClick(event: MouseEvent<HTMLAnchorElement>, item: NavItem) {
    if (item.id !== "search" || !searchOverlay) return;
    event.preventDefault();
    searchOverlay.open();
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "premium-bottom-nav fixed inset-x-0 bottom-0 z-[90] border-t border-white/60 bg-white/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl transition-transform duration-300 lg:hidden",
        !isVisible && "translate-y-full",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {items.map((item) => {
          const isActive = resolvedActive === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => handleSearchClick(event, item)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold transition",
                isActive ? "text-violet-600" : "text-slate-500",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                  isActive && "bg-violet-50 shadow-[0_8px_24px_-12px_rgba(99,102,241,0.45)]",
                )}
              >
                <BottomNavIcon3D type={item.icon} active={isActive} size="tab" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
