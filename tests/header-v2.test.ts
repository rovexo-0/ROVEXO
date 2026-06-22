import { describe, expect, it } from "vitest";
import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";

describe("mobile header v2", () => {
  it("keeps mobile logo height within the 26–30px spec", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.mobileHeight).toBeGreaterThanOrEqual(26);
    expect(ROVEXO_LOGO_DIMENSIONS.mobileHeight).toBeLessThanOrEqual(30);
  });

  it("keeps desktop logo height within the 30–34px spec", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.desktopHeight).toBeGreaterThanOrEqual(30);
    expect(ROVEXO_LOGO_DIMENSIONS.desktopHeight).toBeLessThanOrEqual(34);
  });

  it("reserves stable logo width to reduce layout shift", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.width).toBeGreaterThan(ROVEXO_LOGO_DIMENSIONS.desktopHeight);
  });
});
