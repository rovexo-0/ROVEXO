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
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import type { UserProfile } from "@/lib/profile/types";

const profile = { isSeller: true } as UserProfile;

function hrefFor(
  tiles: { href: string; label: string }[],
  label: string,
): string | undefined {
  return tiles.find((tile) => tile.label === label)?.href;
}

describe("Enterprise UI — seller CTA routes", () => {
  const sellHub = getSellHubTiles(profile);
  const sellerDash = getSellerDashboardTiles();

  it("routes Bring Your Items to the import wizard (not /sell)", () => {
    expect(hrefFor(sellHub, "Bring Your Items")).toBe(IMPORT_WIZARD_PATH);
    expect(hrefFor(sellerDash, "Bring Your Items")).toBe(IMPORT_WIZARD_PATH);
    expect(SELLER_NAV.find((link) => link.label === "Bring Your Items")?.href).toBe(IMPORT_WIZARD_PATH);
    expect(hrefFor(sellHub, "Bring Your Items")).not.toBe("/sell");
    expect(MIGRATION_CENTER_PATH).toBe(IMPORT_WIZARD_PATH);
  });

  it("routes Publish Listing to sell wizard", () => {
    expect(hrefFor(sellHub, "Publish Listing")).toBe("/sell/new");
    expect(hrefFor(sellerDash, "Publish Listing")).toBe("/sell/new");
    expect(hrefFor(sellerDash, "Sell Item")).toBe("/sell");
    expect(hrefFor(sellHub, "Selling")).toBe("/seller");
    expect(hrefFor(sellerDash, "Selling")).toBe("/seller");
    expect(hrefFor(sellHub, "My Listings")).toBe("/seller/listings");
    expect(hrefFor(sellerDash, "My Listings")).toBe("/seller/listings");
    expect(hrefFor(sellHub, "Marketplace Connectors")).toBe(MARKETPLACE_CONNECTORS_PATH);
    expect(hrefFor(sellerDash, "Marketplace Connectors")).toBe(MARKETPLACE_CONNECTORS_PATH);
  });
});

describe("Enterprise UI — legal pages remain reachable", () => {
  it("keeps legal routes available outside the removed global footer", () => {
    const legalPage = readFileSync(join(process.cwd(), "app/legal/page.tsx"), "utf8");
    expect(legalPage.length).toBeGreaterThan(0);
  });
});
