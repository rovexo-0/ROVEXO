import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Enterprise UI system — homepage hero", () => {
  it("does not render Official ROVEXO banner on homepage", () => {
    const homePage = readFileSync(join(process.cwd(), "components/home/RovexoHomePage.tsx"), "utf8");
    expect(homePage).not.toMatch(/from "@\/components\/home\/HomeHeroBanner"/);
    expect(homePage).not.toContain("HomeHeroBannerEngine");
    expect(homePage).toContain("RovexoBanner");
  });

  it("routes hero slide CTAs to approved marketplace destinations", () => {
    const constants = readFileSync(join(process.cwd(), "lib/home/constants.ts"), "utf8");
    expect(constants).toContain("Start import");
    expect(constants).toContain("List free");
    expect(constants).toContain("Browse directory");
    expect(constants).toContain("Learn more");
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

  it("uses Premium 3D icons in account hub cards", () => {
    const menuCard = readFileSync(
      join(process.cwd(), "features/account-page/components/MenuCard.tsx"),
      "utf8",
    );
    expect(menuCard).toContain("DashboardIcon3D");
    expect(menuCard).not.toContain("resolveMenuIcon");
    expect(menuCard).toContain("rx-hub-card");
    expect(menuCard).toContain("ChevronRightIcon");
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

  it("names account hub sections BUY SELL BUSINESS SUPPORT", () => {
    const homePage = readFileSync(
      join(process.cwd(), "components/home/RovexoHomePage.tsx"),
      "utf8",
    );
    const accountDashboard = readFileSync(
      join(process.cwd(), "features/account-page/components/PremiumAccountDashboard.tsx"),
      "utf8",
    );
    expect(accountDashboard).toContain('title="BUY"');
    expect(accountDashboard).toContain('title="SELL"');
    expect(accountDashboard).toContain('title="BUSINESS"');
    expect(accountDashboard).toContain('title="SUPPORT"');
    expect(accountDashboard).not.toContain("Quick Access");
    expect(homePage).not.toMatch(/from "@\/components\/home\/HomeHeroBanner"/);
  });
});

describe("Enterprise UI system — header", () => {
  it("uses R logo mark and official production header icons", () => {
    const header = readFileSync(join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(header).toContain("RovexoHeaderMark");
    expect(header).toContain("RovexoIcon");
    expect(header).toContain("RovexoIcons.chat.messages");
    expect(header).toContain("RovexoIcons.notifications.bell");
    expect(header).not.toContain("MessagesMenuIcon");
    expect(header).not.toContain("DashboardIcon3D");
  });

  it("uses official production search icon in header search bar", () => {
    const searchBar = readFileSync(join(process.cwd(), "components/header/HeaderSearchBar.tsx"), "utf8");
    expect(searchBar).toContain("RovexoIcon");
    expect(searchBar).toContain("RovexoIcons.navigation.search");
    expect(searchBar).not.toContain("BottomNavIcon3D");
  });
});
