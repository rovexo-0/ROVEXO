import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from "@/lib/analytics/ga4-config";

export type Ga4EventName =
  | "sign_up"
  | "login"
  | "search"
  | "view_item"
  | "add_to_favorites"
  | "begin_checkout"
  | "purchase"
  | "seller_registration"
  | "listing_created"
  | "chat_started";

export type Ga4EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getGtag() {
  if (typeof window === "undefined" || !isGoogleAnalyticsEnabled()) {
    return null;
  }

  return typeof window.gtag === "function" ? window.gtag : null;
}

export function trackGaPageView(path: string): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackGaEvent(eventName: Ga4EventName, params?: Ga4EventParams): void {
  const gtag = getGtag();
  if (!gtag) return;

  const payload = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined),
  );

  gtag("event", eventName, payload);
}
