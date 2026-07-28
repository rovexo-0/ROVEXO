"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";
import { SEARCH_PRIORITY_FREEZE_V1 } from "@/lib/header/search-priority-freeze-v1";
import {
  HOMEPAGE_SEARCH_BAR_ONLY_V1,
  isHomepageSearchBarRoute,
} from "@/lib/header/homepage-search-bar-only-v1";
import "@/styles/rovexo/header-v2.css";

type HeaderChrome = {
  showSearch: boolean;
  /**
   * Homepage Search Bar Only — mount marketplace ROVEXO + Search solely on `/`.
   * Everywhere else: unmount (CSS hide forbidden).
   */
  mount: boolean;
};

function resolveHeaderChrome(pathname: string): HeaderChrome {
  if (isHomepageSearchBarRoute(pathname)) {
    return { showSearch: true, mount: true };
  }
  return { showSearch: false, mount: false };
}

/**
 * ONE ROVEXO Header — Search Bar mounts on Homepage only (permanent Owner freeze).
 * Off Homepage: component does not exist (unmounted, never CSS-hidden).
 */
export function HeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const chrome = useMemo(() => resolveHeaderChrome(pathname), [pathname]);

  void HEADER_MASTER_FREEZE_V1.oneHeaderOnly;
  void SEARCH_PRIORITY_FREEZE_V1.headerStateless;
  void HOMEPAGE_SEARCH_BAR_ONLY_V1.mustBe;

  return (
    <>
      {chrome.mount ? (
        <div
          data-header-provider="v1.0"
          data-search-priority-freeze={SEARCH_PRIORITY_FREEZE_V1.version}
          data-homepage-search-only={HOMEPAGE_SEARCH_BAR_ONLY_V1.version}
          data-header-visible="true"
        >
          <RovexoHeaderV2 layout="default" showSearch={chrome.showSearch} />
        </div>
      ) : null}
      {children}
    </>
  );
}
