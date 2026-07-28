import { describe, expect, it } from "vitest";
import {
  isForbiddenMarketplaceInventory,
  isForbiddenMarketplaceSlug,
} from "@/lib/listings/forbidden-marketplace-inventory";
import { HomepageEligibility } from "@/lib/homepage/homepage-eligibility";

describe("forbidden marketplace inventory — RUN4 / certification cleanup", () => {
  it("flags RUN4 certification titles and slugs", () => {
    expect(
      isForbiddenMarketplaceInventory({
        slug: "run4-cert-listing-abc-1710000000",
        title: "RUN4 Cert Listing 1710000000",
        description: "RUN #4 end-to-end marketplace certification listing. Virtual demo only.",
      }),
    ).toBe(true);

    expect(
      isForbiddenMarketplaceInventory({
        slug: "run4-offer-listing-xyz",
        title: "RUN4 Offer Listing 999",
      }),
    ).toBe(true);

    expect(
      isForbiddenMarketplaceInventory({
        slug: "run4-probe2-item",
        title: "RUN4 Probe2",
      }),
    ).toBe(true);

    expect(isForbiddenMarketplaceSlug("run4-cert-listing-abc")).toBe(true);
    expect(isForbiddenMarketplaceSlug("certification-listing-1")).toBe(true);
    expect(isForbiddenMarketplaceSlug("fixture-demo-1")).toBe(true);
    expect(isForbiddenMarketplaceSlug("seed-inventory-1")).toBe(true);
  });

  it("flags certification / virtual demo copy without RUN4 slug", () => {
    expect(
      isForbiddenMarketplaceInventory({
        slug: "random-uuid-looking-slug",
        title: "Certification Listing",
        description: "Virtual demo only.",
      }),
    ).toBe(true);

    expect(
      isForbiddenMarketplaceInventory({
        slug: "some-real-looking-slug",
        title: "RUN Test Item",
      }),
    ).toBe(true);
  });

  it("never flags real marketplace titles", () => {
    expect(
      isForbiddenMarketplaceInventory({
        slug: "nike-air-max-90-black",
        title: "Nike Air Max 90",
        description: "Gently used running shoes in great condition.",
      }),
    ).toBe(false);

    expect(
      isForbiddenMarketplaceInventory({
        slug: "vintage-leather-jacket",
        title: "Vintage Leather Jacket",
        description: "Certified pre-owned condition. Ready for test drive of style.",
      }),
    ).toBe(false);
  });

  it("blocks RUN4 inventory via HomepageEligibility", () => {
    delete process.env.ROVEXO_HOMEPAGE_CLOSED_BETA;

    const result = HomepageEligibility.evaluate({
      status: "published",
      slug: "run4-cert-listing-abc",
      title: "RUN4 Cert Listing 1",
      description: "RUN #4 end-to-end marketplace certification listing. Virtual demo only.",
      price: 24.99,
      categoryId: "cat-1",
      imageUrl: "/icons/categories/phones.svg",
      imageCount: 1,
      sellerVerified: true,
      sellerAccountStatus: "active",
      moderationStatus: "approved",
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("DEMO_NOT_ALLOWED");
  });
});
