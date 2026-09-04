import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PRODUCT_IMAGE_FALLBACK,
  PRODUCTION_SUPABASE_STORAGE_HOST,
  inferListingStorageObjectMissing,
  isRelativeSvgListingImage,
  isUnreachableListingStorageUrl,
  resolveCardImageSources,
} from "@/lib/media/product-image";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { preferAvifServingUrls } from "@/lib/media/avif-image-pipeline-v1";

const root = process.cwd();
const PRODUCTION_JPEG = `https://${PRODUCTION_SUPABASE_STORAGE_HOST}/storage/v1/object/public/products/22abaaea-c149-4caa-8c36-7badd704ae97/d812b411-daa1-4fc8-a1f0-ccbc99c689a0/1786381309390-272f313c.jpg`;
const PRODUCTION_THUMB = PRODUCTION_JPEG.replace(".jpg", "-thumb.jpg");
const LOCAL_JPEG =
  "http://127.0.0.1:54321/storage/v1/object/public/products/seller/listing/valid.jpg";
const LOCAL_THUMB = LOCAL_JPEG.replace(".jpg", "-thumb.jpg");
const LOCAL_AVIF_LARGE =
  "http://127.0.0.1:54321/storage/v1/object/public/products/seller/listing/valid-a1600.avif";
const LOCAL_AVIF_THUMB =
  "http://127.0.0.1:54321/storage/v1/object/public/products/seller/listing/valid-a400.avif";
const STORAGE_PATH =
  "22abaaea-c149-4caa-8c36-7badd704ae97/d812b411-daa1-4fc8-a1f0-ccbc99c689a0/1786381309390-272f313c.jpg";

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Dangling listing image fail-closed v1", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never emits a Production Storage URL while the app is on local Supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");

    expect(isUnreachableListingStorageUrl(PRODUCTION_JPEG)).toBe(true);
    expect(isRenderableImageSrc(PRODUCTION_JPEG)).toBe(false);

    const sources = resolveCardImageSources(PRODUCTION_THUMB, PRODUCTION_JPEG, {
      storagePath: STORAGE_PATH,
      storageObjectMissing: true,
    });
    expect(sources.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(sources.imageFullUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(JSON.stringify(sources)).not.toContain(PRODUCTION_SUPABASE_STORAGE_HOST);
    expect(JSON.stringify(sources)).not.toContain("/_next/image");
  });

  it("missing local JPEG object fail-closes to the placeholder, not a Storage URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    const sources = resolveCardImageSources(LOCAL_THUMB, LOCAL_JPEG, {
      storagePath: "seller/listing/valid.jpg",
      storageObjectMissing: true,
    });
    expect(sources.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(sources.imageFullUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(sources.imageUrl).not.toContain("127.0.0.1:54321");
    expect(sources.imageUrl).not.toContain(PRODUCTION_SUPABASE_STORAGE_HOST);
  });

  it("deleted listing with dangling JPEG storage_path fail-closes without a probe flag", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    expect(
      inferListingStorageObjectMissing({
        url: LOCAL_JPEG,
        thumbnailUrl: LOCAL_THUMB,
        storagePath: "seller/listing/valid.jpg",
        productStatus: "deleted",
      }),
    ).toBe(true);

    const sources = resolveCardImageSources(LOCAL_THUMB, LOCAL_JPEG, {
      storagePath: "seller/listing/valid.jpg",
      productStatus: "deleted",
    });
    expect(sources.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(sources.imageFullUrl).not.toContain("pklotmwxtnnepaitedic");
  });

  it("deleted listing with missing JPEG fail-closes when storage_path is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    expect(
      inferListingStorageObjectMissing({
        url: LOCAL_JPEG,
        thumbnailUrl: LOCAL_THUMB,
        storagePath: "",
        productStatus: "deleted",
      }),
    ).toBe(true);

    const emptyPath = resolveCardImageSources(LOCAL_THUMB, LOCAL_JPEG, {
      storagePath: "",
      productStatus: "deleted",
    });
    expect(emptyPath.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(emptyPath.imageFullUrl).toBe(PRODUCT_IMAGE_FALLBACK);
    expect(emptyPath.imageUrl).not.toContain("127.0.0.1:54321");
  });

  it("deleted listing still serves stored AVIF", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    expect(
      inferListingStorageObjectMissing({
        url: LOCAL_AVIF_LARGE,
        thumbnailUrl: LOCAL_AVIF_THUMB,
        storagePath: "",
        productStatus: "deleted",
      }),
    ).toBe(false);

    const avifDeleted = resolveCardImageSources(LOCAL_AVIF_THUMB, LOCAL_AVIF_LARGE, {
      storagePath: "",
      productStatus: "deleted",
    });
    expect(avifDeleted.imageUrl).toBe(LOCAL_AVIF_THUMB);
    expect(avifDeleted.imageFullUrl).toBe(LOCAL_AVIF_LARGE);
  });

  it("order_items snapshot JPEG fail-closes when the listing is deleted", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    const snapshot = resolveCardImageSources(LOCAL_JPEG, LOCAL_JPEG, {
      storagePath: "",
      productStatus: "deleted",
    });
    expect(snapshot.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
  });

  it("keeps canonical AVIF when the object exists", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    const served = preferAvifServingUrls({
      originalPublicUrl: LOCAL_JPEG,
      jpegThumbPublicUrl: LOCAL_THUMB,
      avifThumbPublicUrl: LOCAL_AVIF_THUMB,
      avifLargePublicUrl: LOCAL_AVIF_LARGE,
    });
    const card = resolveCardImageSources(served.thumbnailUrl, served.url, {
      storagePath: "seller/listing/valid.jpg",
    });
    expect(card.imageUrl).toBe(LOCAL_AVIF_THUMB);
    expect(card.imageFullUrl).toBe(LOCAL_AVIF_LARGE);
  });

  it("keeps JPEG fallback only when a valid JPEG exists", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    const sources = resolveCardImageSources(LOCAL_THUMB, LOCAL_JPEG);
    expect(sources.imageUrl).toBe(LOCAL_THUMB);
    expect(sources.imageFullUrl).toBe(LOCAL_JPEG);
  });

  it("keeps SVG E2E placeholders even when storage_path is a missing fake PNG", () => {
    const svg = "/icons/categories/electronics.svg";
    expect(isRelativeSvgListingImage(svg)).toBe(true);

    const sources = resolveCardImageSources("", svg, {
      storagePath: "300a8e27-62d8-4676-8bac-25a440b91d3c/e2e-txm-direct-msuyn0wj-ihem.png",
      storageObjectMissing: true,
    });
    expect(sources.imageUrl).toBe(svg);
    expect(sources.imageFullUrl).toBe(svg);

    const placeholder = resolveCardImageSources("", PRODUCT_IMAGE_FALLBACK, {
      storagePath: "",
    });
    expect(placeholder.imageUrl).toBe(PRODUCT_IMAGE_FALLBACK);
  });

  it("SafeImage and repositories fail-closed missing objects before next/image", () => {
    const safe = readSource("components/ui/SafeImage.tsx");
    expect(safe).toContain("isUnreachableListingStorageUrl");
    expect(safe).toContain("isRelativeSvgListingImage");
    expect(safe).toContain("next/image");

    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain("storagePath, productStatus");
    expect(repo).toContain("resolveCardImageSources(rawThumb, url, { storagePath, productStatus })");

    const products = readSource("lib/products/repository.ts");
    expect(products).toContain("storage_path");
    expect(products).toContain("productStatus: row.status");
  });

  it("Inbox conversation images resolve through resolveCardImageSources", () => {
    const source = readSource("lib/messages/store.ts");
    expect(source).toContain("resolveCardImageSources");
    expect(source).toContain("thumbnail_url, storage_path");
    expect(source).toContain("productStatus");
    expect(source).not.toMatch(/return productImages\(images\)\[0\] \?\? ""/);
    expect(source).not.toMatch(/sorted\.map\(\(image\) => image\.url\)/);
  });

  it("Inbox notification images resolve through resolveCardImageSources", () => {
    const source = readSource("lib/notifications/enrich-product-media.ts");
    expect(source).toContain("resolveCardImageSources");
    expect(source).toContain("thumbnail_url");
    expect(source).toContain("storage_path");
    expect(source).toContain("order_items");
    expect(source).not.toContain("primaryProductImageUrl");
  });

  it("Cart / Reviews / Promotions / Auctions / Offers / Saved use the canonical resolver", () => {
    const files = [
      "lib/cart/store.ts",
      "lib/reviews/store.ts",
      "lib/promotions/service.ts",
      "lib/promotions/admin.ts",
      "app/api/offers/route.ts",
      "app/api/offers/[id]/route.ts",
      "lib/saved/store.ts",
    ];
    for (const file of files) {
      const source = readSource(file);
      expect(source, file).toContain("resolveCardImageSources");
      expect(source, file).toContain("storage_path");
      expect(source, file).toContain("productStatus");
    }
  });

  it("Orders and Wallet fail-close listing images at READ time without rewriting snapshots", () => {
    const orders = readSource("lib/orders/store.ts");
    expect(orders).toContain("applyListingImageFailClosed");
    expect(orders).toContain("resolveCardImageSources");
    expect(orders).toContain("imageUrl: item?.image_url ?? \"\"");

    const wallet = readSource("lib/wallet/store.ts");
    expect(wallet).toContain("applyWalletListingImageFailClosed");
    expect(wallet).toContain("resolveCardImageSources");
    expect(wallet).toContain("productImageUrl: row.product_image_url ?? \"\"");

    const checkout = readSource("lib/orders/create-order-from-checkout-session.server.ts");
    expect(checkout).toContain("image_url:");
  });

  it("SafeImage keeps SVG placeholders as plain img and AVIF unoptimized", () => {
    const safe = readSource("components/ui/SafeImage.tsx");
    expect(safe).toContain("isRelativeSvgListingImage");
    expect(safe).toContain("isStoredAvifUrl");
    expect(safe).toContain("eslint-disable-next-line @next/next/no-img-element");
    expect(safe).toContain("unoptimized={resolvedUnoptimized ? true : undefined}");
  });
});
