"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { RovexoHeaderMark } from "@/components/brand/RovexoLogo";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HeaderSearchBar } from "@/components/header/HeaderSearchBar";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { cn } from "@/lib/cn";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";

export type HeaderProps = {
  isSeller?: boolean;
  unreadNotifications?: number;
  unreadMessages?: number;
};

const HeaderActions = memo(function HeaderActions({
  unreadMessages,
  unreadNotifications,
}: {
  unreadMessages: number;
  unreadNotifications: number;
}) {
  return (
    <>
      <HeaderIconLink href="/messages" label="Messages" badge={unreadMessages} size="compact">
        <DashboardIcon3D type="messages" size={22} />
      </HeaderIconLink>
      <HeaderIconLink href="/notifications" label="Notifications" badge={unreadNotifications} size="compact">
        <DashboardIcon3D type="notifications" size={22} />
      </HeaderIconLink>
      <HeaderProfileLink className="rx-header-premium__profile-link" avatarClassName="rx-header-premium__avatar" />
    </>
  );
});

function Header({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HeaderProps) {
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const headerRef = useRef<HTMLElement>(null);
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

  return (
    <header
      ref={headerRef}
      data-header-version="rovexo-v1"
      className={cn(
        "rx-header-shell rx-header-premium sticky top-0 left-0 right-0 z-[100]",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[220ms] max-lg:ease-in-out max-lg:will-change-[transform,opacity]",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className="rx-header-premium__inner">
        <div className="rx-header-premium__row">
          <div className="rx-header-premium__logo">
            <RovexoHeaderMark />
          </div>

          <div className="rx-header-shell__search rx-header-premium__search">
            <HeaderSearchBar
              inputId="header-search"
              placeholder="Search ROVEXO..."
              className="w-full"
            />
          </div>

          <div className="rx-header-premium__actions" role="group" aria-label="Quick links">
            <HeaderActions
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <HeaderIconLink href="/notifications" label="Notifications" badge={unreadCount} size="compact">
      <DashboardIcon3D type="notifications" size={22} />
    </HeaderIconLink>
  );
}
