import { afterEach, describe, expect, it } from "vitest";
import {
  APPROVED_DEMO_SLUG_PATTERN,
  HomepageEligibility,
  filterHomepageProducts,
  type HomepageListingInput,
} from "@/lib/homepage/homepage-eligibility";
import type { Product } from "@/lib/products/types";

function input(
  partial: Partial<HomepageListingInput> & Pick<HomepageListingInput, "slug" | "title">,
): HomepageListingInput {
  return {
    status: "published",
    price: 49.99,
    categoryId: "cat-1",
    description: "Premium item in excellent condition with tracked UK delivery and buyer protection.",
    imageUrl: "/icons/categories/phones.svg",
    imageCount: 1,
    sellerEmail: "seller01@demo.rovexo.co.uk",
    sellerVerified: true,
    sellerAccountStatus: "active",
    moderationStatus: "approved",
    ...partial,
  };
}

function product(partial: Partial<Product> & Pick<Product, "id" | "slug" | "title" | "price">): Product {
  return {
    condition: "Excellent",
    sellerName: "Seller",
    rating: 4.8,
    reviewCount: 12,
    imageUrl: "/icons/categories/phones.svg",
    imageCount: 1,
    sections: ["popular"],
    sellerEmail: "seller01@demo.rovexo.co.uk",
    sellerVerified: true,
    sellerAccountStatus: "active",
    moderationStatus: "approved",
    categoryId: "cat-1",
    description: "Premium item in excellent condition with tracked UK delivery and buyer protection.",
    ...partial,
  };
}

const envBackup = {
  closedBeta: process.env.ROVEXO_HOMEPAGE_CLOSED_BETA,
  approvedTesters: process.env.ROVEXO_APPROVED_TESTER_EMAILS,
};

afterEach(() => {
  process.env.ROVEXO_HOMEPAGE_CLOSED_BETA = envBackup.closedBeta;
  process.env.ROVEXO_APPROVED_TESTER_EMAILS = envBackup.approvedTesters;
});

describe("HomepageEligibility engine", () => {
  it("recognises certified demo seed slugs", () => {
    expect(APPROVED_DEMO_SLUG_PATTERN.test("demo-seller01-001")).toBe(true);
    expect(APPROVED_DEMO_SLUG_PATTERN.test("demo-test-001")).toBe(false);
  });

  it("excludes non-published statuses", () => {
    expect(HomepageEligibility.evaluate(input({ slug: "a", title: "Valid Title Here", status: "draft" })).reason).toBe(
      "DRAFT",
    );
    expect(
      HomepageEligibility.evaluate(input({ slug: "b", title: "Valid Title Here", status: "archived" })).reason,
    ).toBe("ARCHIVED");
    expect(
      HomepageEligibility.evaluate(input({ slug: "c", title: "Valid Title Here", status: "deleted" })).reason,
    ).toBe("DELETED");
    expect(
      HomepageEligibility.evaluate(input({ slug: "d", title: "Valid Title Here", status: "paused" })).reason,
    ).toBe("SUSPENDED");
    expect(
      HomepageEligibility.evaluate(input({ slug: "e", title: "Valid Title Here", status: "pending" })).reason,
    ).toBe("NOT_PUBLISHED");
  });

  it("excludes invalid content and seller signals", () => {
    expect(
      HomepageEligibility.evaluate(input({ slug: "f", title: "No", description: "Valid description here." })).reason,
    ).toBe("INVALID_TITLE");
    expect(
      HomepageEligibility.isEligible(
        input({ slug: "g", title: "Valid Title Here", description: "1234567890" }),
      ),
    ).toBe(true);
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "g2", title: "Valid Title Here", description: "short" }),
      ).reason,
    ).toBe("INVALID_DESCRIPTION");
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "h", title: "Valid Title Here", categoryId: null }),
      ).reason,
    ).toBe("INVALID_CATEGORY");
    expect(
      HomepageEligibility.evaluate(input({ slug: "i", title: "Valid Title Here", price: 0 })).reason,
    ).toBe("INVALID_PRICE");
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "j", title: "Valid Title Here", imageUrl: null, imageCount: 0 }),
      ).reason,
    ).toBe("NO_IMAGES");
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "k", title: "Valid Title Here", imageUrl: "https://picsum.photos/200" }),
      ).reason,
    ).toBe("PLACEHOLDER_IMAGE");
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "l", title: "Valid Title Here", sellerVerified: false }),
      ).reason,
    ).toBe("SELLER_EMAIL_UNVERIFIED");
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "m", title: "Valid Title Here", sellerAccountStatus: "banned" }),
      ).reason,
    ).toBe("SELLER_BANNED");
    expect(
      HomepageEligibility.evaluate(
        input({ slug: "n", title: "Valid Title Here", moderationStatus: "pending" }),
      ).reason,
    ).toBe("MARKETPLACE_NOT_APPROVED");
    expect(
      HomepageEligibility.isEligible(
        input({ slug: "warning-listing", title: "Valid Title Here", moderationStatus: "warning" }),
      ),
    ).toBe(true);
  });

  it("allows certified demo listings in closed beta mode only", () => {
    process.env.ROVEXO_HOMEPAGE_CLOSED_BETA = "1";

    expect(
      HomepageEligibility.isEligible(
        input({
          slug: "demo-seller01-001",
          title: "Electronics — Item 1",
          sellerEmail: "seller01@demo.rovexo.co.uk",
        }),
      ),
    ).toBe(true);

    expect(
      HomepageEligibility.isEligible(
        input({
          slug: "random-production-item",
          title: "Random production item",
          sellerEmail: "real@example.com",
        }),
      ),
    ).toBe(false);

    expect(
      HomepageEligibility.evaluate(
        input({
          slug: "random-production-item",
          title: "Random production item",
          sellerEmail: "real@example.com",
        }),
      ).reason,
    ).toBe("NOT_APPROVED_FOR_CLOSED_BETA");
  });

  it("allows approved tester listings in closed beta mode", () => {
    process.env.ROVEXO_HOMEPAGE_CLOSED_BETA = "1";
    process.env.ROVEXO_APPROVED_TESTER_EMAILS = "tester@rovexo.co.uk";

    expect(
      HomepageEligibility.isEligible(
        input({
          slug: "tester-listing-001",
          title: "Tester listing item",
          sellerEmail: "tester@rovexo.co.uk",
        }),
      ),
    ).toBe(true);
  });

  it("excludes demo seed listings in production mode", () => {
    delete process.env.ROVEXO_HOMEPAGE_CLOSED_BETA;

    expect(
      HomepageEligibility.evaluate(
        input({
          slug: "demo-seller02-014",
          title: "Electronics — Item 14",
          sellerEmail: "seller02@demo.rovexo.co.uk",
        }),
      ).reason,
    ).toBe("DEMO_NOT_ALLOWED");
  });

  it("filters homepage products through the canonical engine", () => {
    process.env.ROVEXO_HOMEPAGE_CLOSED_BETA = "1";

    const filtered = filterHomepageProducts([
      product({ id: "1", slug: "demo-seller01-001", title: "Electronics — Item 1", price: 29.99 }),
      product({ id: "2", slug: "test-listing", title: "Test listing item", price: 10 }),
      product({ id: "3", slug: "random-item", title: "Random production item", price: 99, sellerEmail: "real@example.com" }),
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("demo-seller01-001");
  });

  it("excludes lorem ipsum descriptions", () => {
    expect(
      HomepageEligibility.evaluate(
        input({
          slug: "demo-seller01-002",
          title: "Valid Title Here",
          description: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
        }),
      ).reason,
    ).toBe("INVALID_DESCRIPTION");
  });
});
