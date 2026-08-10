import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — My Profile listing image width refinement", () => {
  it("widens images only under My Profile store grid", () => {
    const css = readSource("styles/rovexo/view-profile-v1.css");
    expect(css).toContain(".vp-v1[data-my-profile]");
    expect(css).toContain('data-store-listing-cards="store"');
    expect(css).toContain("width: 92%");
    expect(css).toContain("object-fit: cover");
  });

  it("does not change shared store premium tokens or Homepage card CSS", () => {
    const storeCss = readSource("styles/rovexo/store-listing-card-premium-v1.css");
    expect(storeCss).toContain("--rx-store-img-w: 88px");
    expect(storeCss).toContain("--rx-store-img-w: 96px");
    expect(storeCss).not.toContain("width: 92%");

    const homeCss = readSource("components/ui/ListingCard.module.css");
    expect(homeCss).toContain("aspect-ratio: var(--rx-listing-image-ratio, 4 / 5)");
    expect(homeCss).not.toContain("data-my-profile");
    expect(homeCss).not.toContain("data-store-listing-cards");
  });
});
