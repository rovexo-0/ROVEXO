import { describe, expect, it } from "vitest";
import { suggestListingPrice } from "@/lib/sell/price-suggestion";

describe("suggestListingPrice", () => {
  it("returns higher price for new items", () => {
    const newer = suggestListingPrice({ condition: "New (Unused)", categorySlug: "electronics" });
    const acceptable = suggestListingPrice({ condition: "Acceptable", categorySlug: "electronics" });
    expect(newer.suggested).toBeGreaterThan(acceptable.suggested);
  });

  it("returns a bounded range around the suggested price", () => {
    const result = suggestListingPrice({ condition: "Good", categorySlug: "fashion" });
    expect(result.low).toBeLessThan(result.suggested);
    expect(result.high).toBeGreaterThan(result.suggested);
  });
});
