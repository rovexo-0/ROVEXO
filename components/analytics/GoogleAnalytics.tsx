"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { Suspense, useEffect, useState } from "react";
import { getGaMeasurementId, isGoogleAnalyticsEnabled } from "@/lib/analytics/ga4-config";
import { GoogleAnalyticsPageView } from "@/components/analytics/GoogleAnalyticsPageView";
import { GoogleAnalyticsQueuedEvents } from "@/components/analytics/GoogleAnalyticsQueuedEvents";
import { readCookieConsent, type CookieConsentChoice } from "@/components/legal/CookieConsentBanner";

/** GA4 loads only after cookie analytics consent (UK). */
export function GoogleAnalytics() {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent());
    function onConsent(event: Event) {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail;
      setConsent(detail);
    }
    window.addEventListener("rovexo:cookie-consent", onConsent);
    return () => window.removeEventListener("rovexo:cookie-consent", onConsent);
  }, []);

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
