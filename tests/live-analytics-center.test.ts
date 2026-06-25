import { describe, expect, it } from "vitest";
import {
  normalizeBrowser,
  normalizeDeviceCategory,
  normalizeTrafficSource,
  withPercentages,
} from "@/lib/analytics/live-center/normalize";
import { parseUserAgent } from "@/lib/analytics/live-center/user-agent";

describe("live analytics center normalization", () => {
  it("normalizes device categories", () => {
    expect(normalizeDeviceCategory("desktop")).toBe("Desktop");
    expect(normalizeDeviceCategory("mobile")).toBe("Mobile");
    expect(normalizeDeviceCategory(null)).toBe("Unknown");
  });

  it("normalizes browsers", () => {
    expect(normalizeBrowser("Chrome 121")).toBe("Chrome");
    expect(normalizeBrowser("Mobile Safari")).toBe("Safari");
  });

  it("maps traffic sources from GA dimensions", () => {
    expect(normalizeTrafficSource("google", "organic")).toBe("Organic Search");
    expect(normalizeTrafficSource("(direct)", "(none)")).toBe("Direct");
    expect(normalizeTrafficSource("facebook", "social")).toBe("Facebook");
  });

  it("parses user agents for presence heartbeats", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    );
    expect(parsed.browser).toBe("Chrome");
    expect(parsed.operatingSystem).toBe("Windows");
    expect(parsed.deviceCategory).toBe("Desktop");
  });

  it("calculates dimension percentages", () => {
    const rows = withPercentages([
      { id: "desktop", label: "Desktop", activeUsers: 3 },
      { id: "mobile", label: "Mobile", activeUsers: 1 },
    ]);
    expect(rows[0]?.label).toBe("Desktop");
    expect(rows[0]?.percentage).toBe(75);
  });
});
