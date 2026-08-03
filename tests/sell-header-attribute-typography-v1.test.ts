import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LISTING_ATTRIBUTE_LABEL_V1 } from "@/lib/listing-attributes/listing-attribute-label-v1";
import { LISTING_ATTRIBUTE_VALUE_V1 } from "@/lib/listing-attributes/listing-attribute-value-v1";

describe("Sell header + attribute typography SSOT", () => {
  it("locks label typography to match value tokens", () => {
    expect(LISTING_ATTRIBUTE_LABEL_V1.fontWeight).toBe(LISTING_ATTRIBUTE_VALUE_V1.fontWeight);
    expect(LISTING_ATTRIBUTE_LABEL_V1.fontSizePx).toBe(LISTING_ATTRIBUTE_VALUE_V1.fontSizePx);
    expect(LISTING_ATTRIBUTE_LABEL_V1.lineHeightPx).toBe(LISTING_ATTRIBUTE_VALUE_V1.lineHeightPx);
    expect(LISTING_ATTRIBUTE_LABEL_V1.color).toBe(LISTING_ATTRIBUTE_VALUE_V1.color);
  });

  it("SizeSelector reuses SellFlowHeader — no dedicated Size header", () => {
    const source = readFileSync(
      join(process.cwd(), "features/size/components/SizeSelector.tsx"),
      "utf8",
    );
    expect(source).toContain("SellFlowHeader");
    expect(source).toContain('title="Size"');
    expect(source).not.toContain("size-engine__top");
    expect(source).not.toContain("size-engine__brand");
    expect(source).not.toContain("size-engine__progress");
    expect(source).not.toMatch(/function Size(Header|TopBar|Toolbar)/);
  });

  it("SellNavRow uses ListingAttributeRow composition", () => {
    const source = readFileSync(
      join(process.cwd(), "features/sell/ui/SellPrimitives.tsx"),
      "utf8",
    );
    expect(source).toContain("ListingAttributeRow");
    expect(source).toContain("SellFlowHeader");
    expect(source).toContain("export const SellFlowHeader = SellPanelHeader");
  });

  it("Brand/Condition picker uses SellFlowHeader", () => {
    const source = readFileSync(
      join(process.cwd(), "features/sell/ui/SellOptionPicker.tsx"),
      "utf8",
    );
    expect(source).toContain("SellFlowHeader");
  });
});
