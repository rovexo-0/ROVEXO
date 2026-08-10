/**
 * COD SÂNGE — Public Identity = username only on public marketplace surfaces.
 * Counts / presence only — never assert raw personal values.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  toPublicProductDocument,
  toPublicProductDocuments,
} from "@/lib/products/public-product-contract-v1";
import {
  PUBLIC_IDENTITY_FALLBACKS,
  resolvePublicUsernameLabel,
} from "@/lib/profile/public-display-name-v1";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function countToken(payload: string, token: string): number {
  return (payload.match(new RegExp(token, "g")) ?? []).length;
}

describe("public identity — username only", () => {
  it("resolvePublicUsernameLabel never falls back to full name", () => {
    expect(resolvePublicUsernameLabel("oly90")).toBe("oly90");
    expect(resolvePublicUsernameLabel("  ")).toBe(PUBLIC_IDENTITY_FALLBACKS.seller);
    expect(resolvePublicUsernameLabel(null, PUBLIC_IDENTITY_FALLBACKS.member)).toBe(
      PUBLIC_IDENTITY_FALLBACKS.member,
    );
    expect(resolvePublicUsernameLabel(undefined, "Seller")).toBe("Seller");
  });

  it("toPublicProductDocument forces sellerName from username and omits sellerEmail", () => {
    const input = {
      id: "p1",
      sellerName: "Should Never Appear",
      sellerUsername: "public_user",
      sellerEmail: "should-not-serialize@example.com",
      fullName: "Should Never Appear",
      rating: 5,
    };
    const redacted = toPublicProductDocument(input);
    expect(redacted.sellerName).toBe("public_user");
    expect(redacted.sellerUsername).toBe("public_user");
    expect(Object.prototype.hasOwnProperty.call(redacted, "sellerEmail")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(redacted, "fullName")).toBe(false);

    const serialized = JSON.stringify(redacted);
    expect(countToken(serialized, "sellerEmail")).toBe(0);
    expect(countToken(serialized, "Should Never Appear")).toBe(0);
    expect(countToken(serialized, "fullName")).toBe(0);
  });

  it("missing username uses Seller fallback — never keeps a personal sellerName", () => {
    const redacted = toPublicProductDocument({
      id: "p2",
      sellerName: "Personal Name Leak",
      sellerUsername: null,
    });
    expect(redacted.sellerName).toBe("Seller");
    expect(JSON.stringify(redacted)).not.toContain("Personal Name Leak");
  });

  it("batch helper preserves length and redacts emails", () => {
    const items = toPublicProductDocuments([
      { id: "a", sellerUsername: "a_user", sellerEmail: "a@example.com", sellerName: "A" },
      { id: "b", sellerUsername: "b_user", sellerEmail: "b@example.com", sellerName: "B" },
    ]);
    expect(items).toHaveLength(2);
    expect(JSON.stringify(items)).not.toMatch(/sellerEmail/);
    expect(items[0]?.sellerName).toBe("a_user");
  });

  it("product + listing map-at-source use resolvePublicUsernameLabel", () => {
    const products = read("lib/products/repository.ts");
    const listings = read("lib/listings/repository.ts");
    expect(products).toContain("resolvePublicUsernameLabel");
    expect(products).toContain("toPublicProductDocument");
    expect(listings).toContain("resolvePublicUsernameLabel");
    expect(products).not.toMatch(/sellerName:\s*row\.profiles\?\.full_name/);
    expect(listings).not.toMatch(/sellerName:\s*row\.profiles\?\.full_name/);
  });

  it("public profile DTO omits fullName; store uses username", () => {
    const profile = read("lib/profile/public.ts");
    const store = read("lib/store/store-repository.ts");
    const view = read("features/profile/components/ViewProfilePage.tsx");
    expect(profile).not.toMatch(/fullName:\s*profile\.full_name/);
    expect(profile).toContain("resolvePublicUsernameLabel");
    expect(store).toContain("resolvePublicUsernameLabel(profile.username");
    expect(view).toContain("profile.username");
    expect(view).not.toContain("profile.fullName");
  });

  it("reviews + search + follow public lists use username identity", () => {
    const reviews = read("lib/reviews/store.ts");
    const search = read("features/search/utils/search-server.ts");
    const follow = read("lib/follow/marketplace-follow-store-v1.ts");
    expect(reviews).toContain("resolvePublicUsernameLabel");
    expect(reviews).not.toMatch(/reviewerName:\s*row\.reviewer\?\.full_name/);
    expect(search).toContain("resolvePublicUsernameLabel");
    expect(search).not.toMatch(/profile\.username \|\| profile\.full_name/);
    expect(follow).not.toContain("fullName:");
  });

  it("private/operational surfaces still reference full name (not stripped globally)", () => {
    const settings = read("lib/account/account-settings-v1.ts");
    const shipping = read("lib/shipping/label-generation.server.ts");
    const hmrc = read("lib/compliance/hmrc-seller-snapshot.server.ts");
    expect(settings).toContain("fullName");
    expect(shipping).toContain("fullName");
    expect(hmrc).toContain("fullName");
  });
});
