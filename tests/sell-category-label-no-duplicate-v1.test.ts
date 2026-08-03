import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Sell Category label — no duplicate renderer", () => {
  it("ListingAttributeRow renders ListingAttributeLabel once in the title slot", () => {
    const source = readFileSync(
      join(process.cwd(), "components/listing/ListingAttributeRow.tsx"),
      "utf8",
    );
    const labelOpens = source.split("<ListingAttributeLabel>").length - 1;
    expect(labelOpens).toBe(1);
    expect(source).toContain("cds-menu-row__title");
    expect(source).not.toMatch(/import\s*\{[^}]*ListingAttributeIcon/);
    expect(source).not.toMatch(/<ListingAttributeIcon[\s/>]/);
  });

  it("SellCategoryBlock uses description for path — not duplicate value label", () => {
    const source = readFileSync(
      join(process.cwd(), "features/sell/ui/SellCategoryBlock.tsx"),
      "utf8",
    );
    expect(source).toContain('label="Category"');
    expect(source).toContain("description={draft.categoryPath?.pathLabel}");
    expect(source).not.toContain("value={draft.categoryPath?.pathLabel}");
    expect(source).not.toContain('aria-label="Category"');
  });

  it("SellNavRow does not wrap Master icons in a second cds-menu-row__icon", () => {
    const source = readFileSync(
      join(process.cwd(), "features/sell/ui/SellPrimitives.tsx"),
      "utf8",
    );
    expect(source).toContain("ListingAttributeRow");
    expect(source).not.toContain("ListingAttributeIcon");
  });
});
