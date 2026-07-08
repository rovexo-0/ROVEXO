"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { RovexoHomepageWordmark } from "@/components/home/RovexoHomepageWordmark";
import { HomepageSearchField } from "@/components/home/HomepageSearchField";
import { RovexoCategoryRail } from "@/components/home/RovexoCategoryRail";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { cn } from "@/lib/cn";
import "@/styles/rovexo/homepage-header.css";

export type HomepageHeaderProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

function HomepageHeaderActions({
  unreadMessages,
  unreadNotifications,
}: {
  unreadMessages: number;
  unreadNotifications: number;
}) {
  return (
    <>
      <HeaderIconLink href="/messages" label="Messages" badge={unreadMessages} size="compact">
        <RovexoIcon icon={RovexoIcons.chat.messages} variant="header" />
      </HeaderIconLink>
      <HeaderIconLink href="/notifications" label="Notifications" badge={unreadNotifications} size="compact">
        <RovexoIcon icon={RovexoIcons.notifications.bell} variant="header" />
      </HeaderIconLink>
      <HeaderProfileLink
        className="homepage-header__profile-link"
        avatarClassName="homepage-header__avatar"
      />
    </>
  );
}

function HomepageHeader({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HomepageHeaderProps) {
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 2);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-header-version="rovexo-v1"
      data-header-layout="homepage"
      className={cn(
        "homepage-header",
        isScrolled && "homepage-header--scrolled",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[220ms] max-lg:ease-in-out max-lg:will-change-[transform,opacity]",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className="homepage-header__inner">
        <div className="homepage-header__row">
          <RovexoHomepageWordmark />
          <div className="homepage-header__search">
            <HomepageSearchField inputId="homepage-search" />
          </div>
          <div className="homepage-header__actions" role="group" aria-label="Quick links">
            <HomepageHeaderActions
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
          </div>
        </div>
        <RovexoCategoryRail className="homepage-header__categories" />
      </div>
    </header>
  );
}

export default memo(HomepageHeader);
