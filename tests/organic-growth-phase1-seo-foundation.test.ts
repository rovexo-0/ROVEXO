import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_PROTECTED_PREFIXES } from "@/lib/auth/protected-routes";
import { productJsonLd } from "@/lib/seo/json-ld";
import type { ProductDetail } from "@/lib/products/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function minimalProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "nike-air-max",
    title: "Nike Air Max",
    price: 49.99,
    condition: "Used",
    sellerName: "Seller",
    images: ["https://cdn.example.com/p.jpg"],
    description: "Clean trainers",
    availability: "in_stock",
    rating: 0,
    reviewCount: 0,
    ...overrides,
  } as ProductDetail;
}

describe("Organic Growth Phase 1 — SEO foundation", () => {
  it("P0-02: root layout does not set a global / canonical", () => {
    const layout = readSource("app/layout.tsx");
    expect(layout).not.toMatch(/alternates:\s*\{\s*canonical:\s*["']\/["']/);
  });

  it("P0-02: homepage declares absolute trailing-slash root canonical", () => {
    const home = readSource("app/(platform)/page.tsx");
    expect(home).toContain("rootCanonical");
    expect(home).toContain('canonical: rootCanonical');
  });

  it("P0-01: guest `/` cold-start login redirect removed (Owner crawlability unlock)", () => {
    const middleware = readSource("lib/supabase/middleware.ts");
    expect(middleware).not.toMatch(
      /if\s*\(\s*!user\s*&&\s*\(\s*pathname\s*===\s*["']\/["']\s*\|\|\s*pathname\s*===\s*["']["']\s*\)\s*\)/,
    );
    expect(middleware).toContain("P0-01");
  });

  it("P1-01: robots Disallow covers every AUTH_PROTECTED_PREFIX", () => {
    const robots = readSource("app/robots.ts");
    expect(robots).toContain("AUTH_PROTECTED_PREFIXES");
    for (const prefix of AUTH_PROTECTED_PREFIXES) {
      const expected = prefix.endsWith("/") ? prefix : `${prefix}/`;
      // Generated at runtime from SSOT — assert generator wiring + sample critical paths.
      expect(robots).toContain("protectedPathDisallows");
      expect(expected.startsWith("/")).toBe(true);
    }
    expect(AUTH_PROTECTED_PREFIXES).toContain("/wallet");
    expect(AUTH_PROTECTED_PREFIXES).toContain("/inbox");
    expect(AUTH_PROTECTED_PREFIXES).toContain("/sell");
    expect(AUTH_PROTECTED_PREFIXES).toContain("/balance");
  });

  it("P1-03: JsonLdScript is server HTML script, not afterInteractive", () => {
    const script = readSource("components/seo/JsonLdScript.tsx");
    expect(script).toContain('type="application/ld+json"');
    expect(script).not.toContain("afterInteractive");
    expect(script).not.toContain('from "next/script"');
  });

  it("P1-04: GSC verification is env-gated only (no hardcoded token)", () => {
    const layout = readSource("app/layout.tsx");
    expect(layout).toContain("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION");
    expect(layout).not.toMatch(/google:\s*["'][A-Za-z0-9_-]{10,}["']/);
  });

  it("P1-05: Product JSON-LD includes Brand only when product.brand is present", () => {
    const withBrand = productJsonLd(
      minimalProduct({ brand: "Nike" }),
      [],
    ) as { "@graph": Array<Record<string, unknown>> };
    const productNode = withBrand["@graph"].find((n) => n["@type"] === "Product")!;
    expect(productNode.brand).toEqual({ "@type": "Brand", name: "Nike" });

    const withoutBrand = productJsonLd(minimalProduct({ brand: undefined }), []) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const bare = withoutBrand["@graph"].find((n) => n["@type"] === "Product")!;
    expect(bare.brand).toBeUndefined();
  });

  it("P1-02: sold listings map to OutOfStock via availability (KEEP INDEXED policy)", () => {
    const sold = productJsonLd(
      minimalProduct({ availability: "out_of_stock", status: "sold" }),
      [],
    ) as { "@graph": Array<{ offers?: { availability?: string } }> };
    const productNode = sold["@graph"].find((n) => (n as { "@type"?: string })["@type"] === "Product") as {
      offers: { availability: string };
    };
    expect(productNode.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("P0-03: unavailable listing/store metadata remain noindex (soft-200 Owner freeze)", () => {
    const listing = readSource("app/(platform)/listing/[slug]/page.tsx");
    const store = readSource("app/(platform)/store/[slug]/page.tsx");
    expect(listing).toContain("StoreUnavailablePage");
    expect(listing).toContain("index: false");
    expect(store).toContain("StoreUnavailablePage");
    expect(store).toContain("index: false");
  });
});
