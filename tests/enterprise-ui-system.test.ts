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
      join(process.cwd(), "features/mobile-ui/components/MobilePremiumCard.tsx"),
      "utf8",
    );
    expect(card).toContain("cds-menu-row");
    expect(card).toContain("DashboardIcon3D");
    expect(card).toContain("min-h-[56px]");
    expect(card).not.toContain("rx-dash-tile__body");
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
