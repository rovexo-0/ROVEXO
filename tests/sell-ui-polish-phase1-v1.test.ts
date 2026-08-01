import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATTRIBUTE_DEFS } from "@/lib/sell/attribute-engine";
import { SELL_FIELD_ICONS } from "@/lib/design-system/master-icon-system-v1";
import { SELL_UI_POLISH_PRODUCT_QA_V1 } from "@/lib/design-system/sell-ui-polish-product-qa-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Sell UI Polish Phase 1 — Product QA", () => {
  it("keeps compatibility id; UI label Compatible With only", () => {
    expect(ATTRIBUTE_DEFS.compatibility.id).toBe("compatibility");
    expect(ATTRIBUTE_DEFS.compatibility.label).toBe("Compatible With");
  });

  it("does not invent Occasion or Care attributes", () => {
    expect(ATTRIBUTE_DEFS).not.toHaveProperty("occasion");
    expect(ATTRIBUTE_DEFS).not.toHaveProperty("care");
  });

  it("wires Quantity icon and Price £ presentation without logic rewrites", () => {
    expect(SELL_FIELD_ICONS.quantity).toBeDefined();
    expect(SELL_FIELD_ICONS.stock).toBeDefined();
    const qty = readSource("features/sell/ui/SellStockQuantityBlock.tsx");
    const price = readSource("features/sell/ui/SellPricingBlock.tsx");
    const css = readSource("styles/rovexo/sell.css");
    expect(qty).toContain('fieldId="quantity"');
    expect(qty).not.toContain('fieldId="price"');
    expect(price).toContain("SELL_CURRENCY_SSR_DEFAULT");
    expect(price).toContain("sell-price-currency__symbol");
    expect(css).not.toContain("sell-stock-stepper");
    expect(css).toContain("sell-price-currency__symbol");
  });

  it("locks polish gate: no commit/push/production in SSOT", () => {
    expect(SELL_UI_POLISH_PRODUCT_QA_V1.implementationAllowed).toBe(true);
    expect(SELL_UI_POLISH_PRODUCT_QA_V1.forbidden).toContain("production");
    expect(SELL_UI_POLISH_PRODUCT_QA_V1.forbidden).toContain("commit");
  });
});
