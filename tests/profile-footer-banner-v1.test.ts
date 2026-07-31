import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROFILE_FOOTER_BANNER_ALT,
  PROFILE_FOOTER_BANNER_SRC,
} from "@/components/profile/ProfileFooterBanner";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Profile Footer Banner v1.0", () => {
  it("ships transparent PNG under public path", () => {
    const asset = path.join(process.cwd(), "public", "images", "profile", "profile-footer-banner.png");
    expect(existsSync(asset)).toBe(true);
    const buf = readFileSync(asset);
    expect(buf.length).toBeGreaterThan(10_000);
    expect(buf.length).toBeLessThan(500_000);
    // PNG signature
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("locks component contract (SafeImage + lazy + alt)", () => {
    const source = readSource("components/profile/ProfileFooterBanner.tsx");
    expect(source).toContain("SafeImage");
    expect(source).not.toContain('from "next/image"');
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
    expect(source).toContain("profile-footer-banner");
    expect(PROFILE_FOOTER_BANNER_SRC).toBe("/images/profile/profile-footer-banner.png");
    expect(PROFILE_FOOTER_BANNER_ALT).toBe(
      "ROVEXO mascot helping users buy, sell and grow.",
    );
  });

  it("places full-width banner after Sign Out on Profile hub", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");
    const component = readSource("components/profile/ProfileFooterBanner.tsx");
    expect(home).toMatch(/AccountMenuSections[\s\S]*ProfileFooterBanner/);
    expect(css).toContain(".profile-footer-banner");
    expect(css).toContain("margin-top: 24px");
    expect(css).toContain("margin-bottom: 32px");
    expect(css).toContain("width: 100% !important");
    expect(css).toContain("height: auto !important");
    expect(css).not.toContain("max-height: 140px");
    expect(css).not.toContain("max-height: 170px");
    expect(component).toContain('sizes="100vw"');
    expect(component).toContain('width: "100%"');
    expect(component).toContain('data-profile-footer-banner="v1.0-full-width"');
  });
});
