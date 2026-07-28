import { describe, expect, it } from "vitest";

import {
  formatAccountProfileRating,
  isNewMemberProfile,
} from "@/lib/account-center/format-profile-rating";

describe("formatAccountProfileRating", () => {
  it("starts new users at 0.0 ★ (0)", () => {
    expect(formatAccountProfileRating(0, 0)).toBe("0.0 ★ (0)");
    expect(formatAccountProfileRating(4.9, 0)).toBe("0.0 ★ (0)");
    expect(isNewMemberProfile(0)).toBe(true);
  });

  it("formats rating with dynamic review count (no upper limit)", () => {
    expect(formatAccountProfileRating(4.87, 12)).toBe("4.9 ★ (12)");
    expect(formatAccountProfileRating(5, 3)).toBe("5.0 ★ (3)");
    expect(formatAccountProfileRating(4.7, 1)).toBe("4.7 ★ (1)");
    expect(formatAccountProfileRating(5, 15487)).toBe("5.0 ★ (15487)");
    expect(isNewMemberProfile(1)).toBe(false);
  });

  it("never uses an em dash placeholder", () => {
    expect(formatAccountProfileRating(0, 0)).not.toContain("—");
    expect(formatAccountProfileRating(4.5, 2)).not.toContain("—");
  });
});
