import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ITEM_PAGE_BOTTOM_NAV_VISIBLE", () => {
  it("mounts canonical BetaAppShell + Browse tab on Item Page", () => {
    const page = readSource("app/(platform)/listing/[slug]/page.tsx");
    const loading = readSource("app/(platform)/listing/[slug]/loading.tsx");
    const error = readSource("app/(platform)/listing/[slug]/error.tsx");
    const detail = readSource("features/product-detail/ProductDetailPage.tsx");
    const shell = readSource("components/beta/BetaAppShell.tsx");
    const nav = readSource("components/ui/BottomNavigation.tsx");

    expect(page).toContain('import { BetaAppShell } from "@/components/beta/BetaAppShell"');
    expect(page).toContain('<BetaAppShell bottomNavTab="search">');
    expect(page).toContain("ProductDetailPage");
    expect(loading).toContain('<BetaAppShell bottomNavTab="search">');
    expect(error).toContain('<BetaAppShell bottomNavTab="search">');

    expect(detail).not.toContain("BottomNavigation");
    expect(detail).not.toContain("ItemBottomNav");
    expect(detail).not.toContain("ProductBottomNav");
    expect(page).not.toContain("ItemBottomNav");
    expect(page).not.toContain("ProductBottomNav");
    expect(page).not.toContain("import { BottomNavigation");

    expect(shell).toContain('from "@/components/ui/BottomNavigation"');
    expect(shell).toContain("<BottomNavigation");
    expect(nav).toContain('data-bottom-nav="v2"');
  });

  it("CANONICAL_BOTTOM_NAV_REUSED=YES and DUPLICATE_BOTTOM_NAV=NO", () => {
    const page = readSource("app/(platform)/listing/[slug]/page.tsx");
    const home = readSource("app/(platform)/page.tsx");
    const browse = readSource("app/(platform)/browse/page.tsx");
    const search = readSource("app/(platform)/search/page.tsx");

    expect(page).toContain("BetaAppShell");
    expect(page).toContain('bottomNavTab="search"');
    expect(home).toContain('bottomNavTab="home"');
    expect(browse).toContain('bottomNavTab="search"');
    expect(search).toContain('bottomNavTab="search"');

    expect(page).not.toContain("ItemBottomNav");
    expect(page).not.toContain("ProductBottomNav");
    expect(home).not.toContain("ItemBottomNav");
    expect(browse).not.toContain("ItemBottomNav");
  });

  it("lifts Item Page sticky CTAs above canonical bottom nav tokens", () => {
    const css = readSource("styles/rovexo/product-detail-v1.css");
    expect(css).toContain("--pd-v1-canonical-bottom-nav-stack");
    expect(css).toContain("--rx-bottom-nav-height");
    expect(css).toContain("var(--pd-v1-canonical-bottom-nav-stack)");
    expect(css).toContain("bottom: var(--pd-v1-canonical-bottom-nav-stack);");
    expect(css).toContain("--pd-v1-sticky-action-clearance");
  });
});
