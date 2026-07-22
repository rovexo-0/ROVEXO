"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { cn } from "@/lib/cn";
import { AUTH_PUBLIC_PREFIXES, AUTH_SUPER_ADMIN_PREFIXES } from "@/lib/auth/protected-routes";
import { isSellFlowRoute } from "@/lib/navigation/sell-flow-routes";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";
import { SEARCH_PRIORITY_FREEZE_V1 } from "@/lib/header/search-priority-freeze-v1";
import "@/styles/rovexo/header-v2.css";

type HeaderChrome = {
  /** When false, header stays mounted but visually hidden (survives navigation). */
  visible: boolean;
  showSearch: boolean;
};

const ACCOUNT_SHELL_PREFIXES = [
  "/account",
  "/wallet",
  "/orders",
  "/buyer",
  "/seller",
  "/business",
  "/settings",
  "/checkout",
  "/cart",
  "/payments",
  "/protection",
  "/shipping",
  "/resolution",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function resolveHeaderChrome(pathname: string): HeaderChrome {
  if (!pathname || matchesPrefix(pathname, AUTH_PUBLIC_PREFIXES)) {
    return { visible: false, showSearch: true };
  }
  if (matchesPrefix(pathname, AUTH_SUPER_ADMIN_PREFIXES) || pathname.startsWith("/staff")) {
    return { visible: false, showSearch: true };
  }
  if (isSellFlowRoute(pathname)) {
    return { visible: false, showSearch: true };
  }
  if (matchesPrefix(pathname, ACCOUNT_SHELL_PREFIXES)) {
    // Account modules: Back + Title only (AccountCanonicalHeader) — never search header.
    return { visible: false, showSearch: true };
  }
  // Home / Search / Image / Discovery / Categories / Brands — identical marketplace chrome.
  return { visible: true, showSearch: true };
}

/**
 * ONE ROVEXO Header — Search Priority Freeze.
 * Identical UI on all marketplace surfaces. Never unmounts on Soft Nav.
 */
export function HeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const chrome = useMemo(() => resolveHeaderChrome(pathname), [pathname]);

  void HEADER_MASTER_FREEZE_V1.oneHeaderOnly;
  void SEARCH_PRIORITY_FREEZE_V1.headerStateless;

  return (
    <>
      <div
        data-header-provider="v1.0"
        data-search-priority-freeze={SEARCH_PRIORITY_FREEZE_V1.version}
        data-header-visible={chrome.visible ? "true" : "false"}
        className={cn(!chrome.visible && "hidden")}
        aria-hidden={!chrome.visible}
      >
        <RovexoHeaderV2 layout="default" showSearch={chrome.showSearch} />
      </div>
      {children}
    </>
  );
}
