import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SellerListing } from "@/lib/listings/types";
import {
  buildPublishSuccessPayload,
  getListingCanonicalPath,
  parsePublishSuccessResponse,
} from "@/lib/sell/publish-success";

const sampleListing: Pick<
  SellerListing,
  "id" | "slug" | "title" | "status" | "createdAt" | "imageUrl" | "thumbnailUrl"
> = {
  id: "listing-123",
  slug: "memory-foam-pillow-white",
  title: "Memory Foam Pillow",
  status: "published",
  createdAt: "2026-07-12T12:00:00.000Z",
  imageUrl: "https://cdn.example.com/a.jpg",
  thumbnailUrl: "https://cdn.example.com/a-thumb.jpg",
};

describe("publish success payload", () => {
  it("builds canonical listing path", () => {
    expect(getListingCanonicalPath("memory-foam-pillow-white")).toBe(
      "/listing/memory-foam-pillow-white",
    );
  });

  it("builds full publish payload from listing", () => {
    const payload = buildPublishSuccessPayload(sampleListing, "seller-1", "https://www.rovexo.co.uk");
    expect(payload).toEqual({
      listingId: "listing-123",
      listingSlug: "memory-foam-pillow-white",
      listingUrl: "https://www.rovexo.co.uk/listing/memory-foam-pillow-white",
      sellerId: "seller-1",
      listingStatus: "published",
      publishedAt: "2026-07-12T12:00:00.000Z",
      title: "Memory Foam Pillow",
      imageUrl: "https://cdn.example.com/a-thumb.jpg",
    });
  });

  it("parses listing-only API response as publish fallback", () => {
    const parsed = parsePublishSuccessResponse({
      listing: {
        ...sampleListing,
        sellerId: "seller-1",
      },
    });
    expect(parsed.listingId).toBe("listing-123");
    expect(parsed.listingSlug).toBe("memory-foam-pillow-white");
    expect(parsed.sellerId).toBe("seller-1");
  });
});

describe("publish success dialog — Absolute Authority v1.0", () => {
  it("exposes X→Home · View Listing · Share Listing · Sell Another Item · photo", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/sell/PublishSuccessDialog.tsx"),
      "utf8",
    );
    expect(source).toContain("ShareListingSheet");
    expect(source).toContain("Sell Another Item");
    expect(source).toContain("Share Listing");
    expect(source).toContain("View Listing");
    expect(source).toContain("onDismissToHome");
    expect(source).toContain("Listing successfully published");
    expect(source).toContain("Your listing is now live.");
    expect(source).toContain("photoSrc");
    expect(source).not.toContain("setTimeout");
  });

  it("locks Sell Absolute Authority freeze SSOT", () => {
    const freeze = readFileSync(
      path.join(process.cwd(), "lib/sell/sell-absolute-authority-freeze-v1.ts"),
      "utf8",
    );
    expect(freeze).toContain('title: "Listing successfully published"');
    expect(freeze).toContain("parcelRecommended: false");
    expect(freeze).toContain("controlHeightPx: 56");
  });
});
