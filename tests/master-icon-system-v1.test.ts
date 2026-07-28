import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  MASTER_ICON_SIZE_PX,
  MASTER_ICON_COLORS,
  resolveCategoryMasterIcon,
  resolveSellFieldMasterIcon,
  masterIconSystemSnapshot,
} from "@/lib/design-system/master-icon-system-v1";
import { PROFILE_ICON_SIZE_PX, PROFILE_ICON_COLORS } from "@/lib/account-center/profile-icon-system-v1";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("master icon system v1.0 (Profile SSOT)", () => {
  it("inherits Profile icon size and palette", () => {
    expect(MASTER_ICON_SIZE_PX).toBe(PROFILE_ICON_SIZE_PX);
    expect(MASTER_ICON_SIZE_PX).toBe(24);
    expect(MASTER_ICON_COLORS.settings).toBe(PROFILE_ICON_COLORS.settings);
    expect(MASTER_ICON_COLORS.balance).toBe(PROFILE_ICON_COLORS.balance);
    expect(masterIconSystemSnapshot().forbidden).toContain("grey placeholders");
  });

  it("maps Sell fields to coloured Account line icons", () => {
    expect(resolveSellFieldMasterIcon("category")?.icon).toBe("categories");
    expect(resolveSellFieldMasterIcon("brand")?.color).toBe(MASTER_ICON_COLORS.cyan);
    expect(resolveSellFieldMasterIcon("condition")?.color).toBe(MASTER_ICON_COLORS.green);
    expect(resolveSellFieldMasterIcon("colour")?.icon).toBe("product");
    expect(resolveSellFieldMasterIcon("material")?.icon).toBe("listings");
    expect(resolveSellFieldMasterIcon("parcel")?.icon).toBe("shipping");
    expect(resolveSellFieldMasterIcon("price")?.icon).toBe("wallet");
  });

  it("Sell PricingBlock uses Master price icon", () => {
    const pricing = readSource("features/sell/ui/SellPricingBlock.tsx");
    expect(pricing).toContain("SellFieldMasterIcon");
    expect(pricing).toContain('fieldId="price"');
  });

  it("Parcel picker is one-tap auto-return · Absolute Authority L6 · no Recommended", () => {
    const parcel = readSource("features/sell/ui/SellParcelBlock.tsx");
    expect(parcel).toContain("sell-parcel-option");
    expect(parcel).toContain("choose(option.id)");
    expect(parcel).toContain("sell-parcel-option__title-row");
    expect(parcel).not.toContain("recommendParcelTier");
    expect(parcel).not.toContain("sell-parcel-option__badge");
    expect(parcel).not.toContain("Recommended");
    expect(parcel).not.toContain("CanonicalButton");
    expect(parcel).not.toMatch(/>\s*(Apply|Confirm|Done|Publish)\s*</);
    const css = readSource("styles/rovexo/sell.css");
    expect(css).toMatch(/\.sell-parcel-option[\s\S]*height:\s*48px/);
    expect(css).toMatch(/\.sell-parcel-option[\s\S]*min-height:\s*48px/);
    expect(css).toMatch(/\.sell-parcel-option__radio[\s\S]*width:\s*24px/);
    expect(css).toMatch(/\.sell-parcel-option__label[\s\S]*font-size:\s*15px/);
    expect(css).toContain("sell-parcel-radio-pop");
  });

  it("maps category roots without grey/emoji", () => {
    for (const slug of ["camping", "baby", "phones", "computers", "electronics", "gaming", "sports"]) {
      const resolved = resolveCategoryMasterIcon(slug);
      expect(resolved.icon).toBeTruthy();
      expect(resolved.color).not.toMatch(/gray|grey|#9ca3af|#cbd5e1/i);
    }
  });

  it("Sell category picker uses CategoryMasterIcon (no emoji thumbs)", () => {
    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");
    expect(picker).toContain("CategoryMasterIcon");
    expect(picker).not.toContain("CategoryThumb");
    expect(picker).not.toContain("getCategoryIcon");
  });

  it("SellNavRow wires Master Icon System field ids", () => {
    const primitives = readSource("features/sell/ui/SellPrimitives.tsx");
    expect(primitives).toContain("SellFieldMasterIcon");
    expect(primitives).toContain("iconFieldId");
    const category = readSource("features/sell/ui/SellCategoryBlock.tsx");
    expect(category).toContain('iconFieldId="category"');
  });
});
