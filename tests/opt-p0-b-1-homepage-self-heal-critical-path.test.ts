/**
 * OPT-P0-B-1 — Homepage must not block SSR on checkout-session self-heal.
 * Engine + commerce ownership remain intact elsewhere.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("OPT-P0-B-1 Homepage TTFB — self-heal off critical path", () => {
  it("does not import or await checkout self-heal on the Homepage entry", () => {
    const page = read("app/(platform)/page.tsx");
    expect(page).not.toContain("awaitCheckoutSessionSelfHeal");
    expect(page).not.toContain("checkout-session-self-heal-server-v1");
    expect(page).not.toContain('awaitCheckoutSessionSelfHeal("homepage")');
  });

  it("keeps public document data path intact without blocking Dynamic APIs on `/`", () => {
    const page = read("app/(platform)/page.tsx");
    expect(page).not.toContain("await searchParams");
    expect(page).not.toContain("getAuthContext");
    expect(page).toContain("loadHomepageDocumentData");
    expect(page).toContain('previewMode: "live"');
    expect(page).toContain("homePageJsonLd");
    expect(page).toContain("CanonicalHomepage");

    const loader = read("lib/homepage/load-homepage-document.ts");
    expect(loader).toContain("await Promise.all([");
    expect(loader).toContain("getPlatformVisualConfig");
    expect(loader).toContain("fetchHomepageFeed");
    expect(loader).toContain("fetchShowcaseSellerSections");
    expect(loader).toContain("listActivePreferredMarketplaceStores");
    expect(loader).toContain("resolveHomepageV4Sections");

    const draft = read("app/(platform)/homepage-visual-draft/page.tsx");
    expect(draft).toContain("getAuthContext");
    expect(draft).toContain("getUserRole");
    expect(draft).toContain('role === "super_admin"');
  });

  it("preserves checkout self-heal engine and commerce owners", () => {
    expect(existsSync(path.join(ROOT, "lib/checkout/checkout-session-self-heal-server-v1.ts"))).toBe(
      true,
    );
    expect(existsSync(path.join(ROOT, "lib/checkout/engines/checkout-session-engine-v1.ts"))).toBe(
      true,
    );

    const engine = read("lib/checkout/engines/checkout-session-engine-v1.ts");
    expect(engine).toContain("CHECKOUT_SESSION_ENGINE_selfHeal");
    expect(engine).toContain("CHECKOUT_SESSION_ENGINE_expireAll");

    const owners: Array<[string, string]> = [
      ["app/(platform)/listing/[slug]/page.tsx", "listing-view"],
      ["app/(platform)/orders/page.tsx", "orders"],
      ["app/(platform)/wallet/page.tsx", "wallet"],
      ["app/(platform)/seller/page.tsx", "seller-dashboard"],
    ];
    for (const [file, reason] of owners) {
      const src = read(file);
      expect(src).toContain("awaitCheckoutSessionSelfHeal");
      expect(src).toContain(`"${reason}"`);
    }

    expect(read("app/api/checkout/expire-stale/route.ts")).toContain(
      "CHECKOUT_SESSION_ENGINE_selfHeal",
    );
    expect(read("lib/checkout/checkout-session-self-heal-client-v1.ts")).toContain(
      "triggerCheckoutSessionSelfHeal",
    );
    expect(read("features/notifications/components/RealtimeNotificationProvider.tsx")).toContain(
      "triggerCheckoutSessionSelfHeal",
    );
  });
});
