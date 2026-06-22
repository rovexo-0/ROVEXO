"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { RovexoLogo } from "@/components/brand/RovexoLogo";
import { HeaderCategoryBar } from "@/components/header/HeaderCategoryBar";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { SearchBar } from "@/components/ui/SearchBar";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { MessagesMenuIcon, NotificationsMenuIcon } from "@/features/profile/icons";

export type HeaderProps = {
  isSeller?: boolean;
  unreadNotifications?: number;
  unreadMessages?: number;
};

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}

const HeaderActions = memo(function HeaderActions({
  unreadMessages,
  unreadNotifications,
}: {
  unreadMessages: number;
  unreadNotifications: number;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5" role="group" aria-label="Quick links">
      <HeaderIconLink href="/messages" label="Messages" badge={unreadMessages}>
        <MessagesMenuIcon className="h-5 w-5" />
      </HeaderIconLink>
      <HeaderIconLink href="/notifications" label="Notifications" badge={unreadNotifications}>
        <NotificationsMenuIcon className="h-5 w-5" />
      </HeaderIconLink>
    </div>
  );
});

const HeaderAccountLink = memo(function HeaderAccountLink() {
  return (
    <HeaderIconLink href="/account" label="Account" className="hidden xl:inline-flex">
      <AccountIcon className="h-5 w-5" />
    </HeaderIconLink>
  );
});

function Header({
  isSeller,
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HeaderProps) {
  const searchOverlay = useSearchOverlayOptional();
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const headerRef = useRef<HTMLElement>(null);
  const liveBadges = useHeaderBadges({
    unreadMessages: unreadMessagesProp,
    unreadNotifications: unreadNotificationsProp,
  });

  const unreadMessages = Math.max(unreadMessagesProp, liveBadges.unreadMessages);
  const unreadNotifications = Math.max(unreadNotificationsProp, liveBadges.unreadNotifications);
  const showSellerTools = isSeller ?? searchOverlay?.isSeller ?? false;
  const isVisible = scroll?.isVisible ?? true;

  useLayoutEffect(() => {
    registerHeader?.(headerRef.current);
    return () => registerHeader?.(null);
  }, [registerHeader]);

  return (
    <header
      ref={headerRef}
      data-header-version="v2"
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] border-b border-border",
        "bg-background/95 shadow-ds-soft backdrop-blur-md supports-[backdrop-filter]:bg-background/90",
        "will-change-transform transition-[transform,opacity] duration-200 ease-in-out",
        "lg:sticky lg:relative lg:z-50 lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto",
        isVisible
          ? "translate-y-0 opacity-100"
          : "max-lg:-translate-y-full max-lg:opacity-0 max-lg:pointer-events-none",
      )}
    >
      <div className="mx-auto max-w-7xl px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        {/* Mobile: Logo → Search → Messages + Notifications */}
        <div className="flex flex-col gap-ds-3 md:hidden">
          <RovexoLogo className="shrink-0" />
          <SearchBar
            inputId="header-search"
            overlay
            variant="header"
            hideSubmitButton
            showAiCamera={showSellerTools}
            placeholder="Search products..."
          />
          <div className="flex items-center justify-end gap-2.5">
            <HeaderActions
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
          </div>
        </div>

        {/* Tablet & desktop: Logo | Search | Messages | Notifications [| Account] */}
        <div className="hidden md:flex md:w-full md:items-center md:gap-ds-4">
          <RovexoLogo className="shrink-0" />

          <div className="min-w-0 flex-1 md:mx-auto md:max-w-2xl lg:max-w-3xl">
            <SearchBar
              inputId="header-search-desktop"
              overlay
              variant="header"
              hideSubmitButton
              showAiCamera={showSellerTools}
              placeholder="Search products..."
            />
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <HeaderActions
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
            <HeaderAccountLink />
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
    <HeaderIconLink href="/notifications" label="Notifications" badge={unreadCount}>
      <NotificationsMenuIcon className="h-5 w-5" />
    </HeaderIconLink>
  );
}
