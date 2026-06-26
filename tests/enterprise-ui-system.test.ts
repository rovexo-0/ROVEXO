import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getSellHubTiles } from "@/lib/mobile-ui/hubs";
import { getSellerDashboardTiles } from "@/lib/dashboard/sections";
import { SELLER_NAV } from "@/lib/navigation/map";
import {
  IMPORT_WIZARD_PATH,
  MIGRATION_CENTER_PATH,
} from "@/lib/seller/migration/config";
import type { UserProfile } from "@/lib/profile/types";

const profile = { isSeller: true } as UserProfile;

describe("Enterprise UI system — import routing", () => {
  it("uses canonical /import path for migration center", () => {
    expect(MIGRATION_CENTER_PATH).toBe(IMPORT_WIZARD_PATH);
    expect(MIGRATION_CENTER_PATH).toBe("/import");
  });

  it("routes Bring Your Items to import wizard (never /sell)", () => {
    const sellHub = getSellHubTiles(profile);
    const sellerDash = getSellerDashboardTiles();
    const bringHub = sellHub.find((tile) => tile.label === "Bring Your Items");
    const bringDash = sellerDash.find((tile) => tile.label === "Bring Your Items");
    const bringNav = SELLER_NAV.find((link) => link.label === "Bring Your Items");

    expect(bringHub?.href).toBe("/import");
    expect(bringDash?.href).toBe("/import");
    expect(bringNav?.href).toBe("/import");
    expect(bringHub?.href).not.toBe("/sell");
  });
});

describe("Enterprise UI system — design lock", () => {
  it("locks hub card dimensions in dashboard CSS", () => {
    const css = readFileSync(join(process.cwd(), "styles/dashboard-v1.css"), "utf8");
    expect(css).toContain("--dash-v1-card-min-height: 82px");
    expect(css).toContain("--dash-v1-hub-icon-size: 56px");
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

  it("uses horizontal enterprise layout in mobile hub cards", () => {
    const card = readFileSync(
      join(process.cwd(), "features/mobile-ui/components/MobilePremiumCard.tsx"),
      "utf8",
    );
    expect(card).toContain("dash-v1-tile__body");
    expect(card).toContain("DashboardIcon3D");
  });

  it("names account hub sections BUY SELL BUSINESS SUPPORT", () => {
    const dashboard = readFileSync(
      join(process.cwd(), "features/account-page/components/PremiumAccountDashboard.tsx"),
      "utf8",
    );
    expect(dashboard).toContain('title="BUY"');
    expect(dashboard).toContain('title="SELL"');
    expect(dashboard).toContain('title="BUSINESS"');
    expect(dashboard).toContain('title="SUPPORT"');
    expect(dashboard).not.toContain("Quick Access");
  });

  it("routes homepage migration banner to import wizard", () => {
    const banner = readFileSync(
      join(process.cwd(), "features/seller/migration/components/StoreMigrationHeroBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain("IMPORT_WIZARD_PATH");
    expect(banner).not.toContain("SELL_WIZARD_PATH");
    expect(banner).toContain("Bring Your Items");
  });
});
