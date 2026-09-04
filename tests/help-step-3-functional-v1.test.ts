import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HELP_ARTICLES, getHelpArticle, getHelpArticleForAudience } from "@/lib/help/content/articles";
import { RELATED_BY_SLUG } from "@/lib/help/content/article-meta";
import { listHelpCategoryHubs } from "@/lib/help/content/category-hubs-v1";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import {
  ABOUT_PAGE_HREFS,
  FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS,
  HELP_CURRENT_CATEGORY_HREFS,
  HELP_HOME_DESTINATION_HREFS,
} from "@/lib/help/help-link-integrity-v1";
import { helpTopicGuideHref } from "@/lib/help/help-article-nav-v1";
import {
  HELP_AUDIENCES_FOR_BUSINESS,
  HELP_AUDIENCES_FOR_GUEST,
  HELP_AUDIENCES_FOR_INDIVIDUAL,
  isLegacyHelpTopicSlug,
} from "@/lib/help/help-content-audience-v1";
import { listHelpFaqs } from "@/lib/help/faq";
import { renderMarkdown, safeHelpMarkdownHref } from "@/lib/help/markdown";
import { searchHelpCentre } from "@/lib/help/search";
import { FAQ_LIBRARY_V1 } from "@/lib/seo/faq-library-v1";
import { getLegalDocument } from "@/lib/legal/canonical-documents";
import { SUPPORT_CATEGORIES } from "@/lib/support/types";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Help Step 3 — functional implementation", () => {
  it("keeps current Help categories only", () => {
    expect(HELP_CENTRE_CATEGORY_BUTTONS.map((button) => button.href)).toEqual([...HELP_CURRENT_CATEGORY_HREFS]);
    const home = read("features/help/components/HelpCentrePage.tsx");
    for (const href of FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS) {
      expect(home).not.toContain(href);
    }
  });

  it("exposes Privacy Policy and Privacy Settings as distinct Help destinations", () => {
    const home = read("features/help/components/HelpCentrePage.tsx");
    expect(home).toContain('title="Privacy Policy"');
    expect(home).toContain('href="/legal/privacy-policy"');
    expect(home).toContain('title="Privacy Settings"');
    expect(home).toContain('href="/account/privacy"');
    expect(home).toContain('href="/about"');
    expect(home).toContain('href="/support"');
    for (const href of HELP_HOME_DESTINATION_HREFS) {
      expect(home).toContain(href.split("?")[0] ?? href);
    }
  });

  it("shows Business storefront only when business audience is allowed", () => {
    const home = read("features/help/components/HelpCentrePage.tsx");
    expect(home).toContain("canAccessHelpContent(\"business\"");
    expect(home).toContain("/help/business-storefront-tips");
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_GUEST)).toBeUndefined();
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_INDIVIDUAL)).toBeUndefined();
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_BUSINESS)?.slug).toBe(
      "business-storefront-tips",
    );
  });

  it("corrects stale Help claims from implementation truth", () => {
    const checkout = getHelpArticle("payments-checkout");
    expect(checkout?.content).not.toMatch(/platform commission/i);
    expect(checkout?.content).toMatch(/Seller Fee is £0/);
    const shipping = getHelpArticle("delivery-shipping");
    expect(shipping?.content).not.toMatch(/standard or express/i);
    expect(shipping?.content).toMatch(/shipping quotes/);
    const dashboard = getHelpArticle("pro-seller-dashboard");
    expect(dashboard?.content).not.toMatch(/Active featured listings and bumps/);
    expect(dashboard?.content).toMatch(/not a live v1\.0 product/);
    const faqs = FAQ_LIBRARY_V1.map((entry) => entry.answer).join(" ");
    expect(faqs).not.toMatch(/One Personal Account can buy and sell/);
    expect(faqs).toMatch(/One ROVEXO account can buy and sell/);
  });

  it("does not invent processing-time UI on article pages", () => {
    const articlePage = read("features/help/components/HelpArticlePage.tsx");
    expect(articlePage).not.toContain("Estimated processing time");
    expect(articlePage).not.toContain("getArticleSections");
    expect(articlePage).toContain("aria-label=\"Breadcrumb\"");
    expect(articlePage).toContain("Contact Support");
    expect(articlePage).toContain("HelpResolutionPrompt");
  });

  it("does not link guided help to legacy topics", () => {
    expect(helpTopicGuideHref("promoted-listings")).toBeNull();
    expect(helpTopicGuideHref("property")).toBeNull();
    expect(helpTopicGuideHref("seller")).toBe("/help/category/seller");
    expect(RELATED_BY_SLUG["safety-scam-red-flags"]).not.toContain("safety-marketplace");
  });

  it("search still respects audience and excludes legacy categories", () => {
    expect(searchHelpCentre("storefront").some((hit) => hit.id === "business-storefront-tips")).toBe(false);
    expect(
      searchHelpCentre("property rent", 20).some((hit) => hit.href === "/help/category/property"),
    ).toBe(false);
    expect(searchHelpCentre("Seller Fee £0", 20).some((hit) => hit.href.includes("/help/category/seller"))).toBe(
      true,
    );
  });

  it("FAQ library links resolve to live articles or current hubs", () => {
    for (const entry of FAQ_LIBRARY_V1) {
      const href = entry.helpHref;
      if (!href) continue;
      if (href.startsWith("/help/category/")) {
        expect(isLegacyHelpTopicSlug(href.replace("/help/category/", ""))).toBe(false);
        continue;
      }
      if (href.startsWith("/help/")) {
        const slug = href.replace("/help/", "");
        expect(getHelpArticle(slug), href).toBeTruthy();
      }
    }
    expect(listHelpFaqs(8).length).toBeGreaterThan(0);
  });

  it("related article slugs resolve to existing articles", () => {
    for (const [from, slugs] of Object.entries(RELATED_BY_SLUG)) {
      expect(getHelpArticle(from), from).toBeTruthy();
      for (const slug of slugs) {
        expect(getHelpArticle(slug), `${from} → ${slug}`).toBeTruthy();
      }
    }
  });

  it("FAQ JSON-LD remains a valid FAQPage", async () => {
    const { faqJsonLd } = await import("@/lib/seo/metadata");
    const ld = faqJsonLd(
      FAQ_LIBRARY_V1.slice(0, 4).map((entry) => ({ question: entry.question, answer: entry.answer })),
    ) as { "@type": string; mainEntity: unknown[] };
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity.length).toBe(4);
    expect(read("app/(platform)/help/faq/page.tsx")).toContain("faqJsonLd");
    expect(read("features/help/components/HelpFaqPage.tsx")).toContain('aria-label="Search FAQs"');
  });

  it("hub related Help/Legal hrefs stay on current surfaces", () => {
    for (const hub of listHelpCategoryHubs()) {
      for (const link of [...hub.relatedHelp, ...hub.relatedLegal, ...hub.relatedFeatures]) {
        expect(link.href.startsWith("/")).toBe(true);
        expect(FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS.includes(link.href as (typeof FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS)[number])).toBe(
          false,
        );
      }
    }
  });

  it("About page uses existing destinations only", () => {
    const about = read("features/about/AboutPage.tsx");
    for (const href of ABOUT_PAGE_HREFS) {
      expect(about).toContain(`href="${href}"`);
    }
    expect(about).not.toContain("%");
    expect(about).not.toContain("million");
    expect(about).not.toContain("/help-v2");
  });

  it("Legal remains in-code and Privacy surfaces stay separate", () => {
    expect(getLegalDocument("privacy-policy")?.slug).toBe("privacy-policy");
    expect(read("lib/legal/canonical-documents.ts")).not.toMatch(/from\([\"']legal_documents[\"']\)/);
    expect(existsSync(join(root, "lib/privacy/privacy-engine-v1.ts"))).toBe(true);
    expect(existsSync(join(root, "app/api/account/privacy/route.ts"))).toBe(true);
    expect(read("features/legal/components/LegalIndexCanonical.tsx")).toContain("Privacy Settings");
    expect(read("features/legal/components/LegalIndexCanonical.tsx")).toContain("/account/privacy");
  });

  it("Support categories and context stamping remain canonical", () => {
    expect(SUPPORT_CATEGORIES.some((category) => category.id === "report_user")).toBe(true);
    expect(read("app/api/support/route.ts")).toContain("loadActiveSellerContext");
    expect(read("app/api/support/route.ts")).toContain("bindSupportHelpContextToSellerContext");
    expect(read("lib/support/service.ts")).not.toContain("createContentReport");
    expect(read("features/help/hooks/use-refresh-help-on-seller-context-change.ts")).toContain(
      "SELLER_CONTEXT_CHANGED_EVENT",
    );
    expect(read("features/help/hooks/use-refresh-help-on-seller-context-change.ts")).toContain("router.refresh");
    expect(read("features/help/hooks/use-refresh-help-on-seller-context-change.ts")).not.toContain("localStorage");
  });

  it("rejects unsafe markdown hrefs", () => {
    expect(safeHelpMarkdownHref("javascript:alert(1)")).toBeNull();
    expect(safeHelpMarkdownHref("//evil.example")).toBeNull();
    expect(safeHelpMarkdownHref("data:text/html,x")).toBeNull();
    expect(safeHelpMarkdownHref("/help")).toBe("/help");
    expect(safeHelpMarkdownHref("https://www.rovexo.co.uk/legal/privacy-policy")).toContain("https://");
    const html = renderMarkdown("See [x](javascript:alert(1)) and [Help](/help).");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="/help"');
    expect(html).not.toContain("<script>");
  });

  it("denied Help article metadata omits canonical and article copy", () => {
    const articleRoute = read("app/(platform)/help/[slug]/page.tsx");
    expect(articleRoute).toContain("omitCanonical: true");
    expect(articleRoute).toContain("noIndex: true");
    expect(articleRoute).toContain("getHelpArticleForAudience");
    const categoryRoute = read("app/(platform)/help/category/[slug]/page.tsx");
    expect(categoryRoute).toContain("omitCanonical: true");
  });

  it("does not create CMS or parallel engines", () => {
    expect(existsSync(join(root, "app/(platform)/help-v2"))).toBe(false);
    expect(read("lib/help/search.ts")).toContain("export function searchHelpCentre");
    expect(HELP_ARTICLES.length).toBeGreaterThan(20);
  });
});
