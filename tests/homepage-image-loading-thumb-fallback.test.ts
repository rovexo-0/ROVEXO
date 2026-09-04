import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveCardImageSources, PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

const root = process.cwd();

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Homepage image loading — thumb→url→placeholder", () => {
  it("prefers thumbnail but keeps full url for fallback", () => {
    const sources = resolveCardImageSources(
      "https://cdn.example.com/a-thumb.jpg",
      "https://cdn.example.com/a.jpg",
    );
    expect(sources.imageUrl).toBe("https://cdn.example.com/a-thumb.jpg");
    expect(sources.imageFullUrl).toBe("https://cdn.example.com/a.jpg");
  });

  it("uses full url when thumbnail is missing", () => {
    const sources = resolveCardImageSources(null, "https://cdn.example.com/a.jpg");
    expect(sources.imageUrl).toBe("https://cdn.example.com/a.jpg");
    expect(sources.imageFullUrl).toBe("https://cdn.example.com/a.jpg");
  });

  it("uses placeholder only when both are missing", () => {
    const sources = resolveCardImageSources(null, null);
    expect(sources.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(sources.imageFullUrl).toBe(PRODUCT_IMAGE_FALLBACK);
  });

  it("treats literal null/undefined thumbnail strings as missing", () => {
    const sources = resolveCardImageSources("null", "https://cdn.example.com/a.jpg");
    expect(sources.imageUrl).toBe("https://cdn.example.com/a.jpg");
    expect(sources.imageFullUrl).toBe("https://cdn.example.com/a.jpg");

    const sources2 = resolveCardImageSources("undefined", null);
    expect(sources2.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
  });

  it("GATE 3 repair remains compatible (thumbnail_url = url)", () => {
    const gate3 = readSource("scripts/gate3-repair-dangling-thumbnails.ts");
    expect(gate3).toContain('update({ thumbnail_url: url })');
    expect(gate3).toContain("repair_dangling_thumbnail_url_only");

    const repaired = resolveCardImageSources(
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/a.jpg",
    );
    expect(repaired.imageUrl).toBe(repaired.imageFullUrl);
  });

  it("publish never persists unverified thumbnail URLs", () => {
    const source = readSource("lib/listings/repository.ts");
    const start = source.indexOf("async function moveImageToProductFolder");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = source.indexOf("\nasync function", start + 1);
    const slice = source.slice(start, end > 0 ? end : undefined);
    expect(slice).toContain("storageObjectExists");
    expect(slice).toContain('!image.storagePath.includes("/temp/")');
    expect(slice).toContain("resolveOwnedListingImageServingUrls");
    expect(slice).toContain("newThumbPath");
    expect(source).toContain("jpegThumbUrl");
    expect(source).toContain("preferAvifServingUrls");
  });

  it("ListingCard uses one-shot card image fallback without SafeImage redesign", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("useCardImageSrc");
    expect(card).toContain("onCardImageError");
    expect(card).toContain("cardImageUnoptimized");
    expect(card).not.toContain('from "next/image"');

    const safe = readSource("components/ui/SafeImage.tsx");
    expect(safe).toContain("PRODUCT_IMAGE_FALLBACK");
    expect(safe).toContain("setFailedKey");
    expect(safe).toContain("markFailedImageSrc");
    expect(safe).toContain("naturalWidth <= 2");
    expect(safe).toContain("naturalHeight <= 2");
  });

  it("product repository exposes imageFullUrl from product_images.url", () => {
    const source = readSource("lib/products/repository.ts");
    expect(source).toContain("resolveCardImageSources");
    expect(source).toContain("imageFullUrl: cardImages.imageFullUrl");
    expect(source).not.toContain("thumbIsDerived");
    expect(readSource("lib/listings/repository.ts")).not.toContain("thumbIsDerived");
  });

  it("does not collapse a stored sibling -thumb.jpg to the original JPEG", () => {
    const sources = resolveCardImageSources(
      "https://cdn.example.com/a-thumb.jpg",
      "https://cdn.example.com/a.jpg",
    );
    expect(sources.imageUrl).toBe("https://cdn.example.com/a-thumb.jpg");
    expect(sources.imageFullUrl).toBe("https://cdn.example.com/a.jpg");
  });
});
