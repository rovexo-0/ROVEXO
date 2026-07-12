import { describe, expect, it } from "vitest";
import {
  isMyListingsPath,
  resolveListingBackFallback,
  resolveStorePath,
} from "@/lib/navigation/listing-back";

describe("listing back navigation fallback", () => {
  it("returns home when there is no prior path", () => {
    expect(resolveListingBackFallback(null)).toBe("/");
  });

  it("returns seller listings when opened from my listings", () => {
    expect(resolveListingBackFallback("/seller/listings")).toBe("/seller/listings");
    expect(resolveListingBackFallback("/account/listings")).toBe("/seller/listings");
    expect(resolveListingBackFallback("/seller/listings/abc/edit")).toBe("/seller/listings");
  });

  it("returns the store profile when opened from a store", () => {
    expect(resolveListingBackFallback("/store/techvault-pro")).toBe("/store/techvault-pro");
    expect(resolveListingBackFallback("/user/jane-seller?tab=items")).toBe("/user/jane-seller");
  });

  it("returns home from browse surfaces", () => {
    expect(resolveListingBackFallback("/search?q=phone")).toBe("/");
    expect(resolveListingBackFallback("/category/electronics")).toBe("/");
  });

  it("identifies my listings and store paths", () => {
    expect(isMyListingsPath("/seller/listings")).toBe(true);
    expect(resolveStorePath("/store/acme")).toBe("/store/acme");
    expect(resolveStorePath("/listing/foo")).toBeNull();
  });
});
