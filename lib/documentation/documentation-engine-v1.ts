/**
 * ROVEXO DOCUMENTATION ENGINE v1.0
 *
 * STATUS: OWNER APPROVED · CANONICAL · CRITICAL
 *
 * Single documentation architecture for Help Centre + Legal Centre.
 * Content lives in SSOT modules; UI shells are unchanged.
 */

export const DOCUMENTATION_ENGINE_V1 = {
  id: "rovexo-documentation-engine-v1",
  version: "1.0.0",
  status: "OWNER_APPROVED",
  lastUpdated: "30 July 2026",
} as const;

/** Three marketplace product states — no fourth state. */
export type ProductClassification = "allowed" | "restricted" | "prohibited";

export const PRODUCT_CLASSIFICATIONS = ["allowed", "restricted", "prohibited"] as const;

export const CLASSIFICATION_LABEL: Record<ProductClassification, string> = {
  allowed: "Allowed",
  restricted: "Restricted",
  prohibited: "Prohibited",
};

export type DocLink = { title: string; href: string };

export type FaqEntry = { question: string; answer: string };

/** Master Help / handbook section order (Owner Master Documentation Spec). */
export const MASTER_DOC_SECTIONS = [
  "Introduction",
  "Purpose",
  "Who this applies to",
  "Definitions",
  "Detailed explanation",
  "Step-by-step guidance",
  "Examples",
  "Common mistakes",
  "Frequently Asked Questions",
  "Related Help Articles",
  "Related Legal Documents",
  "Contact Support",
  "Last Updated",
] as const;

export function formatFaqMarkdown(faqs: FaqEntry[]): string {
  return faqs
    .map((faq) => `**Q: ${faq.question}**  \nA: ${faq.answer}`)
    .join("\n\n");
}

export function formatLinkList(links: DocLink[]): string {
  return links.map((link) => `- [${link.title}](${link.href})`).join("\n");
}

export function wrapMasterHelpDocument(input: {
  title: string;
  lastUpdated: string;
  introduction: string;
  purpose: string;
  whoApplies: string;
  definitions: string;
  detailed: string;
  steps: string;
  examples: string;
  mistakes: string;
  faqs: FaqEntry[];
  relatedHelp: DocLink[];
  relatedLegal: DocLink[];
  relatedFeatures?: DocLink[];
}): string {
  const features =
    input.relatedFeatures && input.relatedFeatures.length > 0
      ? `\n## Related platform features\n${formatLinkList(input.relatedFeatures)}\n`
      : "";

  return `# ${input.title}

*Last Updated: ${input.lastUpdated}*

## Introduction
${input.introduction}

## Purpose
${input.purpose}

## Who this applies to
${input.whoApplies}

## Definitions
${input.definitions}

## Detailed explanation
${input.detailed}

## Step-by-step guidance
${input.steps}

## Examples
${input.examples}

## Common mistakes
${input.mistakes}

## Frequently Asked Questions
${formatFaqMarkdown(input.faqs)}
${features}
## Related Help Articles
${formatLinkList(input.relatedHelp)}

## Related Legal Documents
${formatLinkList(input.relatedLegal)}

## Back to Help Centre
- [Help Centre](/help)

## Contact Support
If this guide does not resolve your issue, open [Contact Support](/support).

## Last Updated
${input.lastUpdated}
`;
}

export type ClassifiedProduct = {
  id: string;
  name: string;
  classification: ProductClassification;
  overview: string;
  marketplaceRule: string;
  ukLegal: string;
  specialConditions?: string;
  buyerRisks: string;
  sellerResponsibilities: string;
  moderation: string;
  aiDetection: string;
  commonMistakes: string;
  faq?: FaqEntry[];
  aliases?: string[];
};

export type ProductCategoryManual = {
  id: string;
  title: string;
  overview: string;
  marketplaceRule: string;
  ukLegal: string;
  allowedExamples: string[];
  restrictedExamples: string[];
  prohibitedExamples: string[];
  specialConditions: string;
  buyerRisks: string;
  sellerResponsibilities: string;
  moderationRules: string;
  aiDetection: string;
  commonMistakes: string;
  products: ClassifiedProduct[];
  faqs: FaqEntry[];
  relatedPolicies: DocLink[];
};

export function renderClassifiedProduct(product: ClassifiedProduct): string {
  const faqBlock =
    product.faq && product.faq.length > 0
      ? `\n\n**FAQ for ${product.name}**\n\n${formatFaqMarkdown(product.faq)}`
      : "";
  const aliases =
    product.aliases && product.aliases.length > 0
      ? `\n\n**Also known as / search aliases:** ${product.aliases.join(", ")}`
      : "";

  return `### ${product.name}

**Classification:** ${CLASSIFICATION_LABEL[product.classification]}

**Overview:** ${product.overview}

**Marketplace Rule:** ${product.marketplaceRule}

**UK Legal Considerations:** ${product.ukLegal}

**Special Conditions:** ${product.specialConditions ?? "Follow the classification above and all related ROVEXO Legal documents."}

**Buyer Risks:** ${product.buyerRisks}

**Seller Responsibilities:** ${product.sellerResponsibilities}

**Moderation Rules:** ${product.moderation}

**Automatic AI Detection:** ${product.aiDetection}

**Common Mistakes:** ${product.commonMistakes}${aliases}${faqBlock}
`;
}

export function renderProductCategoryManual(category: ProductCategoryManual): string {
  const products = category.products.map(renderClassifiedProduct).join("\n");
  return `## ${category.title}

**Overview:** ${category.overview}

**Marketplace Rule:** ${category.marketplaceRule}

**UK Legal Considerations:** ${category.ukLegal}

**Allowed Examples:**
${category.allowedExamples.map((x) => `- ${x}`).join("\n") || "- None in this category without additional checks."}

**Restricted Examples:**
${category.restrictedExamples.map((x) => `- ${x}`).join("\n") || "- None listed as Restricted in this category."}

**Prohibited Examples:**
${category.prohibitedExamples.map((x) => `- ${x}`).join("\n") || "- None listed as Prohibited in this category."}

**Special Conditions:** ${category.specialConditions}

**Buyer Risks:** ${category.buyerRisks}

**Seller Responsibilities:** ${category.sellerResponsibilities}

**Moderation Rules:** ${category.moderationRules}

**Automatic AI Detection:** ${category.aiDetection}

**Common Mistakes:** ${category.commonMistakes}

### Individual product rules — ${category.title}

${products}

### FAQ — ${category.title}

${formatFaqMarkdown(category.faqs)}

**Related Policies**
${formatLinkList(category.relatedPolicies)}
`;
}
