"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { HomepageSearchField } from "@/components/home/HomepageSearchField";
import { HomepageRegisteredUserCounter } from "@/components/header/HomepageRegisteredUserCounter";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";
import { SEARCH_PRIORITY_FREEZE_V1 } from "@/lib/header/search-priority-freeze-v1";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_HEADER_DISPLAY_ASSET,
} from "@/lib/brand/official-brand-application-v1";
import "@/styles/rovexo/header-v2.css";

export type RovexoHeaderV2Props = {
  showSearch?: boolean;
  /** @deprecated notifications removed — Search Priority Freeze */
  unreadNotifications?: number;
  /**
   * Marketplace chrome is identical everywhere (Search Priority Freeze).
   * `account` reserved; account shells use AccountCanonicalHeader instead.
   */
  layout?: "default" | "homepage" | "account";
  /** @deprecated share/avatar actions removed */
  replaceAccountWithShare?: boolean;
};

/** Stable id — never swap on Home ↔ Search so the field does not remount. */
const SEARCH_FIELD_ID = "rx-h2-search";

/**
 * Scroll chrome owns `isScrolled` so logo + search children keep a stable
 * element identity and do not re-render on scroll class toggles.
 */
function HeaderScrollShell({
  isAccountLayout,
  children,
}: {
  isAccountLayout: boolean;
  children: ReactNode;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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
      data-header-freeze="v1.0-locked"
      data-search-priority-freeze={SEARCH_PRIORITY_FREEZE_V1.version}
      data-header-search-first="true"
      data-homepage-chrome-scroll="excluded"
      className={cn(
        "rx-h2",
        isAccountLayout && "rx-h2--account",
        isScrolled && "rx-h2--scrolled",
      )}
    >
      <div className={cn("rx-h2__inner", isAccountLayout && "rx-h2__inner--row1")}>{children}</div>
    </header>
  );
}

/**
 * ROVEXO HEADER v1.0 — SEARCH PRIORITY FREEZE
 * Purpose: SEARCH only. Stateless. Identical on Home / Search / Results / Discovery.
 * Homepage is excluded from compact hide-on-scroll (Owner) — chrome stays visible.
 */
function RovexoHeaderV2({ showSearch = true, layout = "default" }: RovexoHeaderV2Props) {
  const isAccountLayout = layout === "account";

  void HEADER_MASTER_FREEZE_V1.searchFirstMinimalist;
  void SEARCH_PRIORITY_FREEZE_V1.identicalMarketplaceChrome;
  /* Brand freezes XXXVIII/XXXIX/XLI — Level III identity remains the master constant. */
  void OFFICIAL_BRAND_APP_ICON;

  return (
    <HeaderScrollShell isAccountLayout={isAccountLayout}>
      <Link
        href="/"
        aria-label="ROVEXO Home"
        className={cn("rx-h2__logo", focusRing)}
        data-auth-brand-freeze="XXXIX"
        data-auth-experience-freeze="XLI"
        data-brand-level="III_APP_ICON"
      >
        <SafeImage
          src={OFFICIAL_BRAND_HEADER_DISPLAY_ASSET}
          alt="ROVEXO"
          width={28}
          height={28}
          className="rx-h2__logo-img"
          priority
        />
      </Link>

      {showSearch && !isAccountLayout ? (
        <div className="rx-h2__search">
          <HomepageSearchField inputId={SEARCH_FIELD_ID} className="rx-h2-search" />
        </div>
      ) : null}

      {/* Owner COD SÂNGE — Registered User Counter (right of Search, same row) */}
      {showSearch && !isAccountLayout ? <HomepageRegisteredUserCounter /> : null}
    </HeaderScrollShell>
  );
}

export default memo(RovexoHeaderV2);
