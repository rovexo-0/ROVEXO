import { describe, expect, it } from "vitest";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { HELP_ARTICLES, getAllHelpArticles } from "@/lib/help/content/articles";
import { WAVE_A_HELP_ARTICLES } from "@/lib/help/content/wave-a-articles-v1";
import { listHelpFaqs } from "@/lib/help/faq";
import { getCategoryHubEditorial } from "@/lib/seo/category-hub-editorial-v1";
import { FAQ_LIBRARY_V1, getFaqByCategorySlug, getFaqByCluster } from "@/lib/seo/faq-library-v1";
import {
  SEO_LINK_CAPS,
  categoryHubInternalLinkGroups,
  helpArticleLinkGroups,
  homepageSeoLinkGroups,
  popularBrowseLinks,
} from "@/lib/seo/internal-links";
import { MIN_INVENTORY_TO_INDEX, MIN_INVENTORY_LONG_TAIL } from "@/lib/seo/engine/config";
import {
  WAVE_A_COLLECTION_SLUGS,
  getWaveACollectionDefinitions,
} from "@/lib/seo/wave-a-collections-v1";
import { buildPageMetadata, faqJsonLd } from "@/lib/seo/metadata";

const WAVE_A_CLUSTERS = [
  "buying",
  "selling",
  "payments",
  "wallet",
  "shipping",
  "verification",
  "business",
  "safety",
  "community",
  "account",
  "returns",
  "trust",
  "uk",
] as const;

function articleRepresentsCluster(slug: string, category: string, topic?: string): string[] {
  const hits: string[] = [];
  const hay = `${slug} ${category} ${topic ?? ""}`.toLowerCase();
  if (category === "buying" || hay.includes("buyer") || hay.includes("buying")) hits.push("buying");
  if (category === "selling" || hay.includes("seller") || hay.includes("selling")) hits.push("selling");
  if (category === "payments" || hay.includes("payment")) hits.push("payments");
  if (hay.includes("wallet") || topic === "wallet" || topic === "withdraw") hits.push("wallet");
  if (category === "delivery" || topic === "shipping" || hay.includes("shipping")) hits.push("shipping");
  if (topic === "verification" || hay.includes("verification")) hits.push("verification");
  if (category === "business-accounts" || topic === "business-accounts" || hay.includes("business") || hay.includes("vat"))
    hits.push("business");
  if (category === "safety" || topic === "safety" || hay.includes("safety") || hay.includes("scam")) hits.push("safety");
  if (
    category === "community-guidelines" ||
    category === "reports-appeals" ||
    hay.includes("community") ||
    hay.includes("review")
  )
    hits.push("community");
  if (category === "account" || topic === "account" || hay.includes("account")) hits.push("account");
  if (topic === "returns" || hay.includes("return") || hay.includes("refund")) hits.push("returns");
  if (topic === "trust-score" || hay.includes("trust") || hay.includes("rating")) hits.push("trust");
  if (hay.includes("uk-") || hay.includes("uk ") || hay.startsWith("uk")) hits.push("uk");
  return hits;
}

describe("P12 Wave A organic SEO", () => {
  it("keeps inventory index thresholds (never weakened)", () => {
    expect(MIN_INVENTORY_TO_INDEX).toBe(3);
    expect(MIN_INVENTORY_LONG_TAIL).toBe(5);
  });

  it("has ≥60 Help articles with unique slugs and all Wave A clusters", () => {
    expect(HELP_ARTICLES.length).toBeGreaterThanOrEqual(60);
    expect(WAVE_A_HELP_ARTICLES.length).toBeGreaterThanOrEqual(40);
    const slugs = HELP_ARTICLES.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const represented = new Set<string>();
    for (const article of HELP_ARTICLES) {
      for (const cluster of articleRepresentsCluster(article.slug, article.category, article.topic)) {
        represented.add(cluster);
      }
    }
    for (const cluster of WAVE_A_CLUSTERS) {
      expect(represented.has(cluster), `missing cluster ${cluster}`).toBe(true);
    }
  });

  it("exposes a single FAQ library reused by Help FAQ list", () => {
    expect(FAQ_LIBRARY_V1.length).toBeGreaterThanOrEqual(20);
    expect(getFaqByCluster("buyer").length).toBeGreaterThan(0);
    expect(getFaqByCluster("seller").length).toBeGreaterThan(0);
    expect(getFaqByCluster("wallet").length).toBeGreaterThan(0);
    expect(getFaqByCluster("shipping").length).toBeGreaterThan(0);
    expect(getFaqByCluster("business").length).toBeGreaterThan(0);

    const faqs = listHelpFaqs(50);
    expect(faqs.some((entry) => entry.source === "library")).toBe(true);
    const questions = faqs.map((entry) => entry.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("provides category hub editorial + FAQs for all Catalog Master roots", () => {
    for (const root of CANONICAL_ROOT_CATEGORIES) {
      const editorial = getCategoryHubEditorial([root.slug]);
      expect(editorial, root.slug).not.toBeNull();
      expect(editorial!.intro.length).toBeGreaterThan(40);
      expect(editorial!.faqItems.length).toBeGreaterThanOrEqual(3);
      expect(editorial!.faqItems.length).toBeLessThanOrEqual(6);
      expect(getFaqByCategorySlug(root.slug, 6).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("aligns popular browse links to Catalog Master (no whole vehicles)", () => {
    const links = popularBrowseLinks(10).links;
    expect(links).toHaveLength(10);
    expect(links.every((link) => link.href.startsWith("/category/"))).toBe(true);
    expect(links.some((link) => /\/browse\/cars|\/category\/cars|\/vehicles\b/i.test(link.href))).toBe(
      false,
    );
    expect(links.map((link) => link.href)).toEqual(
      CANONICAL_ROOT_CATEGORIES.map((root) => `/category/${root.slug}`),
    );
  });

  it("respects SEO link caps on hub / homepage / help graphs", () => {
    const hubCount = categoryHubInternalLinkGroups(["electronics"]).reduce(
      (sum, group) => sum + group.links.length,
      0,
    );
    expect(hubCount).toBeLessThanOrEqual(SEO_LINK_CAPS.categoryHub);

    const homeCount = homepageSeoLinkGroups().reduce((sum, group) => sum + group.links.length, 0);
    expect(homeCount).toBeLessThanOrEqual(SEO_LINK_CAPS.homepage);

    const helpCount = helpArticleLinkGroups(["buying-how-to-buy", "wallet-overview"]).reduce(
      (sum, group) => sum + group.links.length,
      0,
    );
    expect(helpCount).toBeLessThanOrEqual(SEO_LINK_CAPS.helpArticle);
  });

  it("allowlists Wave A collections that exist in the canonical engine", () => {
    const defs = getWaveACollectionDefinitions();
    expect(defs).toHaveLength(WAVE_A_COLLECTION_SLUGS.length);
    expect(defs.every((def) => (WAVE_A_COLLECTION_SLUGS as readonly string[]).includes(def.slug))).toBe(
      true,
    );
  });

  it("builds Help metadata with canonical + openGraph + twitter", () => {
    const meta = buildPageMetadata({
      title: "Wallet and Balance overview | ROVEXO Help",
      description: "Where to see Available Balance, transactions and payouts.",
      path: "/help/wallet-overview",
    });
    expect(meta.alternates?.canonical).toBeTruthy();
    expect(meta.openGraph?.url).toBeTruthy();
    expect(meta.twitter).toBeTruthy();
    expect(getAllHelpArticles().find((article) => article.slug === "wallet-overview")).toBeTruthy();
  });

  it("emits FAQPage JSON-LD only with unique Q&As", () => {
    const items = getFaqByCluster("global", 5).map((entry) => ({
      question: entry.question,
      answer: entry.answer,
    }));
    const ld = faqJsonLd(items) as { "@type": string; mainEntity: unknown[] };
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity.length).toBe(items.length);
  });
});
