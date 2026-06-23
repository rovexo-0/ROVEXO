"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { RovexoLogo } from "@/components/brand/RovexoLogo";
import { HeaderCategoryBar } from "@/components/header/HeaderCategoryBar";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HeaderSearchBar } from "@/components/header/HeaderSearchBar";
import { HeaderSellButton } from "@/components/header/HeaderSellButton";
import { HeaderWishlistLink } from "@/components/header/HeaderWishlistLink";
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
        <MessagesMenuIcon className="h-[1.125rem] w-[1.125rem]" />
      </HeaderIconLink>
      <HeaderIconLink
        href="/notifications"
        label="Notifications"
        badge={unreadNotifications}
        size="compact"
      >
        <NotificationsMenuIcon className="h-[1.125rem] w-[1.125rem]" />
      </HeaderIconLink>
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
      data-header-version="mobile-v1"
      className={cn(
        "top-0 left-0 right-0 z-[100] border-b border-border/60",
        "premium-glass premium-depth-1 shadow-[var(--ds-depth-2)]",
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
      <div className="mx-auto max-w-7xl px-ds-3 lg:px-ds-4">
        <div
          className={cn(
            "flex min-h-[var(--header-shell-height)] flex-nowrap items-center gap-ds-2",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-2))] pb-ds-2",
          )}
        >
          <RovexoLogo variant="mark" className="shrink-0 sm:hidden" />
          <RovexoLogo variant="compact" className="hidden shrink-0 sm:inline-flex" />

          <HeaderSearchBar
            inputId="header-search"
            size="inline"
            placeholder="Search for anything..."
            className="min-w-0 flex-1 max-sm:[&_input]:placeholder:text-[11px]"
          />

          <div
            className="flex shrink-0 flex-nowrap items-center gap-0.5"
            role="group"
            aria-label="Quick links"
          >
            <HeaderWishlistLink size="compact" className="md:hidden" />
            <HeaderActions
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
            <HeaderProfileLink />
            <HeaderWishlistLink size="compact" className="hidden md:inline-flex" />
            <HeaderSellButton className="hidden lg:inline-flex" />
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
      <NotificationsMenuIcon className="h-[1.125rem] w-[1.125rem]" />
    </HeaderIconLink>
  );
}
