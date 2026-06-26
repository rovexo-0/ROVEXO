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
    expect(hrefFor(sellHub, "Seller Dashboard")).toBe("/seller/dashboard");
    expect(hrefFor(sellerDash, "Seller Dashboard")).toBe("/seller/dashboard");
    expect(hrefFor(sellHub, "My Listings")).toBe("/seller/listings");
    expect(hrefFor(sellerDash, "My Listings")).toBe("/seller/listings");
    expect(hrefFor(sellHub, "Marketplace Connectors")).toBe(MARKETPLACE_CONNECTORS_PATH);
    expect(hrefFor(sellerDash, "Marketplace Connectors")).toBe(MARKETPLACE_CONNECTORS_PATH);
  });
});

describe("Enterprise UI — footer", () => {
  it("does not duplicate hub navigation links", () => {
    const footer = readFileSync(join(process.cwd(), "components/Footer.tsx"), "utf8");
    for (const label of ["Buy", "Sell", "Business", "Support"]) {
      expect(footer).not.toContain(`title="${label}"`);
    }
    expect(footer).not.toContain("BUYER_LINKS");
    expect(footer).not.toContain("SELL_LINKS");
    expect(footer).not.toContain("BUSINESS_LINKS");
    expect(footer).not.toContain("SUPPORT_LINKS");
  });

  it("keeps legal and contact footer links", () => {
    const footer = readFileSync(join(process.cwd(), "components/Footer.tsx"), "utf8");
    for (const label of ["About", "Contact", "Privacy", "Terms", "Legal"]) {
      expect(footer).toContain(`label: "${label}"`);
    }
    expect(footer).toContain("All rights reserved");
  });
});
