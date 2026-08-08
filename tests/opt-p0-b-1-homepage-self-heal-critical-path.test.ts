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

function indexOfOrThrow(source: string, needle: string, label: string): number {
  const idx = source.indexOf(needle);
  expect(idx, `${label} missing`).toBeGreaterThanOrEqual(0);
  return idx;
}

describe("OPT-P0-B-1 Homepage TTFB — self-heal off critical path", () => {
  it("does not import or await checkout self-heal on the Homepage entry", () => {
    const page = read("app/(platform)/page.tsx");
    expect(page).not.toContain("awaitCheckoutSessionSelfHeal");
    expect(page).not.toContain("checkout-session-self-heal-server-v1");
    expect(page).not.toContain('awaitCheckoutSessionSelfHeal("homepage")');
  });

  it("keeps searchParams → draft gate → Promise.all data path intact", () => {
    const page = read("app/(platform)/page.tsx");
    const searchParamsIdx = indexOfOrThrow(page, "await searchParams", "searchParams");
    const draftIdx = indexOfOrThrow(page, 'visualPreview === "draft"', "draft preview");
    const promiseAllIdx = indexOfOrThrow(page, "await Promise.all([", "Promise.all");
    const resolveIdx = indexOfOrThrow(
      page,
      "const sections = resolveHomepageV4Sections",
      "resolve sections call",
    );
    const jsonLdIdx = indexOfOrThrow(
      page,
      "const structuredData = homePageJsonLd",
      "JSON-LD call",
    );

    expect(searchParamsIdx).toBeLessThan(draftIdx);
    expect(draftIdx).toBeLessThan(promiseAllIdx);
    expect(promiseAllIdx).toBeLessThan(resolveIdx);
    expect(resolveIdx).toBeLessThan(jsonLdIdx);

    expect(page).toContain("getPlatformVisualConfig");
    expect(page).toContain("fetchHomepageFeed");
    expect(page).toContain("fetchShowcaseSellerSections");
    expect(page).toContain("listActivePreferredMarketplaceStores");
    expect(page).toContain("getAuthContext");
    expect(page).toContain("getUserRole");
    expect(page).toContain("CanonicalHomepage");
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
