import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AVIF_CONTENT_TYPE,
  AVIF_IMAGE_PIPELINE_V1,
  allAvifDerivativeStoragePaths,
  avifDerivativeStoragePath,
  isStoredAvifUrl,
  isValidAvifBuffer,
  preferAvifServingUrls,
  resolveStoredAvifDerivativeUrl,
} from "@/lib/media/avif-image-pipeline-v1";
import { generateAvifDerivatives } from "@/lib/media/avif-image-conversion.server";
import { resolveCardImageSources } from "@/lib/media/product-image";
import { StorageValidationError, validateUploadFile } from "@/lib/storage/upload";

const root = process.cwd();

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

async function loadSharp() {
  return (await import("sharp")).default;
}

async function makeRaster(format: "jpeg" | "png" | "webp", width = 1200, height = 900) {
  const sharp = await loadSharp();
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#c47a3a"/>
          <stop offset="1" stop-color="#4c1d95"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${Math.round(width / 2)}" cy="${Math.round(height / 2)}" r="${Math.round(width / 5)}" fill="#f5e6d3"/>
      <rect x="48" y="48" width="${width - 96}" height="72" fill="#111827"/>
    </svg>`,
  );
  const noise = await sharp({
    create: {
      width,
      height,
      channels: 3,
      noise: { type: "gaussian", mean: 128, sigma: 18 },
    },
  })
    .png()
    .toBuffer();
  const base = sharp(svg)
    .resize(width, height)
    .composite([{ input: noise, blend: "overlay", gravity: "centre" }]);
  if (format === "jpeg") return base.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  if (format === "png") return base.png({ compressionLevel: 6 }).toBuffer();
  return base.webp({ quality: 90 }).toBuffer();
}

describe("ROVEXO AVIF image pipeline v1", () => {
  it("is a shared account-type-agnostic engine (no Business fork)", () => {
    expect(AVIF_IMAGE_PIPELINE_V1.accountTypeAgnostic).toBe(true);
    expect(AVIF_IMAGE_PIPELINE_V1.businessDuplicatePipelineForbidden).toBe(true);
    expect(AVIF_IMAGE_PIPELINE_V1.clientAvifUploadForbidden).toBe(true);
    expect(AVIF_IMAGE_PIPELINE_V1.automaticProductionBackfillForbidden).toBe(true);
    const engine = readSource("lib/media/avif-image-pipeline-v1.ts");
    expect(engine).not.toMatch(/business[_-]?switch|onboarding/i);
    expect(readSource("lib/media/avif-image-conversion.server.ts")).not.toMatch(
      /business[_-]?switch|stripe|checkout/i,
    );
  });

  it("converts JPEG, PNG, and WebP into valid AVIF binaries with image/avif", async () => {
    const jpeg = await makeRaster("jpeg");
    const png = await makeRaster("png");
    const webp = await makeRaster("webp");
    const sharp = await loadSharp();

    const jpegAvif = await generateAvifDerivatives(jpeg);
    const pngAvif = await generateAvifDerivatives(png);
    const webpAvif = await generateAvifDerivatives(webp);

    for (const [label, original, result] of [
      ["jpeg", jpeg, jpegAvif],
      ["png", png, pngAvif],
      ["webp", webp, webpAvif],
    ] as const) {
      expect(isValidAvifBuffer(result.thumb.buffer), `${label} thumb ftyp`).toBe(true);
      expect(isValidAvifBuffer(result.medium.buffer), `${label} medium ftyp`).toBe(true);
      expect(isValidAvifBuffer(result.large.buffer), `${label} large ftyp`).toBe(true);
      expect(result.thumb.mimeType).toBe(AVIF_CONTENT_TYPE);
      expect(result.medium.mimeType).toBe(AVIF_CONTENT_TYPE);
      expect(result.large.mimeType).toBe(AVIF_CONTENT_TYPE);
      const thumbMeta = await sharp(result.thumb.buffer).metadata();
      expect(thumbMeta.format).toBe("heif");
      expect(Buffer.from(result.thumb.buffer.subarray(4, 12)).toString("ascii")).toContain("avif");
      expect(result.thumb.width).toBeLessThanOrEqual(400);
      expect(result.thumb.height).toBeLessThanOrEqual(400);
      expect(result.medium.width).toBeLessThanOrEqual(800);
      expect(result.large.width).toBeLessThanOrEqual(1600);
      expect(result.thumb.bytes).toBeLessThan(original.length);
      expect(result.large.bytes).toBeLessThan(original.length);
    }
  });

  it("rejects invalid and corrupt inputs", async () => {
    await expect(generateAvifDerivatives(Buffer.alloc(0))).rejects.toThrow(/invalid image rejected/i);
    await expect(generateAvifDerivatives(Buffer.from("not-an-image"))).rejects.toThrow(
      /invalid image rejected|corrupt image rejected/i,
    );
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    await expect(generateAvifDerivatives(jpegHeader)).rejects.toThrow(
      /invalid image rejected|corrupt image rejected/i,
    );
  });

  it("measures representative byte reduction across three derivatives", async () => {
    const originals = await Promise.all([
      makeRaster("jpeg", 1600, 1200),
      makeRaster("jpeg", 1400, 1050),
      makeRaster("jpeg", 1200, 900),
    ]);
    const converted = await Promise.all(originals.map((buffer) => generateAvifDerivatives(buffer)));

    const originalAvg = Math.round(
      originals.reduce((sum, buffer) => sum + buffer.length, 0) / originals.length,
    );
    const thumbAvg = Math.round(
      converted.reduce((sum, item) => sum + item.thumb.bytes, 0) / converted.length,
    );
    const mediumAvg = Math.round(
      converted.reduce((sum, item) => sum + item.medium.bytes, 0) / converted.length,
    );
    const largeAvg = Math.round(
      converted.reduce((sum, item) => sum + item.large.bytes, 0) / converted.length,
    );
    const reduction = Math.round((1 - largeAvg / originalAvg) * 100);

    expect(originalAvg).toBeGreaterThan(0);
    expect(thumbAvg).toBeLessThan(originalAvg);
    expect(mediumAvg).toBeLessThan(originalAvg);
    expect(largeAvg).toBeLessThan(originalAvg);
    expect(thumbAvg).toBeLessThanOrEqual(mediumAvg);
    expect(reduction).toBeGreaterThanOrEqual(40);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        ORIGINAL_AVG_BYTES: originalAvg,
        AVIF_THUMB_AVG_BYTES: thumbAvg,
        AVIF_MEDIUM_AVG_BYTES: mediumAvg,
        AVIF_LARGE_AVG_BYTES: largeAvg,
        BYTE_REDUCTION: `${reduction}%`,
      }),
    );
  });

  it("builds stable derivative paths that do not collide with GATE 3 -thumb. collapse", () => {
    const original = "seller-1/listing-1/1700000000-abcd.jpg";
    expect(avifDerivativeStoragePath(original, "thumb")).toBe(
      "seller-1/listing-1/1700000000-abcd-a400.avif",
    );
    expect(avifDerivativeStoragePath(original, "medium")).toBe(
      "seller-1/listing-1/1700000000-abcd-a800.avif",
    );
    expect(avifDerivativeStoragePath(original, "large")).toBe(
      "seller-1/listing-1/1700000000-abcd-a1600.avif",
    );
    expect(allAvifDerivativeStoragePaths(original).every((path) => !/-thumb\./i.test(path))).toBe(
      true,
    );
  });

  it("serves AVIF derivatives and falls back to JPEG/PNG without inventing fake AVIF URLs", () => {
    const original = "https://cdn.example.com/products/a.jpg";
    const avifLarge = "https://cdn.example.com/products/a-a1600.avif";
    const avifThumb = "https://cdn.example.com/products/a-a400.avif";
    const jpegThumb = "https://cdn.example.com/products/a-thumb.jpg";

    expect(resolveStoredAvifDerivativeUrl(avifLarge, "thumb")).toBe(avifThumb);
    expect(resolveStoredAvifDerivativeUrl(original, "thumb")).toBeNull();
    expect(isStoredAvifUrl(avifLarge)).toBe(true);
    expect(isStoredAvifUrl(original)).toBe(false);

    const withAvif = preferAvifServingUrls({
      originalPublicUrl: original,
      jpegThumbPublicUrl: jpegThumb,
      avifThumbPublicUrl: avifThumb,
      avifLargePublicUrl: avifLarge,
    });
    expect(withAvif.url).toBe(avifLarge);
    expect(withAvif.thumbnailUrl).toBe(avifThumb);

    const fallback = preferAvifServingUrls({
      originalPublicUrl: original,
      jpegThumbPublicUrl: jpegThumb,
    });
    expect(fallback.url).toBe(original);
    expect(fallback.thumbnailUrl).toBe(jpegThumb);

    const existing = resolveCardImageSources(jpegThumb, original);
    expect(existing.imageUrl).toBe(jpegThumb);
    expect(existing.imageFullUrl).toBe(original);
  });

  it("does not let client AVIF bypass upload validation", () => {
    const avif = new File([new Uint8Array([0, 1, 2])], "photo.avif", { type: "image/avif" });
    expect(() => validateUploadFile("products", avif)).toThrow(StorageValidationError);
    expect(() =>
      validateUploadFile(
        "products",
        new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" }),
      ),
    ).not.toThrow();
  });

  it("upload route keeps JPEG validation, Blob upload, cache, and AVIF conversion", () => {
    const route = readSource("app/api/listings/upload/route.ts");
    expect(route).toContain("validateUploadFile");
    expect(route).toContain("assertValidJpegBuffer");
    expect(route).toContain("enhanceListingImage");
    expect(route).toContain("generateAvifDerivatives");
    expect(route).toContain('contentType: AVIF_CONTENT_TYPE');
    expect(route).toContain("AVIF_CACHE_CONTROL");
    expect(route).toContain("if (!avifOk)");
    expect(route).not.toContain("Original JPEG + JPEG thumb still publish");
    expect(route).toContain("new Blob([new Uint8Array(fullBuffer)]");
    expect(route).toContain("requireApiAuth");
    expect(route).toContain("requireApiListingRole");
    expect(route).not.toContain("createAdminClient");
    expect(route).toContain("allAvifDerivativeStoragePaths(storagePath)");
  });

  it("listing card, search, shop, saved, orders, and listing detail keep existing image surfaces", () => {
    const feed = readSource("components/homepage/canonical/CanonicalMarketplaceFeed.tsx");
    expect(feed).toContain("ListingCard");
    expect(feed).toContain("HP_FEED_LISTING_IMAGE_SIZES");
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("useCardImageSrc");
    expect(card).toContain('loading={priority ? undefined : "lazy"}');
    expect(card).toContain("SafeImage");
    expect(card).not.toContain("AVIF");

    const search = readSource("features/search/components/SearchResultCard.tsx");
    expect(search).toContain("SafeImage");
    expect(search).toContain("useCardImageSrc");
    expect(search).toContain('sizes="72px"');
    expect(search).toContain('loading="lazy"');

    const saved = readSource("features/account-module/components/SavedItemsV1.tsx");
    expect(saved).toContain("ListingCard");
    expect(saved).toContain('surface="saved"');

    const shop = readSource("lib/store/store-repository.ts");
    expect(shop).toContain("resolveCardImageSources");
    expect(shop).toContain("thumbnail_url");
    expect(shop).toContain("imageUrl");

    const savedStore = readSource("lib/saved/store.ts");
    expect(savedStore).toContain("resolveCardImageSources");
    expect(savedStore).toContain("thumbnail_url");
    expect(savedStore).toContain("imageFullUrl: cardImages.imageFullUrl");

    const sellerShop = readSource("features/account-module/components/SellerListingsV1.tsx");
    expect(sellerShop).toContain("SafeImage");
    expect(sellerShop).toContain('sizes="56px"');

    const ordersList = readSource("features/orders/components/OrdersListItem.tsx");
    expect(ordersList).toContain("order.product.imageUrl");
    const ordersCard = readSource("features/orders/components/OrderProductCard.tsx");
    expect(ordersCard).toContain("order.product.imageUrl");

    const gallery = readSource("features/product-detail/ProductGalleryV1.tsx");
    expect(gallery).toContain("resolveStoredAvifDerivativeUrl");
    expect(gallery).toContain("priority={index === 0}");
    expect(gallery).toContain('loading={index === 0 ? undefined : "lazy"}');
    expect(gallery).toContain("quality={90}");
  });

  it("SafeImage serves stored AVIF unoptimized and keeps JPEG optimizer fallback", () => {
    const safe = readSource("components/ui/SafeImage.tsx");
    expect(safe).toContain("isStoredAvifUrl");
    expect(safe).toContain("isLegacyJpegThumbUrl");
    expect(safe).toContain("resolvedUnoptimized");
    expect(safe).toContain("PRODUCT_IMAGE_FALLBACK");
    const hook = readSource("lib/media/use-card-image-src.ts");
    expect(hook).toContain("isStoredAvifUrl");
    expect(hook).toContain("isDistinctThumbSrc");
    expect(hook).toContain("isLegacyJpegThumbUrl");
  });

  it("does not rewrite frozen checkout/orders/auth/shipping engines", () => {
    const conversion = readSource("lib/media/avif-image-conversion.server.ts");
    const upload = readSource("app/api/listings/upload/route.ts");
    expect(conversion).not.toContain("createOrderFromPaidCheckoutSession");
    expect(upload).not.toContain("ConversationHub");
    expect(upload).not.toContain("stripe");
  });

  it("products bucket migration allowlists image/avif without rewriting product_images", () => {
    const migration = readSource("supabase/migrations/20260902120000_products_bucket_avif_mime_v1.sql");
    expect(migration).toContain("image/avif");
    expect(migration).toContain("image/jpeg");
    expect(migration).toContain("image/png");
    expect(migration).toContain("image/webp");
    expect(migration).toContain("where id = 'products'");
    expect(migration).not.toContain("alter table product_images");
  });
});

describe("LEGACY_THUMB_RESOLUTION", () => {
  const original = "https://cdn.example.com/products/a.jpg";
  const jpegThumb = "https://cdn.example.com/products/a-thumb.jpg";
  const avifThumb = "https://cdn.example.com/products/a-a400.avif";
  const avifLarge = "https://cdn.example.com/products/a-a1600.avif";

  it("keeps legacy -thumb.jpg for cards and does not collapse to the original JPEG", () => {
    const sources = resolveCardImageSources(jpegThumb, original);
    expect(sources.imageUrl).toBe(jpegThumb);
    expect(sources.imageFullUrl).toBe(original);
    expect(sources.imageUrl).not.toBe(original);
    expect(sources.imageUrl).not.toMatch(/\.avif(?:\?|$)/i);
  });

  it("does not invent an AVIF URL when only JPEG exists", () => {
    const missingThumb = resolveCardImageSources(null, original);
    expect(missingThumb.imageUrl).toBe(original);
    expect(missingThumb.imageUrl).not.toContain("-a400.avif");

    const jpegOnly = resolveCardImageSources(jpegThumb, original);
    expect(jpegOnly.imageUrl).toBe(jpegThumb);
    expect(resolveStoredAvifDerivativeUrl(original, "thumb")).toBeNull();
  });

  it("falls back to JPEG/Next original when the derived thumb is unsafe or missing", () => {
    expect(resolveCardImageSources("", original).imageUrl).toBe(original);
    expect(resolveCardImageSources(null, original).imageUrl).toBe(original);
    expect(
      resolveCardImageSources("https://cdn.example.com/products/other-thumb.jpg", original).imageUrl,
    ).toBe(original);
  });

  it("rejects malformed, unsupported, and unauthorized thumb URLs", () => {
    expect(resolveCardImageSources("not a url-thumb.jpg", original).imageUrl).toBe(original);
    expect(
      resolveCardImageSources("https://cdn.example.com/products/a-thumb.gif", original).imageUrl,
    ).toBe(original);
    expect(
      resolveCardImageSources("https://evil.example/products/a-thumb.jpg", original).imageUrl,
    ).toBe(original);
  });

  it("leaves stored AVIF URLs unchanged", () => {
    const sources = resolveCardImageSources(avifThumb, avifLarge);
    expect(sources.imageUrl).toBe(avifThumb);
    expect(sources.imageFullUrl).toBe(avifLarge);
    expect(resolveCardImageSources(avifThumb, avifThumb).imageUrl).toBe(avifThumb);
  });

  it("listing detail continues using the large derivative while cards use the thumb", () => {
    const card = resolveCardImageSources(avifThumb, avifLarge);
    expect(card.imageUrl).toBe(avifThumb);
    expect(card.imageFullUrl).toBe(avifLarge);

    const jpegCard = resolveCardImageSources(jpegThumb, original);
    expect(jpegCard.imageUrl).toBe(jpegThumb);
    expect(jpegCard.imageFullUrl).toBe(original);

    const gallery = readSource("features/product-detail/ProductGalleryV1.tsx");
    expect(gallery).toContain("resolveStoredAvifDerivativeUrl(image, \"thumb\")");
    const detail = readSource("lib/products/repository.ts");
    expect(detail).toContain("resolveCardImageSources(image.thumbnail_url, image.url");
    expect(detail).toContain(".imageFullUrl");
    expect(detail).not.toContain("thumbIsDerived");
    expect(readSource("lib/listings/repository.ts")).not.toContain("thumbIsDerived");
    expect(readSource("lib/launch/recently-viewed.ts")).toContain("resolveCardImageSources");
    expect(readSource("lib/saved/store.ts")).toContain("resolveCardImageSources");
  });

  it("does not change order snapshot image wiring", () => {
    const ordersList = readSource("features/orders/components/OrdersListItem.tsx");
    const ordersCard = readSource("features/orders/components/OrderProductCard.tsx");
    expect(ordersList).toContain("order.product.imageUrl");
    expect(ordersCard).toContain("order.product.imageUrl");
    expect(readSource("app/api/listings/upload/route.ts")).not.toContain("order_items");
  });

  it("measures that a 400px thumb is smaller than the original JPEG cards used to download", async () => {
    const sharp = await loadSharp();
    const originalJpeg = await makeRaster("jpeg", 1600, 1200);
    const thumbJpeg = await sharp(originalJpeg)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();

    expect(thumbJpeg.length).toBeLessThan(originalJpeg.length);
    const sources = resolveCardImageSources(jpegThumb, original);
    expect(sources.imageUrl).toBe(jpegThumb);
    expect(sources.imageUrl).not.toBe(original);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        LEGACY_ORIGINAL_JPEG_BYTES: originalJpeg.length,
        LEGACY_THUMB_JPEG_BYTES: thumbJpeg.length,
        LEGACY_CARD_URL: sources.imageUrl,
        LEGACY_FULL_URL: sources.imageFullUrl,
        LEGACY_THUMB_VS_ORIGINAL: `${Math.round((1 - thumbJpeg.length / originalJpeg.length) * 100)}%`,
      }),
    );
  });
});
