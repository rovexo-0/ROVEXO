"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { RovexoHeaderMark } from "@/components/brand/RovexoLogo";
import { HeaderCategoryBar } from "@/components/header/HeaderCategoryBar";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HeaderSearchBar } from "@/components/header/HeaderSearchBar";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { useRovexoMobileHeaderScrollContext } from "@/components/home/RovexoMobileHeaderScrollContext";
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
      <HeaderProfileLink />
    </>
  );
});

function Header({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HeaderProps) {
  const scroll = useRovexoMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
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
      data-chrome-scroll={scroll ? "registered" : undefined}
      className={cn(
        "rx-header-shell rovexo-chrome sticky top-0 left-0 right-0 z-[100]",
        "pt-[max(env(safe-area-inset-top),var(--ds-space-1))]",
        scroll && !scroll.isVisible && "rovexo-chrome--hidden",
      )}
    >
      <div className="mx-auto max-w-7xl px-ds-4">
        <div className="relative flex w-full min-h-[var(--header-shell-height)] items-center gap-2">
          <div className="z-[2] flex shrink-0 items-center self-center">
            <RovexoHeaderMark />
          </div>

          <div className="rx-header-shell__search z-[1] flex min-w-0 flex-1 items-center self-center">
            <HeaderSearchBar
              inputId="header-search"
              placeholder="Search ROVEXO..."
              className="w-full"
            />
          </div>

          <div
            className="z-[2] flex shrink-0 items-center gap-1 self-center"
            role="group"
            aria-label="Quick links"
          >
            <HeaderActions
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
          </div>
        </div>
      </div>

      <HeaderCategoryBar />
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
