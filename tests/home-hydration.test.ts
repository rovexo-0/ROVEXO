import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Home page hydration safety", () => {
  it("uses CanonicalCategoryRail in the homepage main column", () => {
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    const categoryRail = readSource("components/homepage/canonical/CanonicalCategoryRail.tsx");

    expect(homePage).toContain("CanonicalCategoryRail");
    expect(categoryRail).toContain("css.rail");
  });

  it("defers chrome height measurement to layout effects in scroll context", () => {
    const scrollSource = readSource("components/home/RovexoMobileHeaderScrollContext.tsx");
    // Header Master Freeze: RovexoHeaderV2 no longer measures itself via useLayoutEffect.
    expect(scrollSource).toContain("useLayoutEffect");
    expect(readSource("components/header/RovexoHeaderV2.tsx")).toContain("HEADER_MASTER_FREEZE_V1");
  });

  it("keeps HomepageSearchField hydration-safe with stable SSR markup", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");

    expect(search).not.toContain("useClientHydrated");
    expect(search).not.toContain("Date.now()");
    expect(search).not.toContain("Math.random()");
    expect(search).not.toContain("crypto.randomUUID");
    expect(search).not.toContain("typeof window");
    expect(search).toContain('inputId: string');
    expect(search).toContain('role="searchbox"');
    expect(search).not.toContain('role={hydrated');
  });

  it("formats listing prices with a stable locale during SSR", () => {
    const format = readSource("lib/listing-card/format.ts");
    expect(format).toContain('toLocaleString("en-GB")');
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("formatListingPrice");
  });

  it("keeps the canonical homepage sections statically composed", () => {
    const source = readSource("components/homepage/canonical/CanonicalHomepage.tsx");

    expect(source).not.toContain("<Suspense");
    expect(source).toContain('data-hp-homepage="canonical"');
    expect(source).toContain("CanonicalMarketplaceFeed");
    expect(source).not.toContain("HomepageV3");
  });
});
