import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Blood XXIV — Offline root cause (checkout must never be /offline)", () => {
  it("identifies service worker as the only /offline navigate fallback", () => {
    const sw = readSource("public/sw.js");
    const middleware = readSource("middleware.ts");
    const buyNow = readSource("features/checkout/hooks/use-buy-now-navigation.ts");
    const loader = readSource("features/checkout/lib/load-checkout-page.ts");
    const slug = readSource("features/checkout/components/CheckoutSlugPage.tsx");
    const page = readSource("features/checkout/components/CheckoutPage.tsx");
    const pwa = readSource("components/pwa/PwaProvider.tsx");

    expect(sw).toContain('const OFFLINE_URL = "/offline"');
    expect(sw).toContain("caches.match(OFFLINE_URL)");
    expect(sw).toContain("isFinancialNavigationPath");
    expect(sw).toContain("RVX-2099");
    expect(sw).not.toContain('data-rvx-error="RVX-2010"');
    expect(sw).toContain("Checkout unavailable.");
    expect(sw).toContain("financialCheckoutUnavailableResponse");

    // Blood XXIV Task 002 — RSC flight requests must bypass SW entirely
    expect(sw).toContain("isNextAppRouterFlightRequest");
    expect(sw).toContain('request.headers.get("RSC") === "1"');
    expect(sw).toContain('pathname.startsWith("/_next/")');

    // Non-SW surfaces must not push /offline
    expect(middleware).not.toContain("/offline");
    expect(buyNow).not.toContain("/offline");
    expect(loader).not.toContain("/offline");
    expect(slug).not.toContain("/offline");
    expect(page).not.toContain("/offline");

    // Registration site
    expect(pwa).toContain("navigator.serviceWorker");
    expect(pwa).toContain("ROVEXO_SW_SCRIPT");
  });

  it("never falls financial /checkout navigate back to /offline", () => {
    const sw = readSource("public/sw.js");
    // Financial catch path must return RVX response, not OFFLINE_URL
    expect(sw).toMatch(/if \(financial\)[\s\S]*financialCheckoutUnavailableResponse/);
    expect(sw).toContain('pathname.startsWith("/checkout/")');
  });

  it("never intercepts Next.js RSC payloads (Task 002)", () => {
    const sw = readSource("public/sw.js");
    expect(sw).toMatch(
      /if \(isNextAppRouterFlightRequest\(request, url\.pathname\)\) return;/,
    );
    // Default network-only must not run before the RSC bypass
    const flightIdx = sw.indexOf("isNextAppRouterFlightRequest(request, url.pathname)");
    const networkOnlyIdx = sw.lastIndexOf("event.respondWith(fetch(request));");
    expect(flightIdx).toBeGreaterThan(-1);
    expect(networkOnlyIdx).toBeGreaterThan(flightIdx);
    expect(sw).not.toContain("caches.match(request).then((cached) => cached || fetch(request))");
  });
});
