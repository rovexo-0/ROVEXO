"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare } from "lucide-react";
import { HomepageSearchField } from "@/components/home/HomepageSearchField";
import { HeaderV2IconLink } from "@/components/header/HeaderV2IconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HomepageHeaderShareButton } from "@/components/header/HomepageHeaderShareButton";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type RovexoHeaderV2Props = {
  showSearch?: boolean;
  unreadNotifications?: number;
  unreadMessages?: number;
  /** Homepage only — replaces Account/Avatar with Share. */
  replaceAccountWithShare?: boolean;
};

const HEADER_LUCIDE_ICON = {
  size: 20,
  strokeWidth: 1.75,
  "aria-hidden": true,
} as const;

function RovexoHeaderV2({
  showSearch = true,
  unreadNotifications: unreadNotificationsProp = 0,
  unreadMessages: unreadMessagesProp = 0,
  replaceAccountWithShare = false,
}: RovexoHeaderV2Props) {
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
      data-header-version="rovexo-v2"
      data-header-share={replaceAccountWithShare ? "homepage" : undefined}
      className={cn(
        "rx-h2",
        isScrolled && "rx-h2--scrolled",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[200ms] max-lg:ease-out",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className="rx-h2__inner">
        <Link href="/" aria-label="ROVEXO Home" className={cn("rx-h2__logo", focusRing)}>
          <span className="rx-h2__logo-text">ROVEXO</span>
        </Link>

        {showSearch ? (
          <div className="rx-h2__search">
            <HomepageSearchField inputId="rx-h2-search" className="rx-h2-search" />
          </div>
        ) : (
          <div className="rx-h2__search rx-h2__search--hidden" aria-hidden />
        )}

        <div className="rx-h2__actions" role="group" aria-label="Quick links">
          <HeaderV2IconLink
            href="/messages"
            label="Messages"
            badge={unreadMessages}
            className="rx-h2__action--messages"
          >
            <MessageSquare {...HEADER_LUCIDE_ICON} className="rx-h2__lucide" />
          </HeaderV2IconLink>
          <HeaderV2IconLink
            href="/notifications"
            label="Notifications"
            badge={unreadNotifications}
            className="rx-h2__action--notifications"
          >
            <Bell {...HEADER_LUCIDE_ICON} className="rx-h2__lucide" />
          </HeaderV2IconLink>
          {replaceAccountWithShare ? (
            <HomepageHeaderShareButton className="rx-h2__share" />
          ) : (
            <HeaderProfileLink
              className="rx-h2__account"
              avatarClassName="rx-h2__account-avatar"
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(RovexoHeaderV2);
