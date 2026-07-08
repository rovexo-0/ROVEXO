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

  it("defers header height measurement to layout effects", () => {
    const scrollSource = readSource("components/home/RovexoMobileHeaderScrollContext.tsx");
    const headerSource = readSource("components/header/RovexoHeaderV2.tsx");

    expect(scrollSource).toContain("useLayoutEffect");
    expect(headerSource).toContain("useLayoutEffect");
    expect(headerSource).toContain("headerRef");
  });

  it("keeps HomepageSearchField hydration-safe with stable SSR markup", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");
    const hydratedHook = readSource("lib/react/use-client-hydrated.ts");

    expect(search).toContain("useClientHydrated");
    expect(hydratedHook).toContain("useSyncExternalStore");
    expect(search).not.toContain("Date.now()");
    expect(search).not.toContain("Math.random()");
    expect(search).not.toContain("crypto.randomUUID");
    expect(search).not.toContain("typeof window");
    expect(search).toContain('inputId: string');
    expect(search).toContain('role={hydrated ? "combobox" : "searchbox"}');
  });

  it("formats listing prices with a stable locale during SSR", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain('toLocaleString("en-GB")');
  });

  it("keeps the canonical homepage sections statically composed", () => {
    const source = readSource("components/homepage/canonical/CanonicalHomepage.tsx");

    expect(source).not.toContain("<Suspense");
    expect(source).toContain('data-hp-homepage="canonical"');
    expect(source).toContain("CanonicalMarketplaceFeed");
    expect(source).not.toContain("HomepageV3");
  });
});
