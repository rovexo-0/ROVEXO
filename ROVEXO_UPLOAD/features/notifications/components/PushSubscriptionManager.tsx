"use client";

import { useEffect } from "react";
import { subscribeToBrowserPush, unsubscribeFromBrowserPush } from "@/lib/push/client-subscribe";
import { isDocumentVisible } from "@/lib/performance/visibility";

export function PushSubscriptionManager() {
  useEffect(() => {
    let cancelled = false;

    async function syncPushSubscription() {
      if (!isDocumentVisible() || cancelled) return;

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
  }, []);

  return null;
}
