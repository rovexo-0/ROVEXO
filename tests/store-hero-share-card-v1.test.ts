import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GET as ogGet } from "@/app/api/seo/og/route";
import { sellerPageMetadata } from "@/lib/seo/engine/metadata";
import {
  STORE_HERO_FEATURED_SLOT_COUNT,
  STORE_HERO_SHARE_CARD,
  STORE_HERO_SHARE_CARD_SIZE,
  STORE_HERO_SHARE_CARD_STRUCTURE_IDS,
  STORE_HERO_STAT_SLOT_COUNT,
  STORE_HERO_TRUST_SIGNALS,
  STORE_HERO_TRUST_SLOT_COUNT,
  extractStoreHeroShareCardStructure,
  formatStoreHeroCompactCount,
  formatStoreHeroPrice,
  padStoreHeroFeaturedListings,
  parseStoreHeroShareCardFromSearchParams,
  publicStoreHeroImageParam,
  renderStoreHeroShareCardSvg,
  storeHeroShareCardContainsPrivateData,
  toStoreHeroShareCardModel,
} from "@/lib/store-sharing/store-hero-share-card-v1";
import {
  buildStoreOgImagePath,
  buildStoreOgImageUrl,
  toStoreShareData,
} from "@/lib/store-sharing/store-share-v1";

const SNAPSHOT_DIR = join(process.cwd(), "test-results/store-hero-share-card");

function seller(overrides: Parameters<typeof toStoreShareData>[0]) {
  return toStoreShareData(overrides);
}

function render(overrides: Parameters<typeof toStoreShareData>[0]) {
  return renderStoreHeroShareCardSvg(toStoreHeroShareCardModel(seller(overrides)), {
    brandMarkDataUri: null,
    avatarDataUri: null,
    coverDataUri: null,
    listingImageDataUris: [],
  });
}

describe("StoreHeroShareCard v1", () => {
  it("uses one equal structure for every seller type", () => {
    const variants = [
      render({ username: "normal-seller", displayName: "Normal Seller", activeListingsCount: 4 }),
      render({
        username: "verified-shop",
        displayName: "Verified Shop",
        verified: true,
        rating: 4.9,
        reviewCount: 1200,
        followersCount: 2400,
        activeListingsCount: 512,
        soldCount: 1200,
        category: "Women's Fashion",
      }),
      render({
        username: "business-boutique",
        displayName: "Business Boutique",
        verified: true,
        activeListingsCount: 40,
        soldCount: 88,
        category: "Designer",
      }),
      render({ username: "new-seller", reviewCount: 0, activeListingsCount: 0, soldCount: 0 }),
      render({ username: "no-reviews", reviewCount: 0, rating: 5, activeListingsCount: 3 }),
      render({ username: "empty-listings", activeListingsCount: 0 }),
      render({
        username: "many-listings",
        activeListingsCount: 512,
        featuredListings: [
          { title: "Oversized Blazer", price: 28, imageUrl: "https://cdn.example.com/a.jpg" },
          { title: "Tote", price: 18, imageUrl: "https://cdn.example.com/b.jpg" },
        ],
      }),
    ];

    for (const svg of variants) {
      expect(extractStoreHeroShareCardStructure(svg)).toEqual([...STORE_HERO_SHARE_CARD_STRUCTURE_IDS]);
      expect(svg).toContain(`data-store-hero-share-card="${STORE_HERO_SHARE_CARD}"`);
      expect(svg).toContain('id="store-hero-listing-0"');
      expect(svg).toContain('id="store-hero-listing-4"');
      expect(svg).toContain('id="store-hero-trust-trusted"');
      expect(svg).toContain('id="store-hero-trust-secure"');
      expect(svg).toContain("Listings");
      expect(svg).toContain("Sold");
      expect(svg).toContain("Followers");
      expect(svg).not.toMatch(/\+ Follow|VIEW STORE|Message seller/i);
    }
  });

  it("renders dynamic public seller data only", () => {
    const svg = render({
      username: "rovexo.boutique",
      displayName: "Rovexo Boutique",
      verified: true,
      rating: 4.9,
      reviewCount: 1200,
      followersCount: 2400,
      activeListingsCount: 512,
      soldCount: 1200,
      category: "Women's Fashion",
      storeDescription: "Timeless style from independent sellers.",
      featuredListings: [{ title: "Oversized Blazer", price: 28, imageUrl: null }],
    });
    expect(svg).toContain("Rovexo Boutique");
    expect(svg).toContain("@rovexo.boutique");
    expect(svg).toContain("512");
    expect(svg).toContain("1.2K");
    expect(svg).toContain("2.4K");
    expect(svg).toContain("Women&apos;s Fashion");
    expect(svg).toContain("Oversized Blazer");
    expect(svg).toContain("£28.00");
    expect(svg).toContain('id="store-hero-verified"');
    expect(storeHeroShareCardContainsPrivateData(svg)).toBe(false);
  });

  it("keeps fallbacks for missing avatar, cover, listings, and reviews", () => {
    const svg = render({ username: "plain", avatarUrl: null, coverImageUrl: null, reviewCount: 0 });
    expect(svg).toContain("New seller on ROVEXO");
    expect(svg).toContain("store-hero-cover-fallback");
    expect(svg).toContain('id="store-hero-listing-0"');
    expect(svg).toContain('id="store-hero-listing-4"');
    expect(svg).toContain("—");
    expect(publicStoreHeroImageParam("http://localhost/secret.png")).toBeNull();
    expect(publicStoreHeroImageParam("https://cdn.example.com/ok.png")).toBe(
      "https://cdn.example.com/ok.png",
    );
  });

  it("rejects invalid usernames and private image hosts", () => {
    const svg = renderStoreHeroShareCardSvg(
      parseStoreHeroShareCardFromSearchParams(
        new URLSearchParams("kind=store&username=../admin&name=Hidden"),
      ),
      {
        brandMarkDataUri: null,
        avatarDataUri: null,
        coverDataUri: null,
        listingImageDataUris: [],
      },
    );
    expect(svg).not.toContain("../admin");
    expect(svg).toContain("@store");
    expect(publicStoreHeroImageParam("https://127.0.0.1/avatar.png")).toBeNull();
  });

  it("pads featured listings to a fixed five-slot rail", () => {
    const slots = padStoreHeroFeaturedListings([{ title: "One", price: 10, imageUrl: null }]);
    expect(slots).toHaveLength(STORE_HERO_FEATURED_SLOT_COUNT);
    expect(STORE_HERO_TRUST_SIGNALS).toHaveLength(STORE_HERO_TRUST_SLOT_COUNT);
    expect(STORE_HERO_STAT_SLOT_COUNT).toBe(3);
    expect(slots[0]?.title).toBe("One");
    expect(slots[4]).toBeNull();
  });

  it("formats compact counts and prices without leaking NaN", () => {
    expect(formatStoreHeroCompactCount(0)).toBe("0");
    expect(formatStoreHeroCompactCount(512)).toBe("512");
    expect(formatStoreHeroCompactCount(1200)).toBe("1.2K");
    expect(formatStoreHeroCompactCount(Number.NaN)).toBe("0");
    expect(formatStoreHeroPrice(null)).toBe("");
    expect(formatStoreHeroPrice(28)).toBe("£28.00");
  });

  it("encodes sold count, category, and featured listings on the OG image URL", () => {
    const data = seller({
      username: "alpha-store",
      soldCount: 12,
      category: "Accessories",
      featuredListings: [{ title: "Tote", price: 18.5, imageUrl: "https://cdn.example.com/tote.jpg" }],
    });
    const image = decodeURIComponent(buildStoreOgImagePath(data).replace(/\+/g, " "));
    expect(image).toContain("sold=12");
    expect(image).toContain("cat=Accessories");
    expect(image).toContain("n0=Tote");
    expect(image).toContain("p0=18.50");
    expect(image).toContain("i0=https://cdn.example.com/tote.jpg");
    expect(image).not.toMatch(/email|phone|wallet|stripe/i);
  });
});

describe("StoreHeroShareCard OG endpoint", () => {
  it("returns a 1200×630 PNG for multiple sellers", async () => {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const cases = [
      { file: "normal.png", data: seller({ username: "normal-seller", displayName: "Normal Seller" }) },
      {
        file: "verified.png",
        data: seller({
          username: "verified-shop",
          displayName: "Verified Shop",
          verified: true,
          rating: 4.9,
          reviewCount: 18,
        }),
      },
      {
        file: "business.png",
        data: seller({
          username: "business-boutique",
          displayName: "Business Boutique",
          verified: true,
          category: "Designer",
          soldCount: 40,
        }),
      },
      { file: "new.png", data: seller({ username: "new-seller", reviewCount: 0, activeListingsCount: 0 }) },
    ];

    for (const item of cases) {
      const imageUrl = buildStoreOgImageUrl(item.data);
      const response = await ogGet(
        new Request(imageUrl.replace("https://www.rovexo.co.uk", "http://localhost")),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      const bytes = Buffer.from(await response.arrayBuffer());
      expect(bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
        true,
      );
      const sharp = (await import("sharp")).default;
      const meta = await sharp(bytes).metadata();
      expect(meta.width).toBe(STORE_HERO_SHARE_CARD_SIZE.width);
      expect(meta.height).toBe(STORE_HERO_SHARE_CARD_SIZE.height);
      writeFileSync(join(SNAPSHOT_DIR, item.file), bytes);
    }
  });

  it("preserves store metadata contracts", () => {
    const page = sellerPageMetadata({
      username: "mishuu",
      listingCount: 8,
      soldCount: 3,
      category: "Fashion",
    });
    expect(page.openGraph?.title).toBe("mishuu's Store on ROVEXO");
    expect(page.openGraph?.description).toBe("Discover 8 items from mishuu on ROVEXO.");
    expect(page.openGraph?.url).toBe("https://www.rovexo.co.uk/@mishuu");
    expect(page.openGraph?.type).toBe("website");
    expect(page.twitter?.card).toBe("summary_large_image");
    const image = Array.isArray(page.openGraph?.images) ? page.openGraph.images[0] : null;
    const imageUrl = image && typeof image === "object" && "url" in image ? String(image.url) : "";
    expect(imageUrl).toContain("kind=store");
    expect(imageUrl).toContain("username=mishuu");
    expect(imageUrl).toContain("sold=3");
    expect(page.twitter && "images" in page.twitter ? page.twitter.images : []).toContain(imageUrl);
  });
});
