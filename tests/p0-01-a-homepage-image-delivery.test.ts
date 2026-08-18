import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HP_FEED_GRID_GAP_PX,
  HP_FEED_LCP_IMAGE_HEIGHT_PX,
  HP_FEED_LCP_IMAGE_WIDTH_PX,
  HP_FEED_LISTING_IMAGE_SIZES,
  HP_SHOWCASE_LCP_IMAGE_HEIGHT_PX,
  HP_SHOWCASE_LCP_IMAGE_WIDTH_PX,
  homepageFeedCardCssWidthPx,
} from "@/components/homepage/canonical/constants";
import { HOMEPAGE_CONTENT_PAD_X_PX } from "@/lib/design-system/design-decision-001-internal-ui-v1.1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

/** Next.js default `allSizes` (imageSizes ∪ deviceSizes), sorted. */
const NEXT_ALL_SIZES = [
  32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
] as const;

function nextPickWidth(cssPx: number): number {
  return NEXT_ALL_SIZES.find((size) => size >= cssPx) ?? NEXT_ALL_SIZES[NEXT_ALL_SIZES.length - 1]!;
}

/** Next `getWidths` when `width` is set and `sizes` is omitted: `[width, width*2]`. */
function nextIntrinsicSrcsetWidths(cssWidth: number): [number, number] {
  return [nextPickWidth(cssWidth), nextPickWidth(cssWidth * 2)];
}

describe("P0-01-A — Homepage listing image delivery", () => {
  it("defines surface-accurate feed and showcase sizes constants", () => {
    const constants = readSource("components/homepage/canonical/constants.ts");
    expect(constants).toContain("HP_FEED_LISTING_IMAGE_SIZES");
    expect(constants).toContain("HP_SHOWCASE_LISTING_IMAGE_SIZES");
    expect(HP_FEED_LISTING_IMAGE_SIZES).toBe(
      "(max-width: 440px) 200px, (max-width: 640px) 300px, (max-width: 1024px) 491px, 700px",
    );
    expect(constants).toContain(
      '(max-width: 639px) 112px, (max-width: 1023px) 120px, 128px',
    );
    expect(HP_FEED_LISTING_IMAGE_SIZES).not.toContain("vw");
  });

  it("feed sizes match the locked 2-column card CSS width", () => {
    expect(HOMEPAGE_CONTENT_PAD_X_PX).toBe(16);
    expect(HP_FEED_GRID_GAP_PX).toBe(10);
    expect(homepageFeedCardCssWidthPx(360)).toBe(159);
    expect(homepageFeedCardCssWidthPx(390)).toBe(174);
    expect(homepageFeedCardCssWidthPx(412)).toBe(185);
    expect(homepageFeedCardCssWidthPx(440)).toBe(199);
    expect(homepageFeedCardCssWidthPx(640)).toBe(299);
    expect(homepageFeedCardCssWidthPx(1024)).toBe(491);
    expect(homepageFeedCardCssWidthPx(1440)).toBe(699);
    expect(HP_FEED_LCP_IMAGE_WIDTH_PX).toBe(200);
    expect(HP_FEED_LCP_IMAGE_HEIGHT_PX).toBe(250);
    expect(HP_SHOWCASE_LCP_IMAGE_WIDTH_PX).toBe(128);
    expect(HP_SHOWCASE_LCP_IMAGE_HEIGHT_PX).toBe(160);
  });

  it("wires showcase to showcase sizes and a single LCP priority card", () => {
    const section = readSource(
      "components/homepage/canonical/featured-store/FeaturedStoreSection.tsx",
    );
    expect(section).toContain("HP_SHOWCASE_LISTING_IMAGE_SIZES");
    expect(section).toContain("imageSizes={HP_SHOWCASE_LISTING_IMAGE_SIZES}");
    expect(section).toContain("priority={index === 0}");
    expect(section).toContain("HP_SHOWCASE_LCP_IMAGE_WIDTH_PX");
    expect(section).toContain("priorityImageWidth={index === 0 ? HP_SHOWCASE_LCP_IMAGE_WIDTH_PX : undefined}");
    expect(section).not.toContain("priority={index < 3}");
  });

  it("wires feed to feed sizes and LCP only when showcase is absent", () => {
    const feed = readSource("components/homepage/canonical/CanonicalMarketplaceFeed.tsx");
    const home = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    expect(feed).toContain("HP_FEED_LISTING_IMAGE_SIZES");
    expect(feed).toContain("imageSizes={HP_FEED_LISTING_IMAGE_SIZES}");
    expect(feed).toContain("HP_FEED_LCP_IMAGE_WIDTH_PX");
    expect(feed).toContain("lcpImagePriority");
    expect(feed).toContain("priority={lcpImagePriority && index === 0}");
    expect(feed).toContain("priorityImageWidth");
    expect(feed).not.toContain("priority={index < 2}");
    expect(home).toContain("selectHomepageFeaturedStore");
    expect(home).toContain("lcpImagePriority={!showcaseOwnsLcp}");
  });

  it("does not change ListingCard default sizes or SafeImage / next.config images", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    const safe = readSource("components/ui/SafeImage.tsx");
    const nextConfig = readSource("next.config.ts");
    expect(card).toContain(
      'const IMG_SIZES = "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px"',
    );
    expect(card).toContain("priorityImageWidth");
    expect(card).toContain("lcpIntrinsic");
    expect(safe).toContain('resolvedFetchPriority = fetchPriority ?? (priority ? "high" : undefined)');
    expect(nextConfig).not.toContain("deviceSizes");
    expect(nextConfig).not.toContain("imageSizes:");
  });
});

describe("Performance Phase 1 — LCP delivery widths", () => {
  it("feed LCP intrinsic width maps to 256/640 — never 3840 — at DPR 1 and DPR 2", () => {
    const [dpr1, dpr2] = nextIntrinsicSrcsetWidths(HP_FEED_LCP_IMAGE_WIDTH_PX);
    expect(dpr1).toBe(256);
    expect(dpr2).toBe(640);
    expect(dpr1).toBeLessThan(3840);
    expect(dpr2).toBeLessThan(3840);
  });

  it("showcase LCP intrinsic width maps to 128/256 — never 3840", () => {
    const [dpr1, dpr2] = nextIntrinsicSrcsetWidths(HP_SHOWCASE_LCP_IMAGE_WIDTH_PX);
    expect(dpr1).toBe(128);
    expect(dpr2).toBe(256);
  });

  it("desktop 2-column card still must not use the fill 3840 fallback for the LCP slot", () => {
    const desktopCard = homepageFeedCardCssWidthPx(1440);
    expect(desktopCard).toBe(699);
    const lcpSrcset = nextIntrinsicSrcsetWidths(HP_FEED_LCP_IMAGE_WIDTH_PX);
    expect(lcpSrcset).not.toContain(3840);
    expect(Math.max(...lcpSrcset)).toBe(640);
  });

  it("ListingCard omits fill and sizes on the LCP intrinsic path", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    const safe = readSource("components/ui/SafeImage.tsx");
    expect(card).toContain("fill={!lcpIntrinsic}");
    expect(card).toContain("sizes={lcpIntrinsic ? undefined : imageSizes ?? IMG_SIZES}");
    expect(card).toContain("priority={priority}");
    expect(safe).toContain('resolvedFetchPriority = fetchPriority ?? (priority ? "high" : undefined)');
  });

  it("emits one explicit homepage feed LCP preload and disables Next.js automatic preload for that image only", () => {
    const safe = readSource("components/ui/SafeImage.tsx");
    const card = readSource("components/ui/ListingCard.tsx");
    expect(safe).toContain("getImageProps");
    expect(safe).toContain('rel="preload"');
    expect(safe).toContain("href={homepageFeedLcpPreload.href}");
    expect(safe).toContain("imageSrcSet={homepageFeedLcpPreload.imageSrcSet}");
    expect(safe).not.toContain("imageSizes=");
    expect(safe).not.toContain("@/components/homepage/canonical/constants");
    expect(safe).toContain('priority: false as const, preload: false as const, loading: "eager" as const');
    expect(safe).toContain('<picture style={{ display: "contents" }}>{image}</picture>');
    expect(safe).toContain("width === 200");
    expect(safe).toContain("height === 250");
    expect(card).toContain("sizes={lcpIntrinsic ? undefined : imageSizes ?? IMG_SIZES}");
    expect(card).toContain("priority={priority}");
    expect(card).toContain("fill={!lcpIntrinsic}");
  });
});
