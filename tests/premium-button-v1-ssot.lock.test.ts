import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Premium Button System v1.0 — SSOT lock", () => {
  it("ships Visit Store PremiumButton SSOT without social Follow", () => {
    const btn = readSource("components/ui/PremiumButton.tsx");
    const css = readSource("components/ui/PremiumButton.module.css");

    expect(btn).toContain("data-premium-button=\"v1.0\"");
    expect(btn).toContain('"primary"');
    expect(btn).toContain('"secondary"');
    expect(btn).not.toContain('"follow"');
    expect(btn).not.toContain('"following"');
    expect(css).toContain("pbShineFollowGlow");
    expect(css).toContain("5s");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("#a855f7");
  });

  it("Showcase header has no Follow button", () => {
    const header = readSource(
      "components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx",
    );
    expect(header).not.toContain("FollowSellerButton");
    expect(header).not.toContain("Visit Store");
    expect(header).toContain('data-hp-store-header="v2.0"');
  });
});
