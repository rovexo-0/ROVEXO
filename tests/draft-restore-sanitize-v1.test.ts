import { describe, expect, it } from "vitest";
import type { SellPhoto } from "@/features/sell/types";
import {
  isOwnedListingStoragePath,
  sanitizeRestoredSellPhotos,
} from "@/lib/sell/draft-restore-sanitize-v1";

const SELLER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

function photo(partial: Partial<SellPhoto> & Pick<SellPhoto, "id" | "previewUrl">): SellPhoto {
  return partial;
}

describe("draft-restore-sanitize-v1", () => {
  it("accepts owned temp and product-folder paths", () => {
    expect(
      isOwnedListingStoragePath(`${SELLER}/temp/sess/1.jpg`, SELLER),
    ).toBe(true);
    expect(
      isOwnedListingStoragePath(`${SELLER}/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/1.jpg`, SELLER),
    ).toBe(true);
  });

  it("rejects foreign seller, public URL, and absolute paths", () => {
    expect(isOwnedListingStoragePath(`${OTHER}/temp/sess/1.jpg`, SELLER)).toBe(false);
    expect(
      isOwnedListingStoragePath(
        `https://x.supabase.co/storage/v1/object/public/products/${SELLER}/temp/1.jpg`,
        SELLER,
      ),
    ).toBe(false);
    expect(isOwnedListingStoragePath(`/${SELLER}/temp/1.jpg`, SELLER)).toBe(false);
    expect(isOwnedListingStoragePath("temp/sess/1.jpg", SELLER)).toBe(false);
  });

  it("keeps owned uploaded photos unchanged", () => {
    const owned = photo({
      id: "a",
      previewUrl: "blob:a",
      uploaded: true,
      url: "https://cdn/a.jpg",
      storagePath: `${SELLER}/temp/sess/a.jpg`,
    });
    const result = sanitizeRestoredSellPhotos([owned], SELLER);
    expect(result.didMutate).toBe(false);
    expect(result.photos).toEqual([owned]);
  });

  it("strips stale upload metadata when a local file remains (Scenario C)", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" });
    const stale = photo({
      id: "a",
      previewUrl: "blob:a",
      file,
      uploaded: true,
      url: "https://cdn/a.jpg",
      storagePath: `${OTHER}/temp/sess/a.jpg`,
    });
    const result = sanitizeRestoredSellPhotos([stale], SELLER);
    expect(result.didMutate).toBe(true);
    expect(result.invalidatedUploadCount).toBe(1);
    expect(result.discardedCount).toBe(0);
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0]?.file).toBe(file);
    expect(result.photos[0]?.uploaded).toBe(false);
    expect(result.photos[0]?.storagePath).toBeUndefined();
    expect(result.photos[0]?.url).toBeUndefined();
  });

  it("discards URL-only foreign photos that cannot be re-uploaded", () => {
    const stale = photo({
      id: "a",
      previewUrl: "https://cdn/a.jpg",
      uploaded: true,
      url: "https://cdn/a.jpg",
      storagePath: `${OTHER}/temp/sess/a.jpg`,
    });
    const result = sanitizeRestoredSellPhotos([stale], SELLER);
    expect(result.photos).toEqual([]);
    expect(result.discardedCount).toBe(1);
    expect(result.invalidatedUploadCount).toBe(1);
  });

  it("without sellerId, strips remote upload claims but keeps local files", () => {
    const file = new File([new Uint8Array([9])], "b.jpg", { type: "image/jpeg" });
    const result = sanitizeRestoredSellPhotos(
      [
        photo({
          id: "b",
          previewUrl: "blob:b",
          file,
          uploaded: true,
          url: "https://cdn/b.jpg",
          storagePath: `${SELLER}/temp/sess/b.jpg`,
        }),
      ],
      null,
    );
    expect(result.photos[0]?.file).toBe(file);
    expect(result.photos[0]?.storagePath).toBeUndefined();
    expect(result.photos[0]?.uploaded).toBe(false);
  });
});
