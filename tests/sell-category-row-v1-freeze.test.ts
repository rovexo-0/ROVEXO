import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CATEGORY_ROW_V1_FREEZE,
  assertCategoryRowV1FreezeOrBlock,
} from "@/lib/sell/category-row-v1-freeze";

function readSource(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Category Row v1.0 — FREEZE CERTIFIED", () => {
  it("SSOT is Owner freeze certified", () => {
    expect(CATEGORY_ROW_V1_FREEZE.version).toBe("1.0");
    expect(CATEGORY_ROW_V1_FREEZE.freezeCertified).toBe(true);
    expect(CATEGORY_ROW_V1_FREEZE.uiLock).toBe(true);
    expect(CATEGORY_ROW_V1_FREEZE.featureLock).toBe(true);
    expect(CATEGORY_ROW_V1_FREEZE.approvedByOwner).toBe(true);
    expect(() => assertCategoryRowV1FreezeOrBlock()).not.toThrow();
  });

  it("canonical render tree — one label, description breadcrumb, no value path", () => {
    const row = readSource("components/listing/ListingAttributeRow.tsx");
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    const nav = readSource("features/sell/ui/SellPrimitives.tsx");

    expect(row.split("<ListingAttributeLabel>").length - 1).toBe(1);
    expect(row).toContain("listing-attribute-row__description");
    expect(row).not.toMatch(/import\s*\{[^}]*ListingAttributeIcon/);
    expect(row).not.toMatch(/<ListingAttributeIcon[\s/>]/);

    expect(block).toContain('label="Category"');
    expect(block).toContain("description={draft.categoryPath?.pathLabel}");
    expect(block).not.toContain("value={draft.categoryPath?.pathLabel}");
    expect(block).not.toContain('aria-label="Category"');

    expect(nav).toContain("ListingAttributeRow");
    expect(nav).not.toMatch(/import\s*\{[^}]*ListingAttributeIcon/);
    expect(nav).not.toMatch(/<ListingAttributeIcon[\s/>]/);
  });

  it("breadcrumb typography lock is present in sell.css", () => {
    const css = readSource("styles/rovexo/sell.css");
    expect(css).toContain("listing-attribute-row__description");
    expect(css).toContain("font-size: 14px");
    expect(css).toContain("font-weight: 400");
    expect(css).toContain("line-height: 22px");
  });

  it("forbids Category path in value slot and double icon wrap", () => {
    expect(CATEGORY_ROW_V1_FREEZE.forbidden).toContain(
      "category_path_as_ListingAttributeValue",
    );
    expect(CATEGORY_ROW_V1_FREEZE.forbidden).toContain(
      "ListingAttributeIcon_double_wrap",
    );
    expect(CATEGORY_ROW_V1_FREEZE.forbidden).toContain(
      "duplicate_ListingAttributeLabel",
    );
  });
});
