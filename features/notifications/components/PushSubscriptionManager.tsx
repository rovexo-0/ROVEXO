"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { subscribeToBrowserPush, unsubscribeFromBrowserPush } from "@/lib/push/client-subscribe";
import { isDocumentVisible } from "@/lib/performance/visibility";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { createClient } from "@/lib/supabase/client";

const PUBLIC_AUTH_ROUTES: ReadonlySet<string> = new Set([
  AUTH_ROUTES.splash,
  AUTH_ROUTES.welcome,
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.verifyEmail,
  AUTH_ROUTES.resetPassword,
]);

export function PushSubscriptionManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_AUTH_ROUTES.has(pathname)) return;

    let cancelled = false;

    async function syncPushSubscription() {
      if (!isDocumentVisible() || cancelled) return;
      const {
        data: { session },
      } = await createClient().auth.getSession();
      if (!session || cancelled) return;

      const settingsResponse = await fetch("/api/notifications/settings", { cache: "no-store" });
      if (!settingsResponse.ok || cancelled) return;

      const { settings } = (await settingsResponse.json()) as {
        settings: { pushEnabled: boolean; browserPush?: boolean };
      };

      const browserPushEnabled = settings.browserPush ?? true;

      if (settings.pushEnabled && browserPushEnabled) {
        await subscribeToBrowserPush();
      } else {
        await unsubscribeFromBrowserPush();
      }
    }

    void syncPushSubscription();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncPushSubscription();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
