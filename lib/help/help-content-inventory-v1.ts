/**
 * ROVEXO Step 2 — content inventory + classification (in-code only).
 * Titles/routes are derived from live Help/Legal constants. Do not invent items.
 */

import { HELP_ARTICLES } from "@/lib/help/content/articles";
import { HELP_CATEGORY_HUB_SLUGS, listHelpCategoryHubs } from "@/lib/help/content/category-hubs-v1";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import {
  isLegacyHelpTopicSlug,
  type HelpContentAudience,
} from "@/lib/help/help-content-audience-v1";
import { CANONICAL_LEGAL_DOCUMENTS } from "@/lib/legal/canonical-documents";
import { LEGAL_CENTRE_INDEX } from "@/lib/legal/legal-centre-consolidation-v1";
import { SUPPORT_CATEGORIES } from "@/lib/support/types";

export type InventoryRecommendation = "keep" | "rewrite" | "remove" | "alias";
export type InventoryStaleRisk = "none" | "flag" | "rewrite";

export type HelpContentInventoryRecord = {
  kind:
    | "help-article"
    | "help-hub"
    | "help-topic"
    | "help-category-button"
    | "legal-document"
    | "legal-index"
    | "legal-alias"
    | "about"
    | "safety"
    | "support-category"
    | "support-entry"
    | "privacy-surface"
    | "feature-shortcut";
  slug: string;
  title: string;
  route: string;
  sourceFile: string;
  symbol: string;
  currentAudience: HelpContentAudience;
  proposedAudience: HelpContentAudience;
  currentVisibility: "public" | "redirect" | "legacy-unmounted" | "settings-only" | "separate-engine";
  reachableFromUi: boolean;
  functionalSources: readonly string[];
  staleRisk: InventoryStaleRisk;
  recommendation: InventoryRecommendation;
  ownerLegalReview: boolean;
  notes?: string;
};

type Classification = {
  proposedAudience: HelpContentAudience;
  staleRisk: InventoryStaleRisk;
  recommendation: InventoryRecommendation;
  ownerLegalReview?: boolean;
  notes?: string;
};

/** Every live Help article slug must appear here. Default public = shared. */
export const HELP_ARTICLE_CLASSIFICATION: Record<string, Classification> = {
  "account-overview": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "reset-password": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "buying-how-to-buy": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "buying-buyer-protection": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    ownerLegalReview: true,
    notes: "Protection hours differ by seller_context (48h individual / 14d business). Copy must not invent hours.",
  },
  "selling-get-started": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "selling-photos": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "payments-checkout": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "payments-refunds": { proposedAudience: "shared", staleRisk: "flag", recommendation: "keep", ownerLegalReview: true },
  "delivery-shipping": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    notes: "Mentions standard/express where available. Live labels are Sendcloud quotes; Evri + Royal Mail v1 whitelist.",
  },
  "delivery-tracking": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    notes: "Completed / buyer-confirmed wording may lag Conversation Hub Everything OK flow.",
  },
  "chat-safety": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "pro-seller-dashboard": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    notes: "Analytics/CSV/featured-bump claims FLAG_FOR_OWNER_LEGAL_REVIEW — not rewritten this step.",
  },
  "pro-seller-promotions": {
    proposedAudience: "shared",
    staleRisk: "rewrite",
    recommendation: "rewrite",
    notes: "Promote is Coming Soon. Copy rewritten to not present featured/bumps as a live product.",
  },
  "business-accounts-setup": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    ownerLegalReview: true,
    notes: "Tax registration on one ROVEXO account — not Business-only. Phase C.1 Personal Account wording vs live Business context.",
  },
  "safety-tips": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    notes: "Mentions local meetup; safety-meetup prefers tracked courier.",
  },
  "ai-moderation-overview": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "ai-moderation-appeals": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "prohibited-items-list": { proposedAudience: "shared", staleRisk: "none", recommendation: "alias" },
  "community-guidelines": { proposedAudience: "shared", staleRisk: "none", recommendation: "alias" },
  "reports-appeals-process": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "privacy-policy": { proposedAudience: "shared", staleRisk: "none", recommendation: "alias" },
  "terms-of-service": { proposedAudience: "shared", staleRisk: "none", recommendation: "alias" },
  "trust-and-safety": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "seller-tax-registration": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    ownerLegalReview: true,
    notes: "Personal Account tax statuses — shared payout prerequisite, not Business-only.",
  },
  "buying-total-buyer-pays": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "buying-make-offer": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "buying-first-purchase": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "buying-condition-guide": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "selling-fees": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "selling-pricing": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "selling-parcels": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "selling-holiday-mode": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "selling-listing-quality": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "payments-platform-fee": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "payments-failed": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "wallet-overview": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "wallet-withdraw": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    ownerLegalReview: true,
    notes: "Does not claim payout timing hours. Protection hold differs by seller_context.",
  },
  "wallet-bank-account": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "shipping-change-address": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "shipping-late-delivery": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "shipping-labels": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "verification-overview": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "verification-payouts": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "business-storefront-tips": {
    proposedAudience: "business",
    staleRisk: "flag",
    recommendation: "keep",
    notes: "Business Store presentation. Canonical marketplace listing engines stay shared.",
  },
  "business-vat-basics": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    ownerLegalReview: true,
    notes: "Informational VAT for any seller — not Business-only.",
  },
  "safety-scam-red-flags": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "safety-meetup": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "returns-buyer-steps": { proposedAudience: "shared", staleRisk: "flag", recommendation: "keep", ownerLegalReview: true },
  "returns-seller-steps": { proposedAudience: "shared", staleRisk: "flag", recommendation: "keep", ownerLegalReview: true },
  "community-reviews": {
    proposedAudience: "shared",
    staleRisk: "flag",
    recommendation: "keep",
    notes: "Review window is 4 days after delivery; returned orders have no reputation impact.",
  },
  "community-reporting": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "account-notifications": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "account-delete": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "uk-buying-secondhand": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "uk-selling-locally": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-womens-fashion": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-mens-fashion": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-designer": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-kids-baby": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-home-garden": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-electronics": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-books-media": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-collectables": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-sports-outdoors": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  "guide-vehicle-parts": { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
};

export const HELP_HUB_CLASSIFICATION: Record<string, Classification> = {
  buyer: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  seller: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  payments: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  shipping: { proposedAudience: "shared", staleRisk: "flag", recommendation: "keep" },
  orders: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  account: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  safety: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
  reports: { proposedAudience: "shared", staleRisk: "none", recommendation: "keep" },
};

export const LEGAL_DOCUMENT_CLASSIFICATION: Record<string, Classification> = Object.fromEntries(
  CANONICAL_LEGAL_DOCUMENTS.map((document) => [
    document.slug,
    {
      proposedAudience: "shared" as const,
      staleRisk: "flag" as const,
      recommendation: "keep" as const,
      ownerLegalReview: true,
      notes:
        "Phase C.1 Personal Account-only legal wording vs live Business seller_context. Do not rewrite legal copy in Step 2.",
    } satisfies Classification,
  ]),
);

export const LEGAL_ALIAS_INVENTORY: readonly HelpContentInventoryRecord[] = [
  { slug: "privacy", title: "Privacy Policy alias", route: "/privacy", sourceFile: "app/(platform)/privacy/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/privacy/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "privacy-policy", title: "Privacy Policy alias", route: "/privacy-policy", sourceFile: "app/(platform)/privacy-policy/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/privacy-policy/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "terms", title: "Terms alias", route: "/terms", sourceFile: "app/(platform)/terms/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/terms/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "terms-of-service", title: "Terms of service alias", route: "/terms-of-service", sourceFile: "app/(platform)/terms-of-service/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/terms-of-service/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "cookies", title: "Cookie Policy alias", route: "/cookies", sourceFile: "app/(platform)/cookies/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/cookies/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "cookie-policy", title: "Cookie Policy alias", route: "/cookie-policy", sourceFile: "app/(platform)/cookie-policy/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/cookie-policy/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "fees", title: "Platform Fee Policy alias", route: "/fees", sourceFile: "app/(platform)/fees/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/fees/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "gdpr", title: "GDPR alias", route: "/gdpr", sourceFile: "app/(platform)/gdpr/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/gdpr/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
  { slug: "contact", title: "Contact → Support", route: "/contact", sourceFile: "app/(platform)/contact/page.tsx", symbol: "redirect", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "redirect", reachableFromUi: true, functionalSources: ["app/(platform)/contact/page.tsx"], staleRisk: "none", recommendation: "alias", ownerLegalReview: false, kind: "legal-alias" },
];

export const PRIVACY_SURFACE_INVENTORY: readonly HelpContentInventoryRecord[] = [
  {
    kind: "privacy-surface",
    slug: "privacy-policy",
    title: "Privacy Policy",
    route: "/legal/privacy-policy",
    sourceFile: "lib/legal/canonical-documents.ts",
    symbol: "CANONICAL_LEGAL_DOCUMENTS",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["lib/legal/canonical-documents.ts", "app/(platform)/legal/[slug]/page.tsx"],
    staleRisk: "flag",
    recommendation: "keep",
    ownerLegalReview: true,
    notes: "Legal document. Must stay separate from Settings Privacy.",
  },
  {
    kind: "privacy-surface",
    slug: "privacy-controls",
    title: "Privacy controls",
    route: "/account/privacy",
    sourceFile: "lib/privacy/privacy-engine-v1.ts",
    symbol: "privacy-engine-v1",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "settings-only",
    reachableFromUi: true,
    functionalSources: ["lib/privacy/privacy-engine-v1.ts", "app/api/account/privacy/route.ts"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
    notes: "Settings Privacy. Not the Privacy Policy. Do not merge.",
  },
];

export const ABOUT_INVENTORY: readonly HelpContentInventoryRecord[] = [
  {
    kind: "about",
    slug: "about",
    title: "About ROVEXO",
    route: "/about",
    sourceFile: "app/(platform)/about/page.tsx",
    symbol: "AboutUsPage",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/(platform)/about/page.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "about",
    slug: "about-help",
    title: "Help Centre (About link)",
    route: "/help",
    sourceFile: "app/(platform)/about/page.tsx",
    symbol: "Link",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/(platform)/about/page.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "about",
    slug: "about-support",
    title: "Contact Support (About link)",
    route: "/support",
    sourceFile: "app/(platform)/about/page.tsx",
    symbol: "Link",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/(platform)/about/page.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "about",
    slug: "about-legal",
    title: "Legal Centre (About link)",
    route: "/legal",
    sourceFile: "app/(platform)/about/page.tsx",
    symbol: "Link",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/(platform)/about/page.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "about",
    slug: "about-community-guidelines",
    title: "Community Guidelines (About link)",
    route: "/legal/community-guidelines",
    sourceFile: "app/(platform)/about/page.tsx",
    symbol: "Link",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/(platform)/about/page.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
];

export const SAFETY_INVENTORY: readonly HelpContentInventoryRecord[] = [
  {
    kind: "safety",
    slug: "safety-hub",
    title: "Safety",
    route: "/help/category/safety",
    sourceFile: "lib/help/content/category-hubs-v1.ts",
    symbol: "HUBS.safety",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["lib/help/content/category-hubs-v1.ts", "lib/help/help-centre-categories.ts"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "safety",
    slug: "trust",
    title: "Trust Centre",
    route: "/trust",
    sourceFile: "app/(platform)/trust/page.tsx",
    symbol: "TrustCentre",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/(platform)/trust/page.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "safety",
    slug: "resolution",
    title: "Protection / Resolution",
    route: "/resolution",
    sourceFile: "lib/protection/service.ts",
    symbol: "protection service",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "separate-engine",
    reachableFromUi: true,
    functionalSources: ["lib/protection/service.ts"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
    notes: "Protection cases stay separate from support_tickets.",
  },
];

export const SUPPORT_ENTRY_INVENTORY: readonly HelpContentInventoryRecord[] = [
  {
    kind: "support-entry",
    slug: "support-form",
    title: "Contact Support",
    route: "/support",
    sourceFile: "features/support/components/SupportForm.tsx",
    symbol: "SupportForm",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["app/api/support/route.ts", "lib/support/service.ts", "createSupportTicket"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "support-entry",
    slug: "help-contact-support",
    title: "Help → Contact Support",
    route: "/support",
    sourceFile: "features/help/components/HelpCentrePage.tsx",
    symbol: "HelpCentrePage",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["features/help/components/HelpCentrePage.tsx"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
  },
  {
    kind: "support-entry",
    slug: "help-report-problem",
    title: "Help → Report a Problem",
    route: "/support?category=report_user",
    sourceFile: "features/help/components/HelpCentrePage.tsx",
    symbol: "HelpCentrePage",
    currentAudience: "shared",
    proposedAudience: "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["lib/support/types.ts"],
    staleRisk: "rewrite",
    recommendation: "keep",
    ownerLegalReview: false,
    notes: "Was ?category=report (not in Zod enum). Mapped to report_user.",
  },
];

export const FEATURE_SHORTCUT_INVENTORY: readonly HelpContentInventoryRecord[] = [
  { kind: "feature-shortcut", slug: "sell", title: "Sell", route: "/sell", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "orders", title: "Orders", route: "/orders", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "wallet", title: "Balance", route: "/balance", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "messages", title: "Messages", route: "/inbox", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "settings", title: "Settings", route: "/account/settings", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "privacy-controls-shortcut", title: "Privacy", route: "/account/privacy", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "settings-only", reachableFromUi: true, functionalSources: ["lib/help/search.ts", "lib/privacy/privacy-engine-v1.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false, notes: "Settings Privacy shortcut — not Privacy Policy." },
  { kind: "feature-shortcut", slug: "security", title: "Security", route: "/account/security", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "verification", title: "Verification", route: "/account/verification", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "search", title: "Search", route: "/search", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "support", title: "Contact Support", route: "/support", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
  { kind: "feature-shortcut", slug: "legal", title: "Legal Information", route: "/legal", sourceFile: "lib/help/search.ts", symbol: "FEATURE_INDEX", currentAudience: "shared", proposedAudience: "shared", currentVisibility: "public", reachableFromUi: true, functionalSources: ["lib/help/search.ts"], staleRisk: "none", recommendation: "keep", ownerLegalReview: false },
];

function articleSourceFile(slug: string): string {
  const waveA = HELP_ARTICLES.find((article) => article.slug === slug);
  if (!waveA) return "lib/help/content/articles.ts";
  const knownWaveA = [
    "buying-total-buyer-pays",
    "business-storefront-tips",
    "guide-vehicle-parts",
  ];
  if (slug.startsWith("guide-") || slug.startsWith("buying-total") || slug.startsWith("uk-") || slug.includes("wallet") || slug.includes("verification") || slug.startsWith("shipping-") || slug.startsWith("returns-") || slug.startsWith("community-") || slug.startsWith("account-notifications") || slug.startsWith("account-delete") || slug.startsWith("safety-scam") || slug.startsWith("safety-meetup") || slug.startsWith("business-") || slug.startsWith("payments-platform") || slug.startsWith("payments-failed") || slug.startsWith("selling-fees") || slug.startsWith("selling-pricing") || slug.startsWith("selling-parcels") || slug.startsWith("selling-holiday") || slug.startsWith("selling-listing") || slug.startsWith("buying-make") || slug.startsWith("buying-first") || slug.startsWith("buying-condition")) {
    return "lib/help/content/wave-a-articles-v1.ts";
  }
  void knownWaveA;
  return "lib/help/content/articles.ts";
}

export function listHelpArticleInventory(): HelpContentInventoryRecord[] {
  return HELP_ARTICLES.map((article) => {
    const classification = HELP_ARTICLE_CLASSIFICATION[article.slug];
    const isAlias = article.slug === "privacy-policy" || article.slug === "terms-of-service" || article.slug === "community-guidelines" || article.slug === "prohibited-items-list";
    return {
      kind: "help-article",
      slug: article.slug,
      title: article.title,
      route: `/help/${article.slug}`,
      sourceFile: articleSourceFile(article.slug),
      symbol: "HELP_ARTICLES",
      currentAudience: article.audience ?? "shared",
      proposedAudience: classification?.proposedAudience ?? "shared",
      currentVisibility: isAlias ? "redirect" : "public",
      reachableFromUi: !isAlias,
      functionalSources: ["lib/help/content/articles.ts", "getHelpArticle"],
      staleRisk: classification?.staleRisk ?? "flag",
      recommendation: classification?.recommendation ?? "keep",
      ownerLegalReview: Boolean(classification?.ownerLegalReview),
      notes: classification?.notes,
    };
  });
}

export function listHelpHubInventory(): HelpContentInventoryRecord[] {
  return listHelpCategoryHubs().map((hub) => {
    const classification = HELP_HUB_CLASSIFICATION[hub.slug];
    return {
      kind: "help-hub",
      slug: hub.slug,
      title: hub.title,
      route: `/help/category/${hub.slug}`,
      sourceFile: "lib/help/content/category-hubs-v1.ts",
      symbol: "HUBS",
      currentAudience: hub.audience ?? "shared",
      proposedAudience: classification?.proposedAudience ?? "shared",
      currentVisibility: "public",
      reachableFromUi: HELP_CENTRE_CATEGORY_BUTTONS.some((button) => button.href === `/help/category/${hub.slug}`),
      functionalSources: ["lib/help/content/category-hubs-v1.ts", "HELP_CENTRE_CATEGORY_BUTTONS"],
      staleRisk: classification?.staleRisk ?? "none",
      recommendation: classification?.recommendation ?? "keep",
      ownerLegalReview: Boolean(classification?.ownerLegalReview),
    };
  });
}

export function listHelpTopicInventory(): HelpContentInventoryRecord[] {
  return HELP_TOPICS.map((topic) => {
    const legacy = isLegacyHelpTopicSlug(topic.slug);
    const isHub = (HELP_CATEGORY_HUB_SLUGS as readonly string[]).includes(topic.slug);
    return {
      kind: "help-topic",
      slug: topic.slug,
      title: topic.label,
      route: `/help/category/${topic.slug}`,
      sourceFile: "lib/help/content/topics.ts",
      symbol: "TOPIC_SEEDS / HELP_TOPICS",
      currentAudience: topic.audience ?? "shared",
      proposedAudience: "shared",
      currentVisibility: legacy ? "legacy-unmounted" : "public",
      reachableFromUi: isHub,
      functionalSources: ["lib/help/content/topics.ts", "getDecisionTree"],
      staleRisk: legacy ? "flag" : "none",
      recommendation: legacy ? "keep" : "keep",
      ownerLegalReview: false,
      notes: legacy
        ? "Legacy/unused vertical. Kept in-code. Excluded from current Help search and category rendering."
        : undefined,
    };
  });
}

export function listLegalDocumentInventory(): HelpContentInventoryRecord[] {
  return CANONICAL_LEGAL_DOCUMENTS.map((document) => {
    const classification = LEGAL_DOCUMENT_CLASSIFICATION[document.slug];
    const onIndex = LEGAL_CENTRE_INDEX.some((entry) => entry.slug === document.slug);
    return {
      kind: "legal-document",
      slug: document.slug,
      title: document.title,
      route: `/legal/${document.slug}`,
      sourceFile: "lib/legal/canonical-documents.ts",
      symbol: "CANONICAL_LEGAL_DOCUMENTS",
      currentAudience: document.audience ?? "shared",
      proposedAudience: classification?.proposedAudience ?? "shared",
      currentVisibility: "public",
      reachableFromUi: onIndex,
      functionalSources: ["lib/legal/canonical-documents.ts", "getLegalDocument"],
      staleRisk: classification?.staleRisk ?? "flag",
      recommendation: "keep",
      ownerLegalReview: true,
      notes: classification?.notes,
    };
  });
}

export function listSupportCategoryInventory(): HelpContentInventoryRecord[] {
  return SUPPORT_CATEGORIES.map((category) => ({
    kind: "support-category",
    slug: category.id,
    title: category.label,
    route: `/support?category=${category.id}`,
    sourceFile: "lib/support/types.ts",
    symbol: "SUPPORT_CATEGORIES",
    currentAudience: category.id === "business" ? "business" : "shared",
    proposedAudience: category.id === "business" ? "business" : "shared",
    currentVisibility: "public",
    reachableFromUi: true,
    functionalSources: ["lib/support/types.ts", "app/api/support/route.ts"],
    staleRisk: "none",
    recommendation: "keep",
    ownerLegalReview: false,
    notes: "Support form categories remain available. Ticket accountType is server-stamped.",
  }));
}

export function listFullHelpLegalSupportInventory(): HelpContentInventoryRecord[] {
  return [
    ...listHelpArticleInventory(),
    ...listHelpHubInventory(),
    ...listHelpTopicInventory(),
    ...HELP_CENTRE_CATEGORY_BUTTONS.map((button) => ({
      kind: "help-category-button" as const,
      slug: button.href.replace("/help/category/", ""),
      title: button.title,
      route: button.href,
      sourceFile: "lib/help/help-centre-categories.ts",
      symbol: "HELP_CENTRE_CATEGORY_BUTTONS",
      currentAudience: "shared" as const,
      proposedAudience: "shared" as const,
      currentVisibility: "public" as const,
      reachableFromUi: true,
      functionalSources: ["lib/help/help-centre-categories.ts"],
      staleRisk: "none" as const,
      recommendation: "keep" as const,
      ownerLegalReview: false,
    })),
    ...listLegalDocumentInventory(),
    ...LEGAL_CENTRE_INDEX.map((entry) => ({
      kind: "legal-index" as const,
      slug: entry.slug,
      title: entry.title,
      route: `/legal/${entry.slug}`,
      sourceFile: "lib/legal/legal-centre-consolidation-v1.ts",
      symbol: "LEGAL_CENTRE_INDEX",
      currentAudience: "shared" as const,
      proposedAudience: "shared" as const,
      currentVisibility: "public" as const,
      reachableFromUi: true,
      functionalSources: ["lib/legal/legal-centre-consolidation-v1.ts"],
      staleRisk: "flag" as const,
      recommendation: "keep" as const,
      ownerLegalReview: true,
    })),
    ...LEGAL_ALIAS_INVENTORY,
    ...ABOUT_INVENTORY,
    ...SAFETY_INVENTORY,
    ...listSupportCategoryInventory(),
    ...SUPPORT_ENTRY_INVENTORY,
    ...PRIVACY_SURFACE_INVENTORY,
    ...FEATURE_SHORTCUT_INVENTORY,
  ];
}
