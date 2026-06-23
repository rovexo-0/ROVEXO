"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { RovexoLogo } from "@/components/brand/RovexoLogo";
import { HeaderCategoryBar } from "@/components/header/HeaderCategoryBar";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HeaderSearchBar } from "@/components/header/HeaderSearchBar";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { cn } from "@/lib/cn";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { MessagesMenuIcon, NotificationsMenuIcon } from "@/features/profile/icons";

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
        <MessagesMenuIcon className="h-5 w-5" />
      </HeaderIconLink>
      <HeaderIconLink href="/notifications" label="Notifications" badge={unreadNotifications} size="compact">
        <NotificationsMenuIcon className="h-5 w-5" />
      </HeaderIconLink>
      <HeaderProfileLink />
    </>
  );
});

function Header({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HeaderProps) {
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const headerRef = useRef<HTMLElement>(null);
  const liveBadges = useHeaderBadges({
    unreadMessages: unreadMessagesProp,
    unreadNotifications: unreadNotificationsProp,
  });

  const unreadMessages = Math.max(unreadMessagesProp, liveBadges.unreadMessages);
  const unreadNotifications = Math.max(unreadNotificationsProp, liveBadges.unreadNotifications);
  const isVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);

  useLayoutEffect(() => {
    registerHeader?.(headerRef.current);
    return () => registerHeader?.(null);
  }, [registerHeader]);

  return (
    <header
      ref={headerRef}
      data-header-version="premium-2026"
      className={cn(
        "header-premium-2026 top-0 left-0 right-0 z-[100]",
        hasScrollBehavior
          ? cn(
              "fixed will-change-transform transition-[transform,opacity] duration-200 ease-in-out",
              "lg:sticky lg:relative lg:will-change-auto",
              isVisible
                ? "translate-y-0 opacity-100"
                : "max-lg:-translate-y-full max-lg:opacity-0 max-lg:pointer-events-none",
              "lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto",
            )
          : "sticky",
      )}
    >
      <div className="mx-auto max-w-7xl px-ds-2 sm:px-ds-3 lg:px-ds-4">
        <div
          className={cn(
            "relative flex min-h-[var(--header-shell-height)] items-center justify-center",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-1))] pb-1",
          )}
        >
          <div className="absolute inset-y-0 left-0 z-[2] flex items-center pl-ds-0.5">
            <RovexoLogo variant="responsive" />
          </div>

          <div className="header-premium-2026__search z-[1] w-full px-[3.75rem] sm:px-[5rem] md:px-[5.5rem] lg:max-w-xl lg:px-[6.5rem]">
            <HeaderSearchBar
              inputId="header-search"
              size="inline"
              placeholder="Search ROVEXO…"
              className="mx-auto w-full"
            />
          </div>

          <div
            className="absolute inset-y-0 right-0 z-[2] flex items-center gap-0 pr-ds-0.5"
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

      <HeaderCategoryBar className="hidden md:block" />
    </header>
  );
}

export default memo(Header);

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <HeaderIconLink href="/notifications" label="Notifications" badge={unreadCount} size="compact">
      <NotificationsMenuIcon className="h-5 w-5" />
    </HeaderIconLink>
  );
}
