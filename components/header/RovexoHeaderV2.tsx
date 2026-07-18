"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellLineIcon } from "@/components/icons/RvxLineIcons";
import { HomepageSearchField } from "@/components/home/HomepageSearchField";
import { HeaderV2IconLink } from "@/components/header/HeaderV2IconLink";
import { HeaderProfileLink } from "@/components/header/HeaderProfileLink";
import { HomepageHeaderShareButton } from "@/components/header/HomepageHeaderShareButton";
import { RovexoWordmark } from "@/components/brand/RovexoWordmark";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { useHeaderBadges } from "@/features/header/hooks/use-header-badges";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type RovexoHeaderV2Props = {
  showSearch?: boolean;
  unreadNotifications?: number;
  /** Homepage — search row only (logo + notification icon removed by PO contract). */
  layout?: "default" | "homepage" | "account";
  /** Non-homepage — replaces Account/Avatar with Share. */
  replaceAccountWithShare?: boolean;
};

function RovexoHeaderV2({
  showSearch = true,
  unreadNotifications: unreadNotificationsProp = 0,
  layout = "default",
  replaceAccountWithShare = false,
}: RovexoHeaderV2Props) {
  const isHomepageLayout = layout === "homepage";
  const isAccountLayout = layout === "account";
  const isWordmarkLayout = isAccountLayout;
  const inlineSearch = showSearch && !isHomepageLayout && !isAccountLayout;
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const liveBadges = useHeaderBadges({
    unreadNotifications: unreadNotificationsProp,
  });

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
        isHomepageLayout && "rx-h2--homepage",
        isAccountLayout && "rx-h2--account",
        isScrolled && "rx-h2--scrolled",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[200ms] max-lg:ease-out",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      {!isHomepageLayout ? (
        <div className={cn("rx-h2__inner", isWordmarkLayout && "rx-h2__inner--row1")}>
          {isWordmarkLayout ? (
            <RovexoWordmark asLink className="rx-h2__wordmark" />
          ) : (
            <Link href="/" aria-label="ROVEXO Home" className={cn("rx-h2__logo", focusRing)}>
              <span className="rx-h2__logo-text">ROVEXO</span>
            </Link>
          )}

          {inlineSearch ? (
            <div className="rx-h2__search">
              <HomepageSearchField inputId="rx-h2-search" className="rx-h2-search" />
            </div>
          ) : !isAccountLayout ? (
            <div className="rx-h2__search rx-h2__search--hidden" aria-hidden />
          ) : null}

          <div
            className={cn("rx-h2__actions", isAccountLayout && "rx-h2__actions--homepage")}
            role="group"
            aria-label="Quick links"
          >
            <HeaderV2IconLink
              href="/notifications"
              label="Notifications"
              badge={unreadNotifications}
              className="rx-h2__action--notifications"
            >
              <BellLineIcon className="rx-h2__lucide h-5 w-5" />
            </HeaderV2IconLink>
            {!isWordmarkLayout && replaceAccountWithShare ? (
              <HomepageHeaderShareButton className="rx-h2__share" />
            ) : !isWordmarkLayout ? (
              <HeaderProfileLink
                className="rx-h2__account"
                avatarClassName="rx-h2__account-avatar"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {isHomepageLayout ? (
        <div className="rx-h2__search-row">
          <HomepageSearchField inputId="hp-canonical-search" className="rx-h2-search rx-h2-search--homepage" />
        </div>
      ) : null}
    </header>
  );
}

export default memo(RovexoHeaderV2);
