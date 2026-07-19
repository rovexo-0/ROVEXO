import { readFileSync } from "node:fs";
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
    expect(constants).toContain("Open store");
    expect(constants).toContain('href: "/sell"');
    expect(constants).toContain('href: "/trust"');
    expect(constants).toContain('href: "/sell/new"');
    expect(constants).toContain('href: "/business/dashboard"');
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
    expect(dashboardIcon).toContain("RvxLineIcons");
    expect(dashboardIcon).not.toContain(".webp");
    expect(dashboardIcon).not.toContain(".png");
    expect(dashboardIcon).not.toContain("<picture");
  });

});

describe("Enterprise UI system — Absolute Final icon freeze", () => {
  const legacyWrappers = [
    "components/icons/Fluency3DIcon.tsx",
    "components/icons/DashboardIcon3D.tsx",
    "components/icons/BottomNavIcon3D.tsx",
    "components/icons/PremiumIcon.tsx",
    "components/icons/PremiumNavIcon.tsx",
    "components/icons/PremiumAccountIcon.tsx",
  ] as const;

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
  it("uses canonical line icons on non-homepage headers; homepage omits logo and notification", () => {
    const header = readFileSync(join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    expect(header).toContain("ROVEXO");
    expect(header).toContain("RvxLineIcons");
    expect(header).not.toContain("lucide-react");
    expect(header).not.toContain("MessageSquare");
    expect(header).toContain("BellLineIcon");
    expect(header).toContain("HeaderProfileLink");
    expect(header).toContain("HomepageHeaderShareButton");
    expect(header).toContain("!isHomepageLayout");
  });

  it("uses debounced inline search on the homepage header", () => {
    const header = readFileSync(join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    const searchField = readFileSync(join(process.cwd(), "components/home/HomepageSearchField.tsx"), "utf8");
    const imageSearch = readFileSync(join(process.cwd(), "components/home/ImageSearchCamera.tsx"), "utf8");
    expect(header).toContain("HomepageSearchField");
    expect(searchField).toContain("RovexoIcon");
    expect(searchField).toContain("RovexoIcons.navigation.search");
    expect(searchField).toContain("size={20}");
    expect(searchField).toContain("useDebouncedValue");
    expect(searchField).not.toContain("BottomNavIcon3D");
    expect(searchField).toContain("ImageSearchCamera");
    expect(imageSearch).toContain('aria-label="Image search"');
  });
});
