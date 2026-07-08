import { describe, expect, it } from "vitest";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import { resolveDashboardIconType } from "@/lib/icons/resolve-dashboard-icon-type";

describe("normalizeAvatarUrl", () => {
  it("rewrites Dicebear SVG URLs to PNG for next/image", () => {
    expect(normalizeAvatarUrl("https://api.dicebear.com/7.x/shapes/svg?seed=buyer01")).toBe(
      "https://api.dicebear.com/7.x/shapes/png?seed=buyer01",
    );
  });

  it("leaves Dicebear PNG URLs unchanged", () => {
    const url = "https://api.dicebear.com/7.x/shapes/png?seed=seller01";
    expect(normalizeAvatarUrl(url)).toBe(url);
  });

  it("leaves non-Dicebear URLs unchanged", () => {
    const url = "https://cdn.example.com/avatar.jpg";
    expect(normalizeAvatarUrl(url)).toBe(url);
  });
});

describe("resolveDashboardIconType", () => {
  it("is safe to import from server modules", () => {
    expect(resolveDashboardIconType("/categories")).toBe("categories");
    expect(resolveDashboardIconType("/orders")).toBe("orders");
  });
});
