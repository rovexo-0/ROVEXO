import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublicProfileHref } from "@/lib/profile/public-profile-href";
import { resolveShowcaseProfileHref } from "@/lib/homepage/showcase-sellers";
import type { Product } from "@/lib/products/types";

const root = process.cwd();

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function sampleProduct(partial: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "item",
    title: "Item",
    price: 10,
    condition: "Good",
    sellerName: "Seller",
    sellerId: "11111111-1111-4111-8111-111111111111",
    sellerUsername: "sellerone",
    rating: 5,
    reviewCount: 1,
    sections: ["new"],
    imageUrl: "/placeholder-product.svg",
    ...partial,
  };
}

describe("Public Profile navigation + Follow header integration — Phase I", () => {
  it("resolves public profile href from username", () => {
    expect(resolvePublicProfileHref("alice")).toBe("/user/alice");
    expect(resolvePublicProfileHref("  bob  ")).toBe("/user/bob");
    expect(resolvePublicProfileHref(null)).toBeNull();
    expect(resolvePublicProfileHref("")).toBeNull();
  });

  it("places Follow before More menu on public profile only", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("vp-v1__actions");
    expect(page).toContain("vp-v1__follow-btn");
    expect(page).toContain("!isOwnProfile");
    expect(page).toContain("FollowButton");
    expect(page).not.toContain("vp-v1__follow-slot");
    const actionsStart = page.indexOf('className={cn("vp-v1__actions"');
    expect(actionsStart).toBeGreaterThan(0);
    const actionsBlock = page.slice(actionsStart, actionsStart + 2500);
    const followIdx = actionsBlock.indexOf("vp-v1__follow-btn");
    expect(followIdx).toBeGreaterThan(0);
    expect(actionsBlock).not.toContain("vp-v1__menu-btn");
    expect(page).toContain('aria-label="Profile menu"');
    expect(page).toContain("vp-v1__header-actions");
  });

  it("wires Messages / Listing / PDP / Reviews entry points", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("resolvePublicProfileHref");
    expect(hub).toContain("conv-hub__header-profile-link");

    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("resolvePublicProfileHref");
    expect(card).toContain("sellerProfileLink");

    const pdp = readSource("features/product-detail/ProductStoreSection.tsx");
    expect(pdp).toContain("resolvePublicProfileHref");
    expect(pdp).toContain("pd-v1__store-identity-link");
    expect(pdp).toContain("resolveStoreHrefFromSeller");

    const reviews = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(reviews).toContain("reviewerUsername");
    expect(reviews).toContain("vp-v1__review-author");
  });

  it("reuses existing Follow Engine (no second button/API)", () => {
    const btn = readSource("components/follow/FollowButton.tsx");
    expect(btn).toContain("follow-engine-v1.0");
    expect(btn).toContain("/api/follows");
    expect(btn).not.toContain('role="dialog"');
  });

  it("homepage showcase identity prefers public profile", () => {
    const href = resolveShowcaseProfileHref(sampleProduct());
    expect(href).toBe("/user/sellerone");
  });
});
