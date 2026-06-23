/** Google Analytics 4 measurement ID (public — safe for client bundles). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-RNEMD5BT0S";

export const GA_QUEUED_EVENTS_COOKIE = "rovexo_ga_events";

/** Load GA in production only, unless explicitly debugging locally. */
export function isGoogleAnalyticsEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return Boolean(GA_MEASUREMENT_ID);
  }

  return process.env.NEXT_PUBLIC_GA_DEBUG === "true";
}

export function getGaMeasurementId(): string {
  return GA_MEASUREMENT_ID;
}
