import { sendGAEvent } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from "@/lib/analytics/ga4-config";

export type Ga4EventName =
  | "page_view"
  | "search"
  | "view_listing"
  | "save_listing"
  | "share_listing"
  | "contact_seller"
  | "start_checkout"
  | "purchase"
  | "create_listing"
  | "edit_listing"
  | "delete_listing"
  | "login"
  | "register"
  | "auction_view"
  | "auction_bid"
  | "watchlist_add"
  | "trust_profile_view"
  /** GA4 recommended aliases used by existing call sites */
  | "sign_up"
  | "view_item"
  | "add_to_favorites"
  | "begin_checkout"
  | "seller_registration"
  | "listing_created"
  | "chat_started";

export type Ga4EventParams = Record<string, string | number | boolean | undefined>;

function sanitizeParams(params?: Ga4EventParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter((entry): entry is [string, string | number | boolean] => {
      return entry[1] !== undefined;
    }),
  );
}

function pushGaEvent(eventName: Ga4EventName, params?: Ga4EventParams): void {
  if (typeof window === "undefined" || !isGoogleAnalyticsEnabled()) {
    return;
  }

  const payload = sanitizeParams(params);

  sendGAEvent("event", eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...payload,
  });
}

export function trackGaPageView(path: string): void {
  if (typeof window === "undefined" || !isGoogleAnalyticsEnabled()) {
    return;
  }

  sendGAEvent("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackGaEvent(eventName: Ga4EventName, params?: Ga4EventParams): void {
  pushGaEvent(eventName, params);
}
