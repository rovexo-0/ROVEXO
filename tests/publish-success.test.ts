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

  it("parses API publish block", () => {
    const publish = buildPublishSuccessPayload(sampleListing, "seller-1", "https://www.rovexo.co.uk");
    const parsed = parsePublishSuccessResponse({
      listing: sampleListing as SellerListing,
      publish,
    });
    expect(parsed.listingId).toBe("listing-123");
    expect(parsed.listingSlug).toBe("memory-foam-pillow-white");
    expect(parsed.listingUrl).toContain("/listing/memory-foam-pillow-white");
  });
});

describe("publish success dialog", () => {
  it("exposes functional buttons without auto-redirect", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/sell/PublishSuccessDialog.tsx"),
      "utf8",
    );
    expect(source).toContain("Share Listing");
    expect(source).toContain("Sell Another Item");
    expect(source).toContain("View Listing");
    expect(source).not.toContain("setTimeout");
    expect(source).toContain("LISTING_VIEW_ERROR_MESSAGE");
  });
});
