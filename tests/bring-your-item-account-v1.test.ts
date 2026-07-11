import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bring Your Item — My Account minimal v1.0", () => {
  it("uses a single canonical account route", () => {
    expect(BRING_YOUR_ITEM_PATH).toBe("/account/bring-your-item");
    expect(IMPORT_WIZARD_PATH).toBe(BRING_YOUR_ITEM_PATH);
  });

  it("does not expose Bring Your Item in the hub menu (canonical selling entry points)", () => {
    const menu = readSource("lib/account-center/canonical-menu.ts");
    expect(menu).not.toContain('title: "Bring Your Item"');
    expect(menu).toContain('title: "Settings"');
    expect(readSource("app/account/bring-your-item/page.tsx")).toContain("BringYourItemPage");
  });

  it("renders a minimal eBay-only account page", () => {
    const page = readSource("features/account-module/components/BringYourItemPage.tsx");
    const route = readSource("app/account/bring-your-item/page.tsx");

    expect(route).toContain("BringYourItemPage");
    expect(page).toContain('data-bring-your-item-version="v1.0"');
    expect(page).toContain("Connect eBay");
    expect(page).toContain("Import Listings");
    expect(page).toContain("Connected to eBay");
    expect(page).toContain("Import Complete");
    expect(page).toContain("Import completed successfully");
    expect(page).toContain("View My Listings");
    expect(page).toContain("Import More");
    expect(page).toContain("Retry Failed Items");
    expect(page).toContain("MigrationBulkPublishPanel");
    expect(page).toContain("minimal");
    expect(page).not.toContain("MigrationPlatformStep");
    expect(page).not.toContain("byi-hero");
  });

  it("redirects legacy /import aliases to the account route", () => {
    const legacyImport = readSource("app/import/page.tsx");
    const legacyBring = readSource("app/bring-your-item/page.tsx");
    expect(legacyImport).toContain("BRING_YOUR_ITEM_PATH");
    expect(legacyBring).toContain("BRING_YOUR_ITEM_PATH");
  });

  it("reuses migration estimate API for listing counts", () => {
    const estimate = readSource("app/api/seller/migration/estimate/route.ts");
    expect(estimate).toContain("estimateTotal");
  });
});
