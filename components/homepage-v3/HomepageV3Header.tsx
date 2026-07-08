"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HomepageV3Wordmark } from "@/components/homepage-v3/HomepageV3Wordmark";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { cn } from "@/lib/cn";

export type HomepageV3HeaderProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

function HomepageV3Header({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HomepageV3HeaderProps) {
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
    const onScroll = () => setIsScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-header-version="rovexo-v3"
      data-header-layout="homepage"
      className={cn(
        "hp3-header",
        isScrolled && "hp3-header--scrolled",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[220ms] max-lg:ease-in-out",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className="hp3-header__inner">
        <HomepageV3Wordmark />
        <div className="hp3-header__actions" role="group" aria-label="Quick links">
          <HeaderIconLink href="/messages" label="Messages" badge={unreadMessages} size="compact">
            <RovexoIcon icon={RovexoIcons.chat.messages} variant="header" />
          </HeaderIconLink>
          <HeaderIconLink href="/notifications" label="Notifications" badge={unreadNotifications} size="compact">
            <RovexoIcon icon={RovexoIcons.notifications.bell} variant="header" />
          </HeaderIconLink>
          <HeaderProfileLink className="hp3-header__profile" avatarClassName="hp3-header__avatar" />
        </div>
      </div>
    </header>
  );
}

export default memo(HomepageV3Header);
