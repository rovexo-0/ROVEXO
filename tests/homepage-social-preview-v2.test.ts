import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  HOMEPAGE_SHARE,
  HOMEPAGE_SOCIAL_PREVIEW_V2,
} from "@/lib/share/homepage";
import { PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";

function read(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Homepage Social Preview v2 — COD SÂNGE", () => {
  it("ships canonical 1200×630 social JPEG at the Owner path", async () => {
    const asset = path.join(process.cwd(), "public/og/rovexo-homepage-social-v2.jpg");
    expect(existsSync(asset)).toBe(true);
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.imagePath).toBe("/og/rovexo-homepage-social-v2.jpg");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.imageWidth).toBe(1200);
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.imageHeight).toBe(630);
    const bytes = readFileSync(asset);
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
    const sharp = (await import("sharp")).default;
    const meta = await sharp(asset).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
    expect(meta.format).toBe("jpeg");
  });

  it("locks OG + Twitter metadata to production URL and v2 copy", () => {
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.title).toBe("ROVEXO — Buy • Sell • Grow");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.description).toBe(
      "Buy, sell and discover great products on ROVEXO.",
    );
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.type).toBe("website");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.url).toBe(`${PRODUCTION_ORIGIN}/`);
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.imageAbsoluteUrl).toBe(
      `${PRODUCTION_ORIGIN}/og/rovexo-homepage-social-v2.jpg`,
    );
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.twitterCard).toBe("summary_large_image");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.url).not.toContain("localhost");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.imageAbsoluteUrl).not.toContain("localhost");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.url).not.toContain("?");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.description.toLowerCase()).not.toContain("12.4k");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.description.toLowerCase()).not.toContain("thousands");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.description.toLowerCase()).not.toContain("millions");
  });

  it("wires homepage page metadata to Social Preview v2 SSOT", () => {
    const page = read("app/(platform)/page.tsx");
    expect(page).toContain("HOMEPAGE_SOCIAL_PREVIEW_V2");
    expect(page).toContain("imageAbsoluteUrl");
    expect(page).toContain("twitterCard");
    expect(page).not.toContain("/brand/og-image.png");
    expect(page).not.toContain("Buy & Sell with Confidence");
    expect(page).not.toContain("Discover thousands of products");
  });

  it("preserves Share Nodes Social V1 behaviour", () => {
    const button = read("components/header/HomepageHeaderShareButton.tsx");
    const header = read("components/header/RovexoHeaderV2.tsx");
    expect(header).toContain("HomepageHeaderShareButton");
    expect(button).toContain("ShareNodesLineIcon");
    expect(button).toContain('aria-label="Share ROVEXO"');
    expect(button).toContain("navigator.share");
    expect(button).toContain("WhatsApp");
    expect(button).toContain("Facebook");
    expect(button).toContain("Copy link");
    expect(HOMEPAGE_SHARE.url).toBe(`${PRODUCTION_ORIGIN}/`);
  });
});
