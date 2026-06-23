"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import { focusRing, transitionFast } from "@/components/ui/tokens";

const STROKE = 1.75;

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
  icon: ReactNode;
};

function NavIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={STROKE} stroke="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </NavIcon>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </NavIcon>
  );
}

function SavedIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </NavIcon>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </NavIcon>
  );
}

function SellIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </NavIcon>
  );
}

const iconClass = "bottom-nav-item-2026__icon";

const navItems: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: <HomeIcon className={iconClass} /> },
  { id: "search", label: "Search", href: "/search", icon: <SearchIcon className={iconClass} /> },
  { id: "saved", label: "Saved", href: "/saved", icon: <SavedIcon className={iconClass} /> },
  { id: "account", label: "Account", href: "/account", icon: <AccountIcon className={iconClass} /> },
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
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      onClick={onNavigate}
      className={cn("bottom-nav-item-2026", focusRing, transitionFast)}
    >
      {item.icon}
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
                <SellIcon className="bottom-nav-item-2026__icon" />
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

