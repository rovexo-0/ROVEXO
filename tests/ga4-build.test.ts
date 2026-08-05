import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/ga4-config";

describe("Google Analytics 4 production build output", () => {
  it("keeps the canonical measurement ID configured", () => {
    expect(GA_MEASUREMENT_ID).toMatch(/^G-/);
    expect(GA_MEASUREMENT_ID).toBe(
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-RNEMD5BT0S",
    );
  });

  it("gates GA4 behind UK cookie analytics consent (not unconditional prerender embed)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/analytics/GoogleAnalytics.tsx"),
      "utf8",
    );
    expect(source).toContain("consent !== \"accepted\"");
    expect(source).toContain("NextGoogleAnalytics");
    expect(source).toContain("getGaMeasurementId");
  });

  it("allows gtag hosts in production CSP when consent loads analytics", () => {
    const headers = readFileSync(
      path.join(process.cwd(), "lib/ops/security-headers.ts"),
      "utf8",
    );
    expect(headers).toContain("https://www.googletagmanager.com");
    expect(headers).toContain("https://www.google-analytics.com");
  });

  it("does not require GA scripts in prerendered HTML before consent", () => {
    const htmlPath = path.join(process.cwd(), ".next/server/pages/404.html");
    if (!existsSync(htmlPath)) {
      return;
    }

    const html = readFileSync(htmlPath, "utf8");
    // Consent-gated: measurement ID must not be force-injected into anonymous SSR HTML.
    // (Previous always-on embed expectation conflicted with UK cookie law.)
    expect(html.includes("googletagmanager.com/gtag/js?id=G-RNEMD5BT0S")).toBe(false);
  });
});
