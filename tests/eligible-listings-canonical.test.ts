import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HomepageEligibility } from "@/lib/homepage/homepage-eligibility";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const APPROVED_ROW = {
  slug: "genuine-listing-123",
  title: "Sony WH-1000XM5 Headphones",
  description: "Barely used premium noise cancelling headphones in original box.",
  status: "published",
  price: 199,
  category_id: "cat-audio",
  moderation_status: "approved",
  profiles: {
    email: "seller@example.com",
    username: "seller",
    verified: true,
    account_status: "active",
    role: "seller",
  },
  product_images: [{ url: "https://cdn.example.com/a.jpg", thumbnail_url: null }],
};

describe("Canonical eligible-listings unification", () => {
  it("exposes a single canonical resolver used by every public surface", () => {
    const canonical = readSource("lib/listings/eligible-listings.ts");
    expect(canonical).toContain("export async function getEligibleListings");
    expect(canonical).toContain("searchListings");
  });

  it("routes Similar Items through the canonical resolver", () => {
    const repo = readSource("lib/products/repository.ts");
    expect(repo).toContain("getEligibleListings");
    // No unfiltered similar query bypassing eligibility.
    expect(repo).not.toMatch(/getSimilarProducts[\s\S]*?\.neq\("slug", slug\)\s*\n\s*\.limit/);
  });

  it("routes Seller Store through the canonical resolver", () => {
    const store = readSource("lib/profile/public.ts");
    expect(store).toContain("getEligibleListings");
    expect(store).toContain('surface: "seller"');
  });

  it("shares one eligibility gate (no duplicated inline fromRow filters)", () => {
    const repo = readSource("lib/listings/repository.ts");
    const products = readSource("lib/products/repository.ts");
    expect(repo).toContain("HomepageEligibility.filterEligibleRows");
    expect(products).toContain("HomepageEligibility.isRowEligible");
  });

  it("isRowEligible accepts the shared products row shape", () => {
    expect(HomepageEligibility.isRowEligible(APPROVED_ROW)).toBe(true);
  });

  it("excludes inactive unverified sellers uniformly (root-cause parity gate)", () => {
    expect(
      HomepageEligibility.isRowEligible({
        ...APPROVED_ROW,
        profiles: { ...APPROVED_ROW.profiles, verified: false, account_status: "pending" },
      }),
    ).toBe(false);
  });

  it("allows published listings from active sellers before full verification badge", () => {
    expect(
      HomepageEligibility.isRowEligible({
        ...APPROVED_ROW,
        profiles: { ...APPROVED_ROW.profiles, verified: false, account_status: "active" },
      }),
    ).toBe(true);
  });

  it("excludes pending/blocked moderation uniformly", () => {
    expect(
      HomepageEligibility.isRowEligible({ ...APPROVED_ROW, moderation_status: "pending" }),
    ).toBe(false);
    expect(
      HomepageEligibility.isRowEligible({ ...APPROVED_ROW, moderation_status: "blocked" }),
    ).toBe(false);
  });

  it("excludes listings with no real image uniformly", () => {
    expect(
      HomepageEligibility.isRowEligible({ ...APPROVED_ROW, product_images: [] }),
    ).toBe(false);
  });

  it("filterEligibleRows keeps only publicly-visible rows", () => {
    const rows = [
      APPROVED_ROW,
      { ...APPROVED_ROW, slug: "draft-1", status: "draft" },
      {
        ...APPROVED_ROW,
        slug: "unverified-inactive-1",
        profiles: { ...APPROVED_ROW.profiles, verified: false, account_status: "pending" },
      },
    ];
    const kept = HomepageEligibility.filterEligibleRows(rows);
    expect(kept.map((row) => row.slug)).toEqual(["genuine-listing-123"]);
  });
});
