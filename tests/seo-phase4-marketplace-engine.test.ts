import { describe, expect, it } from "vitest";
import { flattenCategoryPaths } from "@/lib/categories/queries";
import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { categoryTree } from "@/lib/categories/tree";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import {
  classifyTaxonomyDepth,
  deriveBrandSeo,
  deriveCategorySeo,
  deriveListingSeo,
  deriveLocationSeo,
  deriveProgrammaticSeo,
  deriveStoreSeo,
  uniqueCanonicalUrls,
} from "@/lib/seo/marketplace-engine-v1";
import { canonicalForCategory, canonicalForListing, canonicalForStore } from "@/lib/seo/ssot";
import { isSitemapPathEligible } from "@/lib/seo/sitemaps/eligibility-filter";
import { findLocationBySlug } from "@/lib/seo/locations/uk";

const leaves = flattenCategoryPaths();
const productTypePath = leaves.find((path) => path.segments.length >= 3);
const rootSlug = CANONICAL_ROOT_CATEGORIES[0]!.slug;
const subcategorySlugs = productTypePath
  ? productTypePath.segments.slice(0, 2).map((segment) => segment.slug)
  : null;

function listingInput(overrides: Partial<Parameters<typeof deriveListingSeo>[0]> = {}) {
  return {
    slug: "nike-air-max",
    title: "Nike Air Max",
    description: "Genuine pair in excellent condition.",
    price: 90,
    condition: "new",
    images: ["https://cdn.example/nike.jpg"],
    brand: "Nike",
    categoryPath: [rootSlug],
    storeSlug: "acme-vintage",
    sellerUsername: "acme",
    productFound: true,
    productStatus: "published" as const,
    ...overrides,
  };
}

describe("SEO Phase 4 — Marketplace Engine", () => {
  it("derives category SEO from existing taxonomy", () => {
    const packet = deriveCategorySeo({ slugs: [rootSlug], listingCount: 12 });
    expect(packet.generated).toBe(true);
    expect(packet.kind).toBe("category");
    expect(packet.path).toBe(`/category/${rootSlug}`);
    expect(packet.canonicalUrl).toBe(canonicalForCategory([rootSlug]).canonicalUrl);
    expect(packet.metadata?.alternates?.canonical).toBe(packet.canonicalUrl);
    expect(packet.jsonLd.length).toBeGreaterThan(0);
    expect(packet.internalLinks.some((group) => group.links.some((link) => link.href.startsWith("/category/")))).toBe(
      true,
    );
    expect(packet.sitemapEligible).toBe(true);
    expect(isSitemapPathEligible(packet.path, { pageType: "category", listingCount: 12 })).toBe(true);
  });

  it("does not generate SEO for an unknown or empty category", () => {
    const packet = deriveCategorySeo({ slugs: ["not-a-rovexo-root"] });
    expect(packet.generated).toBe(false);
    expect(packet.canonicalUrl).toBeNull();
    expect(packet.sitemapEligible).toBe(false);
    expect(packet.jsonLd).toEqual([]);
    expect(deriveCategorySeo({ slugs: [rootSlug], listingCount: 0 }).generated).toBe(false);
    expect(deriveCategorySeo({ slugs: [rootSlug] }).generated).toBe(true);
  });

  it("derives subcategory SEO with a unique parent canonical", () => {
    expect(subcategorySlugs).toBeTruthy();
    expect(findNodeBySlugPath(categoryTree, subcategorySlugs!)).toBeTruthy();
    const slugs = subcategorySlugs!;
    const parent = slugs.slice(0, 1);
    const child = deriveCategorySeo({ slugs, listingCount: 12 });
    const root = deriveCategorySeo({ slugs: parent, listingCount: 12 });
    expect(classifyTaxonomyDepth(slugs)).toBe("subcategory");
    expect(child.generated).toBe(true);
    expect(child.kind).toBe("subcategory");
    expect(child.canonicalUrl).not.toBe(root.canonicalUrl);
    expect(child.path.startsWith(`${root.path}/`)).toBe(true);
  });

  it("treats taxonomy depth 3 as product type only when the node exists", () => {
    expect(productTypePath).toBeTruthy();
    const slugs = productTypePath!.segments.map((segment) => segment.slug);
    expect(classifyTaxonomyDepth(slugs)).toBe("product_type");
    const packet = deriveCategorySeo({ slugs, listingCount: 12 });
    expect(packet.generated).toBe(true);
    expect(packet.kind).toBe("product_type");
    expect(packet.path).toBe(`/category/${slugs.join("/")}`);
    expect(classifyTaxonomyDepth(["invented-product-type"])).toBeNull();
  });

  it("derives listing metadata and Product/Offer JSON-LD from listing data", () => {
    const packet = deriveListingSeo(listingInput());
    expect(packet.generated).toBe(true);
    expect(packet.canonicalUrl).toBe(canonicalForListing("nike-air-max").canonicalUrl);
    expect(packet.metadata?.title).toEqual({ absolute: "Nike Air Max · ROVEXO" });
    const graph = (packet.jsonLd[0] as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const product = graph.find((node) => node["@type"] === "Product");
    expect(product).toBeTruthy();
    expect((product?.offers as { "@type"?: string })?.["@type"]).toBe("Offer");
    expect(packet.internalLinks.some((group) => group.links.some((link) => link.href === `/category/${rootSlug}`))).toBe(
      true,
    );
    expect(packet.internalLinks.some((group) => group.links.some((link) => link.href === "/store/acme-vintage"))).toBe(
      true,
    );
    expect(JSON.stringify(packet)).not.toContain("sellerEmail");
    expect(JSON.stringify(packet)).not.toContain("sort-code");
  });

  it("does not generate listing SEO for missing, prohibited, or deleted listings", () => {
    expect(deriveListingSeo(listingInput({ productFound: false })).generated).toBe(false);
    expect(isForbiddenMarketplaceSlug("run4-cert-listing-demo")).toBe(true);
    expect(deriveListingSeo(listingInput({ slug: "run4-cert-listing-demo" })).generated).toBe(false);
    const deleted = deriveListingSeo(listingInput({ productStatus: "deleted" }));
    expect(deleted.generated).toBe(false);
    expect(deleted.jsonLd).toEqual([]);
    expect(deleted.sitemapEligible).toBe(false);
  });

  it("derives store SEO without private seller fields", () => {
    const packet = deriveStoreSeo({
      name: "Acme Vintage",
      slug: "acme-vintage",
      listingCount: 12,
      products: [{ title: "Coat", slug: "coat" }],
      categories: ["Women's Fashion"],
    });
    expect(packet.generated).toBe(true);
    expect(packet.canonicalUrl).toBe(canonicalForStore("acme-vintage").canonicalUrl);
    expect(packet.jsonLd.some((node) => (node as { "@type"?: string })["@type"] === "Store")).toBe(true);
    expect(JSON.stringify(packet.metadata)).not.toContain("@");
    expect(JSON.stringify(packet)).not.toContain("accountNumber");
    expect(deriveStoreSeo({ name: "Acme", slug: "acme", listingCount: 0 }).generated).toBe(false);
  });

  it("creates brand SEO only for a verified brand identity", () => {
    const valid = deriveBrandSeo({
      brand: { slug: "nike", name: "Nike" },
      listingCount: 12,
      categorySlugs: [rootSlug],
    });
    expect(valid.generated).toBe(true);
    expect(valid.path).toBe("/brand/nike");
    expect(deriveBrandSeo({ brand: null }).generated).toBe(false);
    expect(deriveBrandSeo({ brand: { slug: "", name: "Random Text" } }).generated).toBe(false);
  });

  it("creates location SEO only for public UK marketplace locations", () => {
    expect(findLocationBySlug("london")).toBeTruthy();
    const packet = deriveLocationSeo({ locationSlug: "london", listingCount: 12 });
    expect(packet.generated).toBe(true);
    expect(packet.path).toBe("/l/london");
    expect(JSON.stringify(packet)).not.toContain("SW1A 1AA");
    expect(JSON.stringify(packet)).not.toContain("line1");
    expect(deriveLocationSeo({ locationSlug: "12-downing-street" }).generated).toBe(false);
  });

  it("generates programmatic SEO only for valid existing combinations", () => {
    const valid = deriveProgrammaticSeo({ segments: ["fashion"], listingCount: 12 });
    expect(valid.generated).toBe(true);
    expect(valid.canonicalUrl).toBeTruthy();

    expect(deriveProgrammaticSeo({ segments: ["not-a-real-category-xyz"] }).generated).toBe(false);
    expect(deriveProgrammaticSeo({ segments: ["fashion"], listingCount: 0 }).generated).toBe(false);
    expect(deriveProgrammaticSeo({ segments: ["fashion", "nike"] }).generated).toBe(false);
    expect(
      deriveProgrammaticSeo({
        segments: ["fashion", "nike"],
        listingCount: 12,
        verifiedBrand: { slug: "nike", name: "Nike" },
      }).generated,
    ).toBe(true);
  });

  it("derives one programmatic page per input and does not invent inventory", () => {
    const omitted = deriveProgrammaticSeo({ segments: ["fashion"] });
    const counted = deriveProgrammaticSeo({ segments: ["fashion"], listingCount: 12 });
    expect(omitted.generated).toBe(true);
    expect(counted.generated).toBe(true);
    expect(omitted.canonicalUrl).toBe(counted.canonicalUrl);
    expect(omitted.reason).not.toBe("empty_inventory");
    expect(omitted.eligibility?.reasons.includes("inventory_gate_failed")).toBe(false);
    expect(deriveProgrammaticSeo({ segments: ["fashion", "nike"] }).generated).toBe(false);
  });

  it("keeps unique canonicals and Phase 1 sitemap exclusion", () => {
    const packets = [
      deriveCategorySeo({ slugs: [rootSlug], listingCount: 12 }),
      deriveListingSeo(listingInput()),
      deriveStoreSeo({ name: "Acme Vintage", slug: "acme-vintage", listingCount: 12 }),
      deriveListingSeo(listingInput({ productFound: false, slug: "missing" })),
    ];
    const urls = uniqueCanonicalUrls(packets);
    expect(urls).toHaveLength(new Set(urls).size);
    expect(urls.some((url) => url.includes("/listing/missing"))).toBe(false);
    expect(isSitemapPathEligible("/resolution")).toBe(false);
    expect(isSitemapPathEligible("/account")).toBe(false);
  });
});
