"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { BottomNavIcon3D, type BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { Avatar } from "@/components/ui/Avatar";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
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
  icon: BottomNavIconType;
};

const navItems: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: "home" },
  { id: "search", label: "Search", href: "/search", icon: "search" },
  { id: "saved", label: "Saved", href: "/saved", icon: "saved" },
  { id: "account", label: "Account", href: "/account", icon: "account" },
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
      <span className="bottom-nav-icon-3d-wrap">
        <BottomNavIcon3D type={item.icon} active={isActive} size="tab" />
      </span>
      <span className="bottom-nav-item-2026__label">{item.label}</span>
    </Link>
  );
}

function AccountNavLink({ isActive }: { isActive: boolean }) {
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);
  const accountItem = navItems.find((item) => item.id === "account")!;

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
      className={cn("bottom-nav-item-2026", focusRing, transitionFast)}
    >
      <span className="bottom-nav-icon-3d-wrap">
        {profile ? (
          <Avatar
            src={profile.avatarUrl}
            alt={profile.name}
            name={profile.name}
            size="nav"
            className={cn(isActive && "ring-2 ring-primary")}
          />
        ) : (
          <BottomNavIcon3D type="account" active={isActive} size="tab" />
        )}
      </span>
      <span className="bottom-nav-item-2026__label">{accountItem.label}</span>
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
  const scroll = useMobileHeaderScrollContext();
  const activeTab = resolveActiveTab(pathname, active);
  const isSellActive = activeTab === "sell";
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const [home, search, saved] = navItems;

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
      <div className="bottom-nav-shell-2026 pointer-events-auto relative w-[92%] max-w-none">
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
                <BottomNavIcon3D type="sell" active={isSellActive} size="sell" />
              </span>
              <span className="bottom-nav-item-2026__label">Sell</span>
            </Link>
          </li>

          <li>
            <NavLink item={saved} isActive={activeTab === "saved"} />
          </li>
          <li>
            <AccountNavLink isActive={activeTab === "account"} />
          </li>
        </ul>
      </div>
    </nav>
  );
}
