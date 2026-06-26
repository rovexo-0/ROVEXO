"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { Home, Search, Heart, User, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import "./bottom-navigation.css";

export type BottomNavTab = "home" | "search" | "sell" | "saved" | "account";

export type BottomNavigationProps = {
  active?: BottomNavTab;
  className?: string;
  ariaLabel?: string;
};

type NavItem = {
  id: BottomNavTab;
  label: string;
  href: string;
  icon: typeof Home;
};

const navItems: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "search", label: "Search", href: "/search", icon: Search },
  { id: "saved", label: "Saved", href: "/saved", icon: Heart },
  { id: "account", label: "Account", href: "/account", icon: User },
];

function resolveActiveTab(pathname: string, active?: BottomNavTab): BottomNavTab {
  if (active) return active;
  if (pathname.startsWith("/sell")) return "sell";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/saved")) return "saved";
  if (pathname.startsWith("/account")) return "account";
  return "home";
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
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      onClick={onNavigate}
      className={cn("bottom-nav-item-2026", focusRing, transitionFast)}
    >
      <span className="bottom-nav-lucide-icon">
        <Icon size={24} strokeWidth={isActive ? 2.25 : 2} aria-hidden />
      </span>
      <span className="bottom-nav-item-2026__label">{item.label}</span>
    </Link>
  );
}

export function BottomNavigation({
  active,
  className,
  ariaLabel = "Main navigation",
}: BottomNavigationProps) {
  const pathname = usePathname();
  const searchOverlay = useSearchOverlayOptional();
  const activeTab = resolveActiveTab(pathname, active);
  const isSellActive = activeTab === "sell";
  const [home, search, saved, account] = navItems;

  function handleSearchNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/" && searchOverlay) {
      event.preventDefault();
      searchOverlay.open();
    }
  }

  return (
    <nav
      data-bottom-nav="2026"
      aria-label={ariaLabel}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 px-ds-2",
        "pb-[max(env(safe-area-inset-bottom),0.375rem)]",
        className,
      )}
    >
      <div className="bottom-nav-shell-2026 pointer-events-auto relative mx-auto max-w-[22rem]">
        <ul className="bottom-nav-grid-2026">
          <li>
            <NavLink item={home} isActive={activeTab === "home"} />
          </li>
          <li>
            <NavLink item={search} isActive={activeTab === "search"} onNavigate={handleSearchNavigate} />
          </li>

          <li>
            <Link
              href="/sell"
              aria-label="Sell"
              aria-current={isSellActive ? "page" : undefined}
              data-active={isSellActive}
              className={cn("bottom-nav-item-2026 bottom-nav-item-2026--sell", focusRing, transitionFast)}
            >
              <span className="bottom-nav-sell-2026">
                <Plus size={26} strokeWidth={2.5} aria-hidden />
              </span>
              <span className="bottom-nav-item-2026__label">Sell</span>
            </Link>
          </li>

          <li>
            <NavLink item={saved} isActive={activeTab === "saved"} />
          </li>
          <li>
            <NavLink item={account} isActive={activeTab === "account"} />
          </li>
        </ul>
      </div>
    </nav>
  );
}
