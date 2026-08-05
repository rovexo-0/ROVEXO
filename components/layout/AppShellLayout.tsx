"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppChromeScrollProvider } from "@/components/layout/AppChromeScrollProvider";

/**
 * AppChromeScrollProvider must be a static import.
 * Dynamic + static dual-loading of the same module (AccountCanonicalHeader
 * imports useAppChromeScroll from this file) breaks Turbopack's module
 * factory after Next 16.x upgrades → "module factory is not available".
 */
const MobileScrollBootstrap = dynamic(
  () =>
    import("@/components/mobile/MobileScrollBootstrap").then(
      (m) => m.MobileScrollBootstrap,
    ),
  { ssr: false },
);
const NavigationPathRecorder = dynamic(
  () =>
    import("@/components/navigation/NavigationPathRecorder").then(
      (m) => m.NavigationPathRecorder,
    ),
  { ssr: false },
);
const PromotionRealtimeRefresher = dynamic(
  () =>
    import("@/components/promotions/PromotionRealtimeRefresher").then(
      (m) => m.PromotionRealtimeRefresher,
    ),
  { ssr: false },
);
const GlobalStickyBundleBar = dynamic(
  () =>
    import("@/features/bundle/GlobalStickyBundleBar").then(
      (m) => m.GlobalStickyBundleBar,
    ),
  { ssr: false },
);

const AUTH_SHELL_DEFER_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/welcome",
  "/splash",
] as const;

function isAuthShellRoute(pathname: string): boolean {
  return AUTH_SHELL_DEFER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** P13.1 — keyboard-only skip link (visible on focus). */
function SkipToMainLink() {
  return (
    <a href="#main-content" className="rovexo-skip-link">
      Skip to content
    </a>
  );
}

/**
 * App shell — RC6/RC7: on auth routes, skip marketplace chrome so login does not
 * download or hydrate bundle/promo/scroll modules. Design unchanged.
 */
export function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const authRoute = isAuthShellRoute(pathname);

  if (authRoute) {
    return (
      <>
        <SkipToMainLink />
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </>
    );
  }

  return (
    <AppChromeScrollProvider>
      <SkipToMainLink />
      <NavigationPathRecorder />
      <PromotionRealtimeRefresher />
      <MobileScrollBootstrap />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
      <GlobalStickyBundleBar />
    </AppChromeScrollProvider>
  );
}
