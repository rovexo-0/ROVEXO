"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const AppChromeScrollProvider = dynamic(
  () =>
    import("@/components/layout/AppChromeScrollProvider").then(
      (m) => m.AppChromeScrollProvider,
    ),
  { ssr: true },
);
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

/**
 * App shell — RC6/RC7: on auth routes, skip marketplace chrome so login does not
 * download or hydrate bundle/promo/scroll modules. Design unchanged.
 */
export function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const authRoute = isAuthShellRoute(pathname);

  if (authRoute) {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }

  return (
    <AppChromeScrollProvider>
      <NavigationPathRecorder />
      <PromotionRealtimeRefresher />
      <MobileScrollBootstrap />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
      <GlobalStickyBundleBar />
    </AppChromeScrollProvider>
  );
}
