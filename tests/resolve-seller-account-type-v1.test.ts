import { resolveSellerAccountType } from "@/lib/store/resolve-seller-account-type-v1";
import { describe, expect, it } from "vitest";

describe("resolveSellerAccountType", () => {
  it("returns individual when business fields are missing", () => {
    expect(resolveSellerAccountType(null)).toBe("individual");
    expect(resolveSellerAccountType({})).toBe("individual");
    expect(resolveSellerAccountType({ businessName: "  ", businessType: "" })).toBe("individual");
  });

  it("returns business only when canonical business fields exist", () => {
    expect(resolveSellerAccountType({ businessName: "ROVEXO Ltd" })).toBe("business");
    expect(resolveSellerAccountType({ businessType: "Limited company" })).toBe("business");
    expect(
      resolveSellerAccountType({ businessName: "ROVEXO Ltd", businessType: "Ltd" }),
    ).toBe("business");
  });

  it("never infers business from seller name heuristics", () => {
    expect(resolveSellerAccountType({ businessName: null, businessType: null })).toBe("individual");
  });
});
