import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Enterprise UI system — homepage hero", () => {
  it("does not render Official ROVEXO banner on homepage", () => {
    const homeContent = readFileSync(join(process.cwd(), "components/home/HomeContent.tsx"), "utf8");
    expect(homeContent).not.toContain("HomeHeroBanner");
    expect(homeContent).toContain("StoreMigrationHeroBanner");
  });

  it("routes import hero CTAs to sell wizard and migration center", () => {
    const banner = readFileSync(
      join(process.cwd(), "features/seller/migration/components/StoreMigrationHeroBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain("SELL_WIZARD_PATH");
    expect(banner).toContain("LEGACY_MIGRATION_CENTER_PATH");
    expect(banner).toContain("Bring Your Item");
    expect(banner).toContain("Import Your Item");
  });

  it("hero carousel auto-advances without skipping the migration slide on mount", () => {
    const banner = readFileSync(
      join(process.cwd(), "features/seller/migration/components/StoreMigrationHeroBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain("AUTO_ADVANCE_MS = 5000");
    expect(banner).toContain('immediate: false');
    expect(banner).toContain("Sell Faster");
    expect(banner).toContain("Premium Marketplace");
  });
});

describe("Enterprise UI system — design lock", () => {
  it("locks hub card vertical layout in dashboard CSS", () => {
    const css = readFileSync(join(process.cwd(), "styles/dashboard-v1.css"), "utf8");
    expect(css).toContain("--dash-v1-card-min-height: 100px");
    expect(css).toContain("flex-direction: column");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("uses Premium 3D icons in account hub cards", () => {
    const menuCard = readFileSync(
      join(process.cwd(), "features/account-page/components/MenuCard.tsx"),
      "utf8",
    );
    expect(menuCard).toContain("DashboardIcon3D");
    expect(menuCard).not.toContain("resolveMenuIcon");
    expect(menuCard).toContain("enterprise-hub-card");
  });

  it("uses vertical enterprise layout in mobile hub cards", () => {
    const card = readFileSync(
      join(process.cwd(), "features/mobile-ui/components/MobilePremiumCard.tsx"),
      "utf8",
    );
    expect(card).toContain("dash-v1-tile__title");
    expect(card).toContain("DashboardIcon3D");
    expect(card).not.toContain("dash-v1-tile__body");
  });

  it("names account hub sections BUY SELL BUSINESS SUPPORT", () => {
    const dashboard = readFileSync(
      join(process.cwd(), "components/home/HomeContent.tsx"),
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
    expect(dashboard).not.toContain("HomeHeroBanner");
  });
});

describe("Enterprise UI system — header", () => {
  it("uses R logo mark and premium 3D header icons", () => {
    const header = readFileSync(join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(header).toContain("RovexoHeaderMark");
    expect(header).toContain("DashboardIcon3D");
    expect(header).not.toContain("MessagesMenuIcon");
  });

  it("uses premium 3D search icon in header search bar", () => {
    const searchBar = readFileSync(join(process.cwd(), "components/header/HeaderSearchBar.tsx"), "utf8");
    expect(searchBar).toContain("BottomNavIcon3D");
    expect(searchBar).toContain('type="search"');
  });
});
