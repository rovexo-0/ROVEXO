import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";
import { buildSellingMenuSections } from "@/lib/account-center/selling-menu";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bring Your Item — Selling hub wiring (Absolute Final)", () => {
  it("keeps path constants for canonical entry", () => {
    expect(BRING_YOUR_ITEM_PATH).toBe("/account/bring-your-item");
    expect(IMPORT_WIZARD_PATH).toBe(BRING_YOUR_ITEM_PATH);
  });

  it("exposes Bring Your Item and Connectors on the Selling hub when enabled", () => {
    const titles = buildSellingMenuSections().flatMap((section) => section.items.map((item) => item.title));
    expect(titles).toContain("Bring Your Item");
    expect(titles).toContain("Connectors");
  });

  it("wires consumer import routes to live Master Menu pages", () => {
    const byi = readSource("app/account/bring-your-item/page.tsx");
    const connectors = readSource("app/seller/connectors/page.tsx");
    expect(byi).toContain("MigrationCenterPage");
    expect(connectors).toContain("MarketplaceConnectorsPage");
    expect(byi).toContain("isStoreMigrationEnabled");
    expect(connectors).toContain("isMarketplaceConnectorsEnabled");
  });

  it("redirects legacy /import aliases to the account route constant", () => {
    const legacyImport = readSource("app/import/page.tsx");
    const legacyBring = readSource("app/bring-your-item/page.tsx");
    expect(legacyImport).toContain("BRING_YOUR_ITEM_PATH");
    expect(legacyBring).toContain("BRING_YOUR_ITEM_PATH");
  });
});
