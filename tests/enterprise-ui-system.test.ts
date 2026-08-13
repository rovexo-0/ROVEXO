import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Enterprise UI system — homepage hero", () => {
  it("does not render Official ROVEXO banner on homepage", () => {
    const homePage = readFileSync(
      join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"),
      "utf8",
    );
    expect(homePage).not.toMatch(/from "@\/components\/home\/HomeHeroBanner"/);
    expect(homePage).not.toContain("HomeHeroBannerEngine");
    expect(homePage).not.toContain("RovexoBanner");
  });

  it("routes hero slide CTAs to approved marketplace destinations", () => {
    const constants = readFileSync(join(process.cwd(), "lib/home/constants.ts"), "utf8");
    expect(constants).toContain("List free");
    expect(constants).toContain("Learn more");
    expect(constants).toContain("Shop now");
    expect(constants).toContain("Start selling");
    expect(constants).toContain('href: "/sell"');
    expect(constants).toContain('href: "/trust"');
    expect(constants).toContain('href: "/sell/new"');
    expect(constants).not.toContain('href: "/business/dashboard"');
    expect(constants).not.toContain("Grow Your Business");
    expect(constants).toContain("HOME_HERO_BANNERS");
    expect(constants).not.toContain("unsplash.com");
  });

  it("Absolute Final — store migration hero is Master Menu only (no carousel/premium)", () => {
    const banner = readFileSync(
      join(process.cwd(), "features/seller/migration/components/StoreMigrationHeroBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain("CanonicalMenuRow");
    expect(banner).toContain("Bring Your Item");
    expect(banner).not.toContain("AUTO_ADVANCE_MS");
    expect(banner).not.toContain("import-rx-hero-banner--premium");
    expect(banner).not.toContain("HOME_HERO_BANNERS");
  });
});

describe("Enterprise UI system — design lock", () => {
  it("locks hub card horizontal layout in dashboard CSS", () => {
    const css = readFileSync(join(process.cwd(), "styles/rovexo/dashboard.css"), "utf8");
    expect(css).toContain("--rx-dash-card-min-height: 56px");
    expect(css).toContain("flex-direction: row");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("uses Master Menu row density in mobile hub cards", () => {
    const card = readFileSync(
      join(process.cwd(), "features/mobile-ui/components/MobileHubCard.tsx"),
      "utf8",
    );
    const dashboardIcon = readFileSync(
      join(process.cwd(), "components/icons/DashboardIcon3D.tsx"),
      "utf8",
    );
    expect(card).toContain("cds-menu-row");
    expect(card).toContain("DashboardIcon3D");
    expect(card).toContain("min-h-[56px]");
    expect(card).not.toContain("rx-dash-tile__body");
    expect(dashboardIcon).toContain("AccountIcon");
    expect(dashboardIcon).not.toContain(".webp");
    expect(dashboardIcon).not.toContain(".png");
    expect(dashboardIcon).not.toContain("<picture");
  });

});

describe("Enterprise UI system — Absolute Final icon freeze", () => {
  const legacyWrappers = [
    "components/icons/DashboardIcon3D.tsx",
    "components/icons/BottomNavIcon3D.tsx",
    "components/icons/PremiumIcon.tsx",
    "components/icons/PremiumNavIcon.tsx",
    "components/icons/PremiumAccountIcon.tsx",
  ] as const;

  it("Fluency3D pack is deleted from the tree", () => {
    expect(existsSync(join(process.cwd(), "components/icons/Fluency3DIcon.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/icons/fluency-3d-registry.ts"))).toBe(false);
  });

  it("legacy icon wrappers render line icons only — no 3D picture assets", () => {
    for (const rel of legacyWrappers) {
      const source = readFileSync(join(process.cwd(), rel), "utf8");
      expect(source).not.toContain("getFluency3DAssetPath");
      expect(source).not.toContain("getAccountIconPng");
      expect(source).not.toContain("getAccountIconWebp");
      expect(source).not.toContain("/icons/premium/");
      expect(source).not.toContain("/icons/fluency-3d/");
      expect(source).not.toContain("<picture");
      expect(source).not.toMatch(/\.webp|\.png/);
    }
  });

  it("mobile-ui hub folder uses RvxLineIcons — not fluency-3d registry assets", () => {
    const hubIcon = readFileSync(
      join(process.cwd(), "features/mobile-ui/components/MobileHubFolderIcon.tsx"),
      "utf8",
    );
    expect(hubIcon).toContain("RvxLineIcons");
    expect(hubIcon).not.toContain("fluency-3d-registry");
    expect(hubIcon).not.toContain("Fluency3DIcon");
    expect(hubIcon).not.toMatch(/\.webp|\.png/);
  });

  it("dashboard header uses RvxLineIcons directly", () => {
    const header = readFileSync(
      join(process.cwd(), "features/dashboard/components/DashboardHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("RvxLineIcons");
    expect(header).not.toContain("DashboardIcon3D");
    expect(header).not.toMatch(/\.webp|\.png/);
  });
});

describe("Enterprise UI system — header", () => {
  it("uses search-first header without notification or avatar icons", () => {
    const header = readFileSync(join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    expect(header).toContain("ROVEXO");
    expect(header).toContain("HomepageSearchField");
    expect(header).not.toContain("lucide-react");
    expect(header).not.toContain("MessageSquare");
    expect(header).not.toContain("BellLineIcon");
    expect(header).not.toContain("HeaderProfileLink");
    expect(header).toContain("HomepageHeaderShareButton");
    expect(header).toContain('data-header-search-first="true"');
  });

  it("routes Homepage search field to /search with Profile-family Search icon", () => {
    const header = readFileSync(join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    const searchField = readFileSync(join(process.cwd(), "components/home/HomepageSearchField.tsx"), "utf8");
    expect(header).toContain("HomepageSearchField");
    expect(searchField).toContain("SearchBarSearchIcon");
    expect(searchField).toContain('router.push("/search")');
    expect(searchField).not.toContain("useSearchOverlayOptional");
    expect(searchField).not.toContain("BottomNavIcon3D");
    expect(searchField).not.toContain("ImageSearchCamera");
  });
});
