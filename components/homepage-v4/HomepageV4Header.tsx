"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HomepageV4Wordmark } from "@/components/homepage-v4/HomepageV4Wordmark";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { cn } from "@/lib/cn";

export type HomepageV4HeaderProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

function HomepageV4Header({
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
}: HomepageV4HeaderProps) {
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
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-header-version="rovexo-v4"
      data-header-layout="homepage"
      className={cn(
        "rx4-topbar",
        isScrolled && "rx4-topbar--elevated",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[200ms] max-lg:ease-out",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className="rx4-topbar__inner">
        <HomepageV4Wordmark />
        <div className="rx4-topbar__actions" role="group" aria-label="Quick links">
          <HeaderIconLink href="/messages" label="Messages" badge={unreadMessages} size="compact">
            <RovexoIcon icon={RovexoIcons.chat.messages} variant="header" />
          </HeaderIconLink>
          <HeaderIconLink
            href="/notifications"
            label="Notifications"
            badge={unreadNotifications}
            size="compact"
          >
            <RovexoIcon icon={RovexoIcons.notifications.bell} variant="header" />
          </HeaderIconLink>
          <HeaderProfileLink className="rx4-topbar__profile" avatarClassName="rx4-topbar__avatar" />
        </div>
      </div>
    </header>
  );
}

export default memo(HomepageV4Header);
