import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/ga4-config";

describe("Google Analytics 4", () => {
  it("uses the ROVEXO measurement ID by default", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-RNEMD5BT0S");
  });

  it("loads gtag via next/script in the root layout", () => {
    const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).toContain("GoogleAnalytics");
  });

  it("initializes GA with send_page_view disabled for App Router tracking", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/analytics/GoogleAnalytics.tsx"),
      "utf8",
    );
    expect(source).toContain("next/script");
    expect(source).toContain("googletagmanager.com/gtag/js");
    expect(source).toContain("send_page_view: false");
    expect(source).toContain("GoogleAnalyticsPageView");
  });

  it("tracks route changes with page_view events", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/analytics/GoogleAnalyticsPageView.tsx"),
      "utf8",
    );
    expect(source).toContain("usePathname");
    expect(source).toContain("trackGaPageView");
  });

  it("exports required custom event names", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/analytics/ga4-events.ts"), "utf8");
    for (const event of [
      "sign_up",
      "login",
      "search",
      "view_item",
      "add_to_favorites",
      "begin_checkout",
      "purchase",
      "seller_registration",
      "listing_created",
      "chat_started",
    ]) {
      expect(source).toContain(`"${event}"`);
    }
  });

  it("only loads analytics in production or debug mode", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/analytics/ga4-config.ts"),
      "utf8",
    );
    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('process.env.NEXT_PUBLIC_GA_DEBUG === "true"');
  });
});
