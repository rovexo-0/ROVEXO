"use client";

import { memo, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoAppIconMark } from "@/components/brand/RovexoAppIconMark";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { RovexoSearchBar } from "@/components/home/RovexoSearchBar";
import { useRovexoMobileHeaderScrollContext } from "@/components/home/RovexoMobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { ReactNode } from "react";

export type RovexoHeaderProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

function HeaderGlassAction({
  href,
  label,
  badge,
  icon,
}: {
  href: string;
  label: string;
  badge?: number;
  icon: ReactNode;
}) {
  return (
    <HeaderIconLink
      href={href}
      label={label}
      badge={badge}
      className="home-v1-header__action rounded-none p-0 hover:bg-transparent"
      size="compact"
    >
      {icon}
    </HeaderIconLink>
  );
}

export const RovexoHeader = memo(function RovexoHeader({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: RovexoHeaderProps) {
  const scroll = useRovexoMobileHeaderScrollContext();
  const headerRef = useRef<HTMLElement>(null);
  const liveBadges = useHeaderBadges({
    unreadMessages: unreadMessagesProp,
    unreadNotifications: unreadNotificationsProp,
  });

  const unreadMessages = Math.max(unreadMessagesProp, liveBadges.unreadMessages);
  const unreadNotifications = Math.max(unreadNotificationsProp, liveBadges.unreadNotifications);

  useLayoutEffect(() => {
    scroll?.registerHeader(headerRef.current);
    return () => scroll?.registerHeader(null);
  }, [scroll]);

  return (
    <header
      ref={headerRef}
      data-header-version="home-v1"
      data-chrome-scroll={scroll ? "registered" : undefined}
      className={cn(
        "home-v1-header rovexo-chrome",
        scroll && !scroll.isVisible && "rovexo-chrome--hidden",
      )}
    >
      <div className="home-v1-header__inner">
        <Link href="/" aria-label="ROVEXO Home" className={cn("home-v1-header__logo", focusRing)}>
          <RovexoAppIconMark className="h-full w-full rounded-[12px]" uid="home-v1-mark" contained />
        </Link>

        <RovexoSearchBar />

        <div className="home-v1-header__actions" role="group" aria-label="Account actions">
          <HeaderGlassAction href="/messages" label="Messages" badge={unreadMessages} icon={<RovexoIcon icon={RovexoIcons.chat.messages} variant="header" />} />
          <HeaderGlassAction href="/notifications" label="Notifications" badge={unreadNotifications} icon={<RovexoIcon icon={RovexoIcons.notifications.bell} variant="header" />} />
          <HeaderGlassAction href="/account" label="Account" icon={<RovexoIcon icon={RovexoIcons.account.user} variant="header" />} />
        </div>
      </div>
    </header>
  );
});

export default RovexoHeader;
