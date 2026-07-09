import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Enterprise UI system — homepage hero", () => {
  it("does not render Official ROVEXO banner on homepage", () => {
    const homePage = readFileSync(join(process.cwd(), "components/home/RovexoHomePage.tsx"), "utf8");
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

  it("hero carousel auto-advances with deferred first tick", () => {
    const banner = readFileSync(
      join(process.cwd(), "features/seller/migration/components/StoreMigrationHeroBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain("AUTO_ADVANCE_MS = 5000");
    expect(banner).toContain('immediate: false');
    expect(banner).toContain("HOME_HERO_BANNERS");
    expect(banner).toContain("handlePointerDown");
  });
});

describe("Enterprise UI system — design lock", () => {
  it("locks hub card horizontal layout in dashboard CSS", () => {
    const css = readFileSync(join(process.cwd(), "styles/rovexo/dashboard.css"), "utf8");
    expect(css).toContain("--rx-dash-card-min-height: 56px");
    expect(css).toContain("flex-direction: row");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("uses vertical enterprise layout in mobile hub cards", () => {
    const card = readFileSync(
      join(process.cwd(), "features/mobile-ui/components/MobilePremiumCard.tsx"),
      "utf8",
    );
    expect(card).toContain("rx-dash-tile__title");
    expect(card).toContain("DashboardIcon3D");
    expect(card).not.toContain("rx-dash-tile__body");
  });

});

describe("Enterprise UI system — header", () => {
  it("uses official ROVEXO wordmark and production header icons on homepage", () => {
    const header = readFileSync(join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    expect(header).toContain("ROVEXO");
    expect(header).toContain("lucide-react");
    expect(header).toContain("MessageSquare");
    expect(header).toContain("Bell");
    expect(header).toContain("HeaderProfileLink");
    expect(header).toContain("HomepageHeaderShareButton");
  });

  it("uses debounced inline search on the homepage header", () => {
    const header = readFileSync(join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    const searchField = readFileSync(join(process.cwd(), "components/home/HomepageSearchField.tsx"), "utf8");
    expect(header).toContain("HomepageSearchField");
    expect(searchField).toContain("RovexoIcon");
    expect(searchField).toContain("RovexoIcons.navigation.search");
    expect(searchField).toContain("size={20}");
    expect(searchField).toContain("useDebouncedValue");
    expect(searchField).not.toContain("BottomNavIcon3D");
    expect(searchField).not.toContain("camera");
  });
});
