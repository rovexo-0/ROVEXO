"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { HomepageSearchField } from "@/components/home/HomepageSearchField";
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

export type RovexoHeaderV2Props = {
  showSearch?: boolean;
  /** @deprecated notifications removed — Header Simplification v1.0 */
  unreadNotifications?: number;
  /**
   * homepage | default — both render ROVEXO + full-width search (no avatar / notifications).
   * account — wordmark-only chrome (rarely used; account shells use AccountCanonicalHeader).
   */
  layout?: "default" | "homepage" | "account";
  /** @deprecated share/avatar actions removed — Header Simplification v1.0 */
  replaceAccountWithShare?: boolean;
};

/**
 * ROVEXO HEADER v1.0 — MINIMALIST · SEARCH FIRST · FULL WIDTH SEARCH BAR
 * LEVEL 8 APPROVED Header Simplification.
 * Forbidden: Notification icon · Avatar · badges · header profile fetch.
 */
function RovexoHeaderV2({
  showSearch = true,
  layout = "default",
}: RovexoHeaderV2Props) {
  const isAccountLayout = layout === "account";
  const scroll = useMobileHeaderScrollContext();
  const registerHeader = scroll?.registerHeader;
  const isChromeVisible = scroll?.isVisible ?? true;
  const hasScrollBehavior = Boolean(scroll);
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  void HEADER_MASTER_FREEZE_V1.searchFirstMinimalist;

  const searchId =
    layout === "homepage" ? "hp-canonical-search" : "rx-h2-search";

  return (
    <header
      ref={headerRef}
      data-header-version="rovexo-v2"
      data-header-freeze="v1.0-locked"
      data-header-simplification="v1.0"
      data-header-search-first="true"
      className={cn(
        "rx-h2",
        layout === "homepage" && "rx-h2--homepage",
        isAccountLayout && "rx-h2--account",
        isScrolled && "rx-h2--scrolled",
        hasScrollBehavior &&
          "max-lg:transition-[transform,opacity] max-lg:duration-[200ms] max-lg:ease-out",
        hasScrollBehavior && !isChromeVisible && "max-lg:-translate-y-full max-lg:opacity-0",
      )}
    >
      <div className={cn("rx-h2__inner", isAccountLayout && "rx-h2__inner--row1")}>
        <Link href="/" aria-label="ROVEXO Home" className={cn("rx-h2__logo", focusRing)}>
          <span className="rx-h2__logo-text">ROVEXO</span>
        </Link>

        {showSearch && !isAccountLayout ? (
          <div className="rx-h2__search">
            <HomepageSearchField
              inputId={searchId}
              className={cn(
                "rx-h2-search",
                layout === "homepage" && "rx-h2-search--homepage",
              )}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default memo(RovexoHeaderV2);
