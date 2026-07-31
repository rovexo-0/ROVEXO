/**
 * ROVEXO LEGAL CENTRE CONSOLIDATION v1.0
 *
 * STATUS: OWNER APPROVED
 * Single canonical Legal hub. Settings keeps only "Legal Information".
 * Documents remain under /legal/{slug}. Navigation duplicates removed from Settings.
 */

import type { SettingsIconTone } from "@/lib/settings/settings-v1";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";

export const LEGAL_CENTRE_CONSOLIDATION_V1 = {
  id: "legal-centre-consolidation-v1",
  version: "1.0.0",
  status: "OWNER_APPROVED",
  lastUpdated: "30 July 2026",
  settingsLegalSectionRows: ["Legal Information", "HMRC Reporting"] as const,
  settingsSupportSectionRows: ["Help Centre"] as const,
  officialLegalCentreName: "Official ROVEXO Legal Centre" as const,
  settingsForbiddenDuplicateTitles: [
    "Contact Support",
    "Terms & Conditions",
    "Privacy Policy",
    "Cookie Policy",
    "Community Guidelines",
    "Prohibited Items",
    "Buyer Protection",
    "Seller Protection",
    "Fees",
    "Digital Platform Reporting",
    "GDPR & Data Rights",
  ] as const,
  hubRoute: "/legal",
  settingsEntry: "/account/settings",
} as const;

export type LegalCentreIconSpec = {
  slug: string;
  title: string;
  icon: SettingsMenuIcon;
  tone: SettingsIconTone;
};

/**
 * Canonical Legal Centre index order + Settings-matching icon family.
 * One icon language with Settings (SettingsMenuIconGlyph).
 */
export const LEGAL_CENTRE_INDEX: readonly LegalCentreIconSpec[] = [
  { slug: "terms-and-conditions", title: "Terms & Conditions", icon: "document", tone: "blue" },
  { slug: "privacy-policy", title: "Privacy Policy", icon: "shield", tone: "green" },
  { slug: "cookie-policy", title: "Cookie Policy", icon: "document", tone: "orange" },
  { slug: "community-guidelines", title: "Community Guidelines", icon: "people", tone: "rovexo-blue" },
  { slug: "buyer-terms", title: "Buyer Terms", icon: "credit-card", tone: "blue" },
  { slug: "seller-terms", title: "Seller Terms", icon: "star", tone: "purple" },
  { slug: "buyer-protection", title: "Buyer Protection", icon: "shield", tone: "green" },
  { slug: "seller-protection", title: "Seller Protection", icon: "shield", tone: "purple" },
  { slug: "shipping-policy", title: "Shipping Policy", icon: "location", tone: "blue" },
  { slug: "delivery-policy", title: "Delivery Policy", icon: "location", tone: "rovexo-blue" },
  { slug: "returns-refund-policy", title: "Returns & Refund Policy", icon: "document", tone: "orange" },
  { slug: "platform-fee-policy", title: "Platform Fee Policy", icon: "wallet", tone: "gold" },
  { slug: "payment-terms", title: "Payment Terms", icon: "credit-card", tone: "gold" },
  { slug: "wallet-terms", title: "Wallet Terms", icon: "wallet", tone: "purple" },
  { slug: "prohibited-restricted-items", title: "Prohibited & Restricted Items Policy", icon: "lock", tone: "red" },
  { slug: "acceptable-use-policy", title: "Acceptable Use Policy", icon: "shield", tone: "red" },
  {
    slug: "intellectual-property-policy",
    title: "Intellectual Property & Notice and Takedown Policy",
    icon: "document",
    tone: "blue",
  },
  {
    slug: "complaint-dispute-resolution",
    title: "Complaint & Dispute Resolution Policy",
    icon: "headset",
    tone: "orange",
  },
  { slug: "account-suspension-policy", title: "Account Suspension Policy", icon: "lock", tone: "soft-red" },
  {
    slug: "digital-platform-reporting-tax-notice",
    title: "Digital Platform Reporting & Tax Notice",
    icon: "document",
    tone: "rovexo-blue",
  },
  { slug: "gdpr-data-rights", title: "GDPR & Data Rights", icon: "shield", tone: "green" },
  { slug: "data-retention-policy", title: "Data Retention Policy", icon: "document", tone: "green" },
  { slug: "accessibility-statement", title: "Accessibility Statement", icon: "info", tone: "rovexo-blue" },
  { slug: "verification-policy", title: "Verification Policy", icon: "star", tone: "purple" },
  { slug: "legal-changelog", title: "Legal Changelog / Version History", icon: "info", tone: "purple" },
] as const;

export const LEGAL_CENTRE_REQUIRED_SLUGS = LEGAL_CENTRE_INDEX.map((entry) => entry.slug);

export function getLegalCentreIcon(slug: string): LegalCentreIconSpec | null {
  return LEGAL_CENTRE_INDEX.find((entry) => entry.slug === slug) ?? null;
}
