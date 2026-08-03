"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const AUTH_CHROME_DEFER_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/welcome",
  "/splash",
] as const;

function isAuthChromeDeferredRoute(pathname: string): boolean {
  return AUTH_CHROME_DEFER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const GoogleAnalytics = dynamic(
  () => import("@/components/analytics/GoogleAnalytics").then((m) => m.GoogleAnalytics),
  { ssr: false },
);
const CookieConsentBanner = dynamic(
  () =>
    import("@/components/legal/CookieConsentBanner").then((m) => m.CookieConsentBanner),
  { ssr: false },
);
const VisitorPresenceBeacon = dynamic(
  () =>
    import("@/components/analytics/VisitorPresenceBeacon").then(
      (m) => m.VisitorPresenceBeacon,
    ),
  { ssr: false },
);
const PushSubscriptionManager = dynamic(
  () =>
    import("@/features/notifications/components/PushSubscriptionManager").then(
      (m) => m.PushSubscriptionManager,
    ),
  { ssr: false },
);

/**
 * RC6/RC7 — defer non-critical chrome on auth routes.
 * Dynamic imports keep GA/cookies/presence/push out of the login JS graph.
 */
export function AuthChromeDeferred({
  children,
  mode = "passthrough",
}: {
  children?: ReactNode;
  /** When `platform-chrome`, render deferred platform beacons (no children). */
  mode?: "passthrough" | "platform-chrome";
}) {
  const pathname = usePathname() ?? "";
  if (isAuthChromeDeferredRoute(pathname)) {
    return null;
  }
  if (mode === "platform-chrome") {
    return (
      <>
        <PushSubscriptionManager />
        <GoogleAnalytics />
        <CookieConsentBanner />
        <VisitorPresenceBeacon />
      </>
    );
  }
  return <>{children}</>;
}
