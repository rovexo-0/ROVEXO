import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bring Your Item — removed from consumer v1.0 (PO)", () => {
  it("keeps path constants for legacy redirects only", () => {
    expect(BRING_YOUR_ITEM_PATH).toBe("/account/bring-your-item");
    expect(IMPORT_WIZARD_PATH).toBe(BRING_YOUR_ITEM_PATH);
  });

  it("does not expose Bring Your Item in My Account or Selling menus", () => {
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const selling = readSource("lib/account-center/selling-menu.ts");
    expect(menu).not.toContain('title: "Bring Your Item"');
    expect(selling).not.toContain("Bring Your");
    expect(selling).not.toContain("Marketplace Import");
  });

  it("removes consumer Marketplace Import routes (redirect to Selling)", () => {
    const byi = readSource("app/account/bring-your-item/page.tsx");
    const connectors = readSource("app/seller/connectors/page.tsx");
    expect(byi).toContain('redirect("/seller")');
    expect(connectors).toContain('redirect("/seller")');
    expect(byi).not.toContain("BringYourItemPage");
  });

  it("redirects legacy /import aliases to the account route constant", () => {
    const legacyImport = readSource("app/import/page.tsx");
    const legacyBring = readSource("app/bring-your-item/page.tsx");
    expect(legacyImport).toContain("BRING_YOUR_ITEM_PATH");
    expect(legacyBring).toContain("BRING_YOUR_ITEM_PATH");
  });
});
