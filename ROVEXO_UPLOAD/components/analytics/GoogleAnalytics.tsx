"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";
import { getGaMeasurementId, isGoogleAnalyticsEnabled } from "@/lib/analytics/ga4-config";
import { GoogleAnalyticsPageView } from "@/components/analytics/GoogleAnalyticsPageView";
import { GoogleAnalyticsQueuedEvents } from "@/components/analytics/GoogleAnalyticsQueuedEvents";

export function GoogleAnalytics() {
  if (!isGoogleAnalyticsEnabled()) {
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
