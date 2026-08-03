import { describe, expect, it } from "vitest";
import { LISTING_ATTRIBUTE_VALUE_V1 } from "@/lib/listing-attributes/listing-attribute-value-v1";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ListingAttributeValue typography SSOT", () => {
  it("locks Owner typography tokens", () => {
    expect(LISTING_ATTRIBUTE_VALUE_V1.fontWeight).toBe(500);
    expect(LISTING_ATTRIBUTE_VALUE_V1.fontSizePx).toBe(16);
    expect(LISTING_ATTRIBUTE_VALUE_V1.lineHeightPx).toBe(24);
    expect(LISTING_ATTRIBUTE_VALUE_V1.color).toBe("#111111");
    expect(LISTING_ATTRIBUTE_VALUE_V1.textAlign).toBe("right");
  });

  it("SellNavRow wires ListingAttributeRow", () => {
    const source = readFileSync(
      join(process.cwd(), "features/sell/ui/SellPrimitives.tsx"),
      "utf8",
    );
    expect(source).toContain("ListingAttributeRow");
  });

  it("View Item rows wire ListingAttributeValue", () => {
    const source = readFileSync(
      join(process.cwd(), "features/product-detail/ProductInformationRows.tsx"),
      "utf8",
    );
    expect(source).toContain("ListingAttributeValue");
  });
});
