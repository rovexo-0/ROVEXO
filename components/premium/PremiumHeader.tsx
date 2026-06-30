"use client";

import Link from "next/link";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RovexoHeaderMark } from "@/components/brand/RovexoLogo";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { SearchBar } from "@/components/premium/SearchBar";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { useMobileHeaderScrollContext } from "@/components/premium/MobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { cn } from "@/lib/cn";

const DESKTOP_LINKS = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Saved", href: "/saved" },
  { label: "Sell", href: "/sell" },
] as const;

export type PremiumHeaderProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

function PremiumHeaderActions({
  unreadMessages,
  unreadNotifications,
}: {
  unreadMessages: number;
  unreadNotifications: number;
}) {
  return (
    <>
      <HeaderIconLink href="/saved" label="Wishlist" size="compact">
        <DashboardIcon3D type="saved" size={22} />
      </HeaderIconLink>
      <HeaderIconLink href="/messages" label="Messages" badge={unreadMessages} size="compact">
        <DashboardIcon3D type="messages" size={22} />
      </HeaderIconLink>
      <HeaderIconLink href="/notifications" label="Notifications" badge={unreadNotifications} size="compact">
        <DashboardIcon3D type="notifications" size={22} />
      </HeaderIconLink>
      <HeaderProfileLink className="premium-header__profile" avatarClassName="premium-header__avatar" />
    </>
  );
}

export const PremiumHeader = memo(function PremiumHeader({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: PremiumHeaderProps) {
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const liveBadges = useHeaderBadges({
    unreadMessages: unreadMessagesProp,
    unreadNotifications: unreadNotificationsProp,
  });

  const unreadMessages = Math.max(unreadMessagesProp, liveBadges.unreadMessages);
  const unreadNotifications = Math.max(unreadNotificationsProp, liveBadges.unreadNotifications);

  useLayoutEffect(() => {
    registerHeader?.(headerRef.current);
    return () => registerHeader?.(null);
  }, [registerHeader]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-header-version="premium-2026"
      className={cn(
        "premium-header sticky top-0 z-[100] transition-[transform,background,box-shadow,border-color] duration-300",
        scrolled
          ? "border-b border-white/50 bg-white/75 shadow-[0_8px_32px_-16px_rgba(99,102,241,0.25)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[220ms] max-lg:ease-in-out max-lg:will-change-[transform,opacity]",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className="premium-container py-3">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="shrink-0">
            <RovexoHeaderMark />
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar />
          </div>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Desktop">
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <PremiumButton href="/sell" variant="primary" size="sm" className="hidden sm:inline-flex">
              Import Listing
            </PremiumButton>
            <div className="flex items-center gap-0.5 sm:gap-1" role="group" aria-label="Quick links">
              <PremiumHeaderActions
                unreadMessages={unreadMessages}
                unreadNotifications={unreadNotifications}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 lg:hidden">
          <SearchBar size="compact" />
        </div>
      </div>
    </header>
  );
});

export default PremiumHeader;
