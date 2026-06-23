import { describe, expect, it } from "vitest";
import { suggestListingPrice } from "@/lib/sell/price-suggestion";

describe("suggestListingPrice", () => {
  it("returns higher price for new items", () => {
    const newer = suggestListingPrice({ condition: "New", categorySlug: "electronics" });
    const fair = suggestListingPrice({ condition: "Fair", categorySlug: "electronics" });
    expect(newer.suggested).toBeGreaterThan(fair.suggested);
  });

  it("returns a bounded range around the suggested price", () => {
    const result = suggestListingPrice({ condition: "Good", categorySlug: "fashion" });
    expect(result.low).toBeLessThan(result.suggested);
    expect(result.high).toBeGreaterThan(result.suggested);
  });
});
