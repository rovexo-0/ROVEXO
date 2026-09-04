import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getHelpArticle, getHelpArticleForAudience, HELP_ARTICLES } from "@/lib/help/content/articles";
import {
  HELP_CATEGORY_HUB_SLUGS,
  getHelpCategoryHub,
  listHelpCategoryHubs,
} from "@/lib/help/content/category-hubs-v1";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { listHelpFaqs } from "@/lib/help/faq";
import {
  HELP_ARTICLE_CLASSIFICATION,
  HELP_HUB_CLASSIFICATION,
  LEGAL_DOCUMENT_CLASSIFICATION,
  listFullHelpLegalSupportInventory,
  listHelpArticleInventory,
} from "@/lib/help/help-content-inventory-v1";
import {
  bindSupportHelpContextToSellerContext,
  canAccessHelpContent,
  filterHelpContentByAudience,
  HELP_AUDIENCES_FOR_BUSINESS,
  HELP_AUDIENCES_FOR_GUEST,
  HELP_AUDIENCES_FOR_INDIVIDUAL,
  isHelpContentAudience,
  isLegacyHelpTopicSlug,
  LEGACY_HELP_TOPIC_SLUGS,
  resolveHelpContentAudience,
  resolveHelpContentAudiencesForSellerContext,
} from "@/lib/help/help-content-audience-v1";
import { listHelpPolicies } from "@/lib/help/policies";
import { searchHelpCentre } from "@/lib/help/search";
import { CANONICAL_LEGAL_DOCUMENTS, getLegalDocument, getLegalDocumentForAudience } from "@/lib/legal/canonical-documents";
import { buildStaticSitemapEntries } from "@/lib/seo/sitemaps/generators";
import { SUPPORT_CATEGORIES } from "@/lib/support/types";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Help content audience v1 — types and viewer rules", () => {
  it("A. validates audience union", () => {
    expect(isHelpContentAudience("shared")).toBe(true);
    expect(isHelpContentAudience("individual")).toBe(true);
    expect(isHelpContentAudience("business")).toBe(true);
    expect(isHelpContentAudience("guest")).toBe(false);
    expect(isHelpContentAudience("?business=1")).toBe(false);
    expect(resolveHelpContentAudience(undefined)).toBe("shared");
  });

  it("B. guest = shared only", () => {
    expect(resolveHelpContentAudiencesForSellerContext(null)).toEqual(["shared"]);
    expect(resolveHelpContentAudiencesForSellerContext(undefined)).toEqual(["shared"]);
    expect(canAccessHelpContent("shared", HELP_AUDIENCES_FOR_GUEST)).toBe(true);
    expect(canAccessHelpContent("individual", HELP_AUDIENCES_FOR_GUEST)).toBe(false);
    expect(canAccessHelpContent("business", HELP_AUDIENCES_FOR_GUEST)).toBe(false);
  });

  it("C. Individual = shared + individual", () => {
    expect(resolveHelpContentAudiencesForSellerContext("individual")).toEqual(["shared", "individual"]);
    expect(canAccessHelpContent("shared", HELP_AUDIENCES_FOR_INDIVIDUAL)).toBe(true);
    expect(canAccessHelpContent("individual", HELP_AUDIENCES_FOR_INDIVIDUAL)).toBe(true);
    expect(canAccessHelpContent("business", HELP_AUDIENCES_FOR_INDIVIDUAL)).toBe(false);
  });

  it("D. Business = shared + business", () => {
    expect(resolveHelpContentAudiencesForSellerContext("business")).toEqual(["shared", "business"]);
    expect(canAccessHelpContent("shared", HELP_AUDIENCES_FOR_BUSINESS)).toBe(true);
    expect(canAccessHelpContent("business", HELP_AUDIENCES_FOR_BUSINESS)).toBe(true);
    expect(canAccessHelpContent("individual", HELP_AUDIENCES_FOR_BUSINESS)).toBe(false);
  });

  it("filters mixed collections without inventing a second engine", () => {
    const items = [
      { slug: "a", audience: "shared" as const },
      { slug: "b", audience: "individual" as const },
      { slug: "c", audience: "business" as const },
    ];
    expect(filterHelpContentByAudience(items, HELP_AUDIENCES_FOR_GUEST).map((item) => item.slug)).toEqual(["a"]);
    expect(filterHelpContentByAudience(items, HELP_AUDIENCES_FOR_INDIVIDUAL).map((item) => item.slug)).toEqual([
      "a",
      "b",
    ]);
    expect(filterHelpContentByAudience(items, HELP_AUDIENCES_FOR_BUSINESS).map((item) => item.slug)).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("Help content audience v1 — search and routes", () => {
  it("E. search does not leak cross-context articles", () => {
    const guestHits = searchHelpCentre("storefront", 20);
    const individualHits = searchHelpCentre("storefront", 20, {
      allowedAudiences: HELP_AUDIENCES_FOR_INDIVIDUAL,
    });
    const businessHits = searchHelpCentre("storefront", 20, {
      allowedAudiences: HELP_AUDIENCES_FOR_BUSINESS,
    });

    expect(guestHits.some((hit) => hit.id === "business-storefront-tips")).toBe(false);
    expect(individualHits.some((hit) => hit.id === "business-storefront-tips")).toBe(false);
    expect(businessHits.some((hit) => hit.id === "business-storefront-tips")).toBe(true);

    expect(searchHelpCentre("Seller Fee £0", 20).some((hit) => hit.href.includes("/help/category/seller"))).toBe(
      true,
    );
  });

  it("E. search does not surface legacy verticals as current categories", () => {
    const propertyHits = searchHelpCentre("property rent real estate", 20);
    expect(propertyHits.some((hit) => hit.href === "/help/category/property")).toBe(false);
    expect(searchHelpCentre("wholesale rfq", 20).some((hit) => hit.href === "/help/category/wholesale")).toBe(
      false,
    );
    expect(searchHelpCentre("vin search", 20).some((hit) => hit.href === "/help/category/vin-search")).toBe(
      false,
    );
  });

  it("F. direct article lookup cannot bypass audience", () => {
    expect(getHelpArticle("business-storefront-tips")?.audience).toBe("business");
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_GUEST)).toBeUndefined();
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_INDIVIDUAL)).toBeUndefined();
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_BUSINESS)?.slug).toBe(
      "business-storefront-tips",
    );
    expect(getHelpArticleForAudience("selling-fees", HELP_AUDIENCES_FOR_GUEST)?.slug).toBe("selling-fees");
    expect(
      buildStaticSitemapEntries().some((entry) => entry.url.includes("/help/business-storefront-tips")),
    ).toBe(false);
  });

  it("K. existing Help routes remain the canonical set", () => {
    const articlePage = read("app/(platform)/help/[slug]/page.tsx");
    const categoryPage = read("app/(platform)/help/category/[slug]/page.tsx");
    expect(articlePage).toContain("getHelpArticleForAudience");
    expect(articlePage).toContain("resolveViewerHelpAudiences");
    expect(articlePage).not.toContain("/help-v2");
    expect(categoryPage).toContain("isLegacyHelpTopicSlug");
    expect(categoryPage).toContain("notFound()");
    expect(existsSync(join(root, "app/(platform)/help/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/(platform)/help/faq/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/(platform)/help/policies/page.tsx"))).toBe(true);
  });

  it("L. existing Legal routes remain functional and in-code", () => {
    expect(getLegalDocument("privacy-policy")?.title).toContain("Privacy");
    expect(getLegalDocumentForAudience("privacy-policy", HELP_AUDIENCES_FOR_GUEST)?.slug).toBe("privacy-policy");
    expect(existsSync(join(root, "app/(platform)/legal/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/(platform)/legal/[slug]/page.tsx"))).toBe(true);
    expect(read("app/(platform)/privacy/page.tsx")).toContain("/legal/privacy-policy");
    expect(read("app/(platform)/terms/page.tsx")).toContain("/legal/terms-and-conditions");
  });
});

describe("Help content audience v1 — Legal, Privacy, Support, FAQ", () => {
  it("G. legal remains in-code with optional audience only", () => {
    expect(CANONICAL_LEGAL_DOCUMENTS.length).toBeGreaterThanOrEqual(25);
    expect(CANONICAL_LEGAL_DOCUMENTS.every((document) => (document.audience ?? "shared") === "shared")).toBe(
      true,
    );
    const legalTypes = read("lib/legal/types.ts");
    expect(legalTypes).toContain("audience?");
    expect(read("lib/legal/canonical-documents.ts")).not.toMatch(/from\([\"']legal_documents[\"']\)/);
    expect(read("lib/help/help-content-audience-v1.ts")).not.toMatch(/from\([\"']help_articles[\"']\)/);
  });

  it("H. Settings Privacy remains separate from Privacy Policy", () => {
    expect(read("lib/privacy/privacy-engine-v1.ts").length).toBeGreaterThan(100);
    expect(existsSync(join(root, "app/api/account/privacy/route.ts"))).toBe(true);
    expect(read("lib/help/help-content-audience-v1.ts")).not.toContain("privacy-engine-v1");
    expect(read("lib/help/search.ts")).toContain('href: "/account/privacy"');
    expect(read("lib/help/search.ts")).toContain("/legal/");
    const inventory = listFullHelpLegalSupportInventory();
    expect(inventory.some((row) => row.route === "/legal/privacy-policy")).toBe(true);
    expect(inventory.some((row) => row.route === "/account/privacy" && row.kind === "privacy-surface")).toBe(
      true,
    );
  });

  it("I. support stamps canonical seller context and ignores client accountType", () => {
    const stamped = bindSupportHelpContextToSellerContext(
      { currentPage: "/support", accountType: "business", device: "iPhone" },
      "individual",
    );
    expect(stamped.accountType).toBe("individual");
    expect(stamped.currentPage).toBe("/support");
    expect(read("app/api/support/route.ts")).toContain("loadActiveSellerContext");
    expect(read("app/api/support/route.ts")).toContain("bindSupportHelpContextToSellerContext");
  });

  it("J. content_reports remains a separate engine from support_tickets", () => {
    expect(read("lib/moderation/service.ts")).toContain("export async function createContentReport");
    expect(read("lib/support/service.ts")).not.toContain("createContentReport");
    expect(read("lib/support/service.ts")).toContain("support_tickets");
    expect(read("lib/support/service.ts")).not.toContain("content_reports");
  });

  it("M. existing Support categories and ticket create path remain", () => {
    expect(SUPPORT_CATEGORIES.map((category) => category.id)).toEqual([
      "account",
      "buying",
      "selling",
      "payments",
      "delivery",
      "chat",
      "technical",
      "business",
      "pro_seller",
      "appeal_moderation",
      "report_user",
      "other",
    ]);
    expect(read("app/api/support/route.ts")).toContain("createSupportTicket");
    expect(read("features/help/components/HelpCentrePage.tsx")).toContain("/support?category=report_user");
    expect(read("features/help/components/HelpCentrePage.tsx")).not.toContain("/support?category=report\"");
  });

  it("N. FAQ library remains functional", () => {
    const faqs = listHelpFaqs(20, HELP_AUDIENCES_FOR_GUEST);
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs.every((faq) => faq.question.length > 0 && faq.answer.length > 0)).toBe(true);
  });
});

describe("Help content audience v1 — inventory, classification, legacy", () => {
  it("classifies every live Help article and hub", () => {
    for (const article of HELP_ARTICLES) {
      expect(HELP_ARTICLE_CLASSIFICATION[article.slug], article.slug).toBeTruthy();
    }
    for (const slug of HELP_CATEGORY_HUB_SLUGS) {
      expect(HELP_HUB_CLASSIFICATION[slug], slug).toBeTruthy();
      expect(getHelpCategoryHub(slug)?.audience ?? "shared").toBe("shared");
    }
    for (const document of CANONICAL_LEGAL_DOCUMENTS) {
      expect(LEGAL_DOCUMENT_CLASSIFICATION[document.slug], document.slug).toBeTruthy();
    }
    expect(listHelpCategoryHubs()).toHaveLength(8);
  });

  it("applies Business only where content is Business-specific", () => {
    const businessArticles = listHelpArticleInventory().filter((row) => row.proposedAudience === "business");
    expect(businessArticles.map((row) => row.slug)).toEqual(["business-storefront-tips"]);
    expect(HELP_ARTICLES.filter((article) => article.audience === "individual")).toHaveLength(0);
  });

  it("keeps legacy topics in-code but not as current surfaces", () => {
    for (const slug of LEGACY_HELP_TOPIC_SLUGS) {
      expect(HELP_TOPICS.some((topic) => topic.slug === slug)).toBe(true);
      expect(isLegacyHelpTopicSlug(slug)).toBe(true);
    }
    expect(isLegacyHelpTopicSlug("withdraw")).toBe(false);
    expect(isLegacyHelpTopicSlug("seller")).toBe(false);
  });

  it("G/H/O. does not create a CMS, second search, or privacy merge", () => {
    const audience = read("lib/help/help-content-audience-v1.ts");
    expect(audience).not.toContain("createClient");
    expect(existsSync(join(root, "lib/help/search.ts"))).toBe(true);
    expect(read("lib/help/search.ts")).toContain("export function searchHelpCentre");
    expect(listHelpPolicies().every((policy) => policy.href.startsWith("/legal/"))).toBe(true);
  });

  it("resolver uses loadActiveSellerContext only", () => {
    const server = read("lib/help/help-content-audience-server-v1.ts");
    expect(server).toContain("import \"server-only\"");
    expect(server).toContain("loadActiveSellerContext");
    expect(server).toContain("getAuthContext");
    expect(server).not.toContain("localStorage");
    expect(server).not.toContain("business=1");
  });
});
