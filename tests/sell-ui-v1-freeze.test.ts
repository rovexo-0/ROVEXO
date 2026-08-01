import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SELL_UI_V1_FREEZE } from "@/lib/sell/sell-ui-v1-freeze";
import { SELL_PREMIUM_PICKER_FREEZE_V1 } from "@/lib/sell/sell-premium-picker-freeze-v1";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Sell UI v1.0 freeze (COD SÂNGE)", () => {
  it("is Owner-locked UI/UX freeze", () => {
    expect(SELL_UI_V1_FREEZE.status).toBe("UI_UX_FROZEN");
    expect(SELL_UI_V1_FREEZE.approvedByOwner).toBe(true);
    expect(SELL_UI_V1_FREEZE.freezeLocked).toBe(true);
    expect(SELL_UI_V1_FREEZE.officialRoute).toBe("/sell");
  });

  it("keeps canonical Sell components as unique SSOT paths", () => {
    for (const path of SELL_UI_V1_FREEZE.canonicalComponents) {
      expect(read(path).length).toBeGreaterThan(100);
    }
  });

  it("Brand / Material / Colour suppress search in SellOptionPicker", () => {
    const picker = read("features/sell/ui/SellOptionPicker.tsx");
    expect(picker).toContain("isBrandPicker");
    expect(picker).toContain("isMaterialPicker");
    expect(picker).toContain("isColourPicker");
    expect(picker).toMatch(/effectiveSearchable[\s\S]*!isColourPicker[\s\S]*!isBrandPicker[\s\S]*!isMaterialPicker/);
  });

  it("Parcel picker has no search chrome", () => {
    const parcel = read("features/sell/ui/SellParcelBlock.tsx");
    expect(parcel).not.toContain("sell-parcel-search");
    expect(parcel).not.toContain("Search parcel sizes");
    expect(parcel).toContain("sell-parcel-option__art");
    expect(parcel).toContain("choose(option.id)");
  });

  it("premium picker freeze is v1.1 under Sell UI freeze", () => {
    expect(SELL_PREMIUM_PICKER_FREEZE_V1.version).toBe("1.1");
    expect(SELL_UI_V1_FREEZE.parents.premiumPickers).toContain("sell-premium-picker-freeze");
  });
});
