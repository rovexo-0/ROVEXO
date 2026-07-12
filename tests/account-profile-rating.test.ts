import { describe, expect, it } from "vitest";
import { formatAccountProfileRating } from "@/lib/account-center/format-profile-rating";

describe("formatAccountProfileRating", () => {
  it("shows New when the seller has no reviews", () => {
    expect(formatAccountProfileRating(0, 0)).toBe("⭐ New");
    expect(formatAccountProfileRating(4.9, 0)).toBe("⭐ New");
  });

  it("shows one-decimal average when reviews exist", () => {
    expect(formatAccountProfileRating(4.87, 12)).toBe("⭐ 4.9");
    expect(formatAccountProfileRating(5, 3)).toBe("⭐ 5.0");
    expect(formatAccountProfileRating(4.7, 1)).toBe("⭐ 4.7");
  });

  it("never renders an em dash placeholder", () => {
    expect(formatAccountProfileRating(0, 0)).not.toContain("—");
    expect(formatAccountProfileRating(4.5, 2)).not.toContain("—");
  });
});
