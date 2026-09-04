import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PWA_BUSINESS_MENU_ITEMS } from "@/lib/business/pwa-business-menu-v1";
import {
  getHelpArticle,
  getHelpArticleForAudience,
  HELP_ARTICLES,
  listHelpArticlesForAudience,
} from "@/lib/help/content/articles";
import {
  isHelpCategoryHubSlug,
  listHelpCategoryHubs,
  listHelpCategoryHubsForAudience,
} from "@/lib/help/content/category-hubs-v1";
import { getHelpTopic } from "@/lib/help/content/topics";
import { getDecisionTree } from "@/lib/help/decision-trees/registry";
import { listHelpFaqs } from "@/lib/help/faq";
import { helpCategoryBreadcrumb, helpTopicGuideHref } from "@/lib/help/help-article-nav-v1";
import {
  ABOUT_PAGE_HREFS,
  FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS,
  HELP_CURRENT_CATEGORY_HREFS,
  HELP_HOME_DESTINATION_HREFS,
} from "@/lib/help/help-link-integrity-v1";
import {
  BUSINESS_ONLY_HELP_ARTICLE_SLUGS,
  HELP_AUDIENCES_FOR_BUSINESS,
  HELP_AUDIENCES_FOR_GUEST,
  HELP_AUDIENCES_FOR_INDIVIDUAL,
  isBusinessOnlyHelpArticleSlug,
  isLegacyHelpTopicSlug,
} from "@/lib/help/help-content-audience-v1";
import { RELATED_BY_SLUG } from "@/lib/help/content/article-meta";
import { renderMarkdown, safeHelpMarkdownHref } from "@/lib/help/markdown";
import { searchHelpCentre } from "@/lib/help/search";
import { getLegalDocument, getLegalDocumentForAudience, listLegalDocuments } from "@/lib/legal/canonical-documents";
import { PRODUCT_DELIVERY_LEGACY_HELP_SLUGS } from "@/lib/product-detail/delivery-details-route-v1";
import { FAQ_LIBRARY_V1 } from "@/lib/seo/faq-library-v1";
import { buildStaticSitemapEntries } from "@/lib/seo/sitemaps/generators";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(join(root, rel));
}

const HELP_TO_LEGAL: Record<string, string> = {
  "privacy-policy": "/legal/privacy-policy",
  "terms-of-service": "/legal/terms-and-conditions",
  "community-guidelines": "/legal/community-guidelines",
  "prohibited-items-list": "/legal/prohibited-restricted-items",
};

const STATIC_HREF_FILES: Record<string, readonly string[]> = {
  "/help": ["app/(platform)/help/page.tsx"],
  "/help/faq": ["app/(platform)/help/faq/page.tsx"],
  "/help/policies": ["app/(platform)/help/policies/page.tsx"],
  "/about": ["app/(platform)/about/page.tsx"],
  "/support": ["app/(platform)/support/page.tsx"],
  "/legal": ["app/(platform)/legal/page.tsx"],
  "/trust": ["app/(platform)/trust/page.tsx"],
  "/search": ["app/(platform)/search/page.tsx"],
  "/sell": ["app/(platform)/sell/page.tsx"],
  "/orders": ["app/(platform)/orders/page.tsx"],
  "/balance": ["app/(platform)/balance/page.tsx"],
  "/inbox": ["app/(platform)/inbox/(list)/page.tsx"],
  "/saved": ["app/(platform)/saved/page.tsx"],
  "/account": ["app/(platform)/account/page.tsx"],
  "/account/settings": ["app/(platform)/account/settings/page.tsx"],
  "/account/privacy": ["app/(platform)/account/privacy/page.tsx"],
  "/account/security": ["app/(platform)/account/security/page.tsx"],
  "/account/verification": ["app/(platform)/account/verification/page.tsx"],
  "/account/addresses": ["app/(platform)/account/addresses/page.tsx"],
  "/checkout": ["app/(platform)/checkout/page.tsx"],
  "/wallet/payment-methods": ["app/(platform)/wallet/payment-methods/page.tsx"],
  "/wallet/bank-accounts": ["app/(platform)/wallet/bank-accounts/page.tsx"],
  "/wallet/transactions": ["app/(platform)/wallet/transactions/page.tsx"],
  "/resolution": ["app/(platform)/resolution/page.tsx"],
};

function extractMarkdownHrefs(markdown: string): string[] {
  return [...markdown.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1] ?? "").filter(Boolean);
}

function assertLiveInternalHref(href: string, from: string): void {
  const path = (href.split("#")[0] ?? href).split("?")[0] ?? href;
  if (!path.startsWith("/") || path.startsWith("//")) {
    return;
  }

  if (STATIC_HREF_FILES[path]) {
    expect(STATIC_HREF_FILES[path].some((file) => exists(file)), `${from} → ${href}`).toBe(true);
    return;
  }

  if (path.startsWith("/legal/")) {
    const slug = path.replace("/legal/", "");
    expect(getLegalDocument(slug), `${from} → ${href}`).toBeTruthy();
    return;
  }

  if (path.startsWith("/help/category/")) {
    const slug = path.replace("/help/category/", "");
    expect(
      FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS.includes(path as (typeof FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS)[number]),
      `${from} → forbidden leftover ${href}`,
    ).toBe(false);
    if (isHelpCategoryHubSlug(slug)) {
      expect(listHelpCategoryHubs().some((hub) => hub.slug === slug), href).toBe(true);
      return;
    }
    expect(isLegacyHelpTopicSlug(slug), `${from} → legacy category ${href}`).toBe(false);
    expect(getHelpTopic(slug), `${from} → ${href}`).toBeTruthy();
    expect(getDecisionTree(slug), `${from} → ${href}`).toBeTruthy();
    return;
  }

  if (path.startsWith("/help/")) {
    const slug = path.replace("/help/", "");
    if (slug === "faq" || slug === "policies") {
      expect(exists(`app/(platform)/help/${slug}/page.tsx`), href).toBe(true);
      return;
    }
    if (HELP_TO_LEGAL[slug]) {
      expect(getLegalDocument(HELP_TO_LEGAL[slug].replace("/legal/", "")), href).toBeTruthy();
      return;
    }
    if ((PRODUCT_DELIVERY_LEGACY_HELP_SLUGS as readonly string[]).includes(slug)) {
      expect(getHelpArticle("delivery-shipping"), href).toBeTruthy();
      return;
    }
    expect(getHelpArticle(slug), `${from} → ${href}`).toBeTruthy();
    return;
  }

  throw new Error(`Unresolved internal href from ${from}: ${href}`);
}

describe("Help Step 4 — final cleanup + certification", () => {
  it("repository scan: one Help search, one Support ticket engine, one Legal SSOT", () => {
    expect(exists("app/(platform)/help-v2")).toBe(false);
    expect(exists("features/help/components/HelpAssistant.tsx")).toBe(false);
    expect(exists("lib/help/i18n.ts")).toBe(false);
    expect(exists("components/legal/LegalInformationSection.tsx")).toBe(false);
    expect(read("features/help/components/HelpRelatedContent.tsx")).toContain("isLegacyHelpTopicSlug");
    expect(read("lib/help/content/article-meta.ts")).not.toContain("getArticleSections");
    expect(read("lib/help/search.ts")).toContain("export function searchHelpCentre");
    expect(read("lib/help/search.ts")).toContain("return searchHelpCentre(query, limit, options)");
    expect(read("lib/help/search.ts")).not.toContain("searchHelpCentreV2");
    expect(read("lib/support/service.ts")).toContain("support_tickets");
    expect(read("lib/legal/canonical-documents.ts")).not.toMatch(/from\([\"']legal_documents[\"']\)/);
    expect(read("lib/help/content/articles.ts")).not.toMatch(/from\([\"']help_articles[\"']\)/);
    expect(PWA_BUSINESS_MENU_ITEMS.map((item) => item.title)).toEqual([
      "Orders",
      "Inventory",
      "Analytics",
      "Wallet",
      "VAT",
      "Store",
      "Promote",
    ]);
    expect(PWA_BUSINESS_MENU_ITEMS.some((item) => item.id === "settings")).toBe(false);
    expect(read("lib/business/pwa-business-menu-v1.ts")).not.toContain("/business/settings");
  });

  it("dead links: About, Help home, categories, FAQ, related, breadcrumbs", () => {
    for (const href of [...ABOUT_PAGE_HREFS, ...HELP_HOME_DESTINATION_HREFS, ...HELP_CURRENT_CATEGORY_HREFS]) {
      assertLiveInternalHref(href, "integrity-list");
    }

    for (const article of listHelpArticlesForAudience(HELP_AUDIENCES_FOR_GUEST)) {
      const crumb = helpCategoryBreadcrumb(article.category);
      assertLiveInternalHref(crumb.href, `breadcrumb:${article.slug}`);
      const guide = helpTopicGuideHref(article.topic);
      if (guide) {
        assertLiveInternalHref(guide, `guide:${article.slug}`);
      }
      for (const href of extractMarkdownHrefs(article.content)) {
        if (href.startsWith("/")) {
          assertLiveInternalHref(href, `markdown:${article.slug}`);
        }
      }
    }

    for (const hub of listHelpCategoryHubsForAudience(HELP_AUDIENCES_FOR_GUEST)) {
      for (const link of [...hub.relatedHelp, ...hub.relatedLegal, ...hub.relatedFeatures]) {
        assertLiveInternalHref(link.href, `hub:${hub.slug}`);
      }
    }

    for (const entry of FAQ_LIBRARY_V1) {
      if (entry.helpHref) {
        assertLiveInternalHref(entry.helpHref, `faq-library:${entry.id}`);
      }
    }

    for (const faq of listHelpFaqs(400, HELP_AUDIENCES_FOR_GUEST)) {
      assertLiveInternalHref(faq.href, `faq:${faq.id}`);
    }

    for (const [from, slugs] of Object.entries(RELATED_BY_SLUG)) {
      expect(getHelpArticle(from), from).toBeTruthy();
      for (const slug of slugs) {
        expect(getHelpArticle(slug), `${from} → ${slug}`).toBeTruthy();
      }
    }
  });

  it("content isolation: guest/individual cannot see or search Business-only content", () => {
    expect([...BUSINESS_ONLY_HELP_ARTICLE_SLUGS]).toEqual(["business-storefront-tips"]);
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_GUEST)).toBeUndefined();
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_INDIVIDUAL)).toBeUndefined();
    expect(getHelpArticleForAudience("business-storefront-tips", HELP_AUDIENCES_FOR_BUSINESS)?.slug).toBe(
      "business-storefront-tips",
    );

    for (const article of listHelpArticlesForAudience(HELP_AUDIENCES_FOR_GUEST)) {
      expect(article.content).not.toContain("/help/business-storefront-tips");
      expect(isBusinessOnlyHelpArticleSlug(article.slug)).toBe(false);
    }
    for (const article of listHelpArticlesForAudience(HELP_AUDIENCES_FOR_INDIVIDUAL)) {
      expect(article.content).not.toContain("/help/business-storefront-tips");
      expect(isBusinessOnlyHelpArticleSlug(article.slug)).toBe(false);
    }

    expect(searchHelpCentre("storefront").some((hit) => hit.id === "business-storefront-tips")).toBe(false);
    expect(
      searchHelpCentre("storefront", 16, { allowedAudiences: HELP_AUDIENCES_FOR_INDIVIDUAL }).some(
        (hit) => hit.id === "business-storefront-tips",
      ),
    ).toBe(false);
    expect(
      searchHelpCentre("storefront", 16, { allowedAudiences: HELP_AUDIENCES_FOR_BUSINESS }).some(
        (hit) => hit.id === "business-storefront-tips",
      ),
    ).toBe(true);

    const sitemap = buildStaticSitemapEntries()
      .map((entry) => entry.url)
      .join("\n");
    expect(sitemap).not.toContain("business-storefront-tips");

    const articleRoute = read("app/(platform)/help/[slug]/page.tsx");
    expect(articleRoute).toContain("omitCanonical: true");
    expect(articleRoute).toContain("noIndex: true");
    expect(articleRoute).toContain("resolveViewerHelpAudiences");
    expect(articleRoute).toContain("relatedArticleSlugs");
    expect(articleRoute).toContain("export const dynamic = \"force-dynamic\"");
    expect(read("features/help/hooks/use-refresh-help-on-seller-context-change.ts")).toContain("router.refresh");
    expect(read("features/help/hooks/use-refresh-help-on-seller-context-change.ts")).not.toContain("localStorage");
    expect(read("lib/help/help-content-audience-server-v1.ts")).toContain("loadActiveSellerContext");
    expect(read("lib/help/help-content-audience-server-v1.ts")).not.toContain("searchParams");
  });

  it("security: markdown, admin, unpublished CMS, Support context stamp", () => {
    expect(safeHelpMarkdownHref("javascript:alert(1)")).toBeNull();
    expect(safeHelpMarkdownHref("vbscript:x")).toBeNull();
    expect(safeHelpMarkdownHref("//evil.example")).toBeNull();
    expect(safeHelpMarkdownHref("data:text/html,x")).toBeNull();
    expect(safeHelpMarkdownHref("file:///etc/passwd")).toBeNull();
    const html = renderMarkdown('<script>alert(1)</script> [x](javascript:alert(1)) [ok](/help)');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="/help"');

    expect(read("features/help/components/HelpArticlePage.tsx")).toContain("renderMarkdown(article.content)");
    expect(read("app/api/admin/help/route.ts")).toContain("requireApiAdmin");
    expect(read("app/api/help/assistant/route.ts")).toContain("410");
    expect(read("lib/help/content/articles.ts")).not.toMatch(/unpublished|draft/i);
    expect(read("app/api/support/route.ts")).toContain("bindSupportHelpContextToSellerContext");
    expect(read("app/api/support/route.ts")).toContain("loadActiveSellerContext");
  });

  it("public surfaces stay on the approved IA without invented Business features", () => {
    const home = read("features/help/components/HelpCentrePage.tsx");
    expect(home).toContain('title="Privacy Policy"');
    expect(home).toContain('href="/legal/privacy-policy"');
    expect(home).toContain('title="Privacy Settings"');
    expect(home).toContain('href="/account/privacy"');
    expect(home).toContain('href="/about"');
    expect(home).toContain('href="/support"');
    expect(home).toContain('href="/legal"');
    expect(home).toContain("canAccessHelpContent(\"business\"");
    expect(HELP_ARTICLES.filter((article) => article.audience === "business").map((article) => article.slug)).toEqual([
      "business-storefront-tips",
    ]);
    expect(listLegalDocuments().every((document) => (document.audience ?? "shared") === "shared")).toBe(true);
    expect(getLegalDocumentForAudience("privacy-policy", HELP_AUDIENCES_FOR_GUEST)?.slug).toBe("privacy-policy");
    expect(read("features/about/AboutPage.tsx")).toContain("/help/category/safety");
    expect(read("features/about/AboutPage.tsx")).not.toContain("Business Settings");
  });

  it("accessibility + responsive contracts remain on current Help surfaces", () => {
    expect(read("features/help/components/HelpCentrePage.tsx")).toContain('id="help-search"');
    expect(read("features/help/components/HelpCentrePage.tsx")).toContain('aria-label="Search help"');
    expect(read("features/help/components/HelpCentrePage.tsx")).toContain('inputType="search"');
    expect(read("features/help/components/HelpFaqPage.tsx")).toContain('aria-label="Search FAQs"');
    expect(read("features/help/components/HelpArticlePage.tsx")).toContain('aria-label="Breadcrumb"');
    expect(read("features/help/components/HelpArticlePage.tsx")).toContain("aria-current");
    expect(read("features/about/AboutPage.tsx")).toContain("AccountCanonicalShell");
    expect(read("features/help/components/HelpCentrePage.tsx")).toContain("fw-engine__stack");
    expect(read("features/help/components/HelpCentrePage.tsx")).not.toContain("overflow-x: hidden");
  });
});
