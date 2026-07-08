import { describe, expect, it } from "vitest";
import {
  HP_FEED_DEFAULT_COLUMNS,
  HP_LISTING_REF,
  HP_RESPONSIVE_VIEWPORTS,
  HP_STORE_CARD_REF,
  resolveFeedColumnCount,
} from "@/lib/homepage/canonical-responsive";

describe("canonical homepage responsive engine", () => {
  it("defines reference listing proportions", () => {
    expect(HP_LISTING_REF.width).toBe(160);
    expect(HP_LISTING_REF.height).toBe(340);
    expect(HP_LISTING_REF.imageHeight).toBe(220);
  });

  it("defines reference store card proportions", () => {
    expect(HP_STORE_CARD_REF.width).toBe(112);
    expect(HP_STORE_CARD_REF.height).toBe(206);
  });

  it("resolves feed columns across the device matrix", () => {
    expect(resolveFeedColumnCount(360)).toBe(HP_FEED_DEFAULT_COLUMNS);
    expect(resolveFeedColumnCount(390)).toBe(HP_FEED_DEFAULT_COLUMNS);
    expect(resolveFeedColumnCount(640)).toBe(3);
    expect(resolveFeedColumnCount(834)).toBe(3);
    expect(resolveFeedColumnCount(1024)).toBe(4);
    expect(resolveFeedColumnCount(1440)).toBe(5);
    expect(resolveFeedColumnCount(1920)).toBe(6);
    expect(resolveFeedColumnCount(2560)).toBe(6);
  });

  it("covers certification viewports", () => {
    const ids = HP_RESPONSIVE_VIEWPORTS.map((v) => v.id);
    expect(ids).toContain("iphone-se");
    expect(ids).toContain("iphone-pro-max");
    expect(ids).toContain("android-small");
    expect(ids).toContain("foldable");
    expect(ids).toContain("ultrawide");
    expect(HP_RESPONSIVE_VIEWPORTS.length).toBeGreaterThanOrEqual(14);
  });
});
