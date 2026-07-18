"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { Suspense, useSyncExternalStore } from "react";
import { getGaMeasurementId, isGoogleAnalyticsEnabled } from "@/lib/analytics/ga4-config";
import { GoogleAnalyticsPageView } from "@/components/analytics/GoogleAnalyticsPageView";
import { GoogleAnalyticsQueuedEvents } from "@/components/analytics/GoogleAnalyticsQueuedEvents";
import { readCookieConsent, type CookieConsentChoice } from "@/components/legal/CookieConsentBanner";

function subscribeCookieConsent(onStoreChange: () => void) {
  window.addEventListener("rovexo:cookie-consent", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("rovexo:cookie-consent", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCookieConsentSnapshot(): CookieConsentChoice | null {
  return readCookieConsent();
}

function getCookieConsentServerSnapshot(): CookieConsentChoice | null {
  return null;
}

/** GA4 loads only after cookie analytics consent (UK). */
export function GoogleAnalytics() {
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );

  if (!isGoogleAnalyticsEnabled() || consent !== "accepted") {
    return null;
  }

  const gaId = getGaMeasurementId();

  return (
    <>
      <NextGoogleAnalytics gaId={gaId} />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
      <GoogleAnalyticsQueuedEvents />
    </>
  );
}
