import type {
  ClassifiedProduct,
  FaqEntry,
  ProductClassification,
} from "@/lib/documentation/documentation-engine-v1";

type ProductSeed = {
  id: string;
  name: string;
  classification: ProductClassification;
  why: string;
  rule: string;
  uk?: string;
  special?: string;
  buyerRisk?: string;
  seller?: string;
  moderation?: string;
  ai?: string;
  mistake?: string;
  aliases?: string[];
  faq?: FaqEntry[];
};

const DEFAULT_UK =
  "UK criminal, product safety, consumer, and weapons laws may apply. Sellers must not list items that are illegal to sell, possess, or post in the UK. When unsure, do not list — contact Support before publishing.";

export function product(seed: ProductSeed): ClassifiedProduct {
  const label = seed.classification;
  return {
    id: seed.id,
    name: seed.name,
    classification: seed.classification,
    overview: seed.why,
    marketplaceRule: seed.rule,
    ukLegal: seed.uk ?? DEFAULT_UK,
    specialConditions: seed.special,
    buyerRisks:
      seed.buyerRisk ??
      (label === "prohibited"
        ? "Buying or arranging prohibited items through ROVEXO can expose you to legal risk, lost money, account action, and unsafe goods."
        : label === "restricted"
          ? "Restricted items may carry legal, safety, shipping, or authenticity risks. Read the listing carefully and keep payments inside ROVEXO."
          : "Even Allowed items can be misdescribed. Check condition, authenticity, and return options before paying."),
    sellerResponsibilities:
      seed.seller ??
      (label === "prohibited"
        ? "Do not list, photograph, or negotiate sales of this item on ROVEXO. Attempting to circumvent detection may lead to permanent suspension and reporting to authorities where required."
        : label === "restricted"
          ? "Disclose condition, legality, age limits, shipping constraints, and required warnings. Incomplete or misleading listings may be removed."
          : "Describe the item accurately, use real photos, state faults, and comply with UK consumer and safety expectations."),
    moderation:
      seed.moderation ??
      (label === "prohibited"
        ? "Listings are blocked or removed. Accounts may be suspended. Serious cases may be escalated."
        : label === "restricted"
          ? "Listings may be held for manual review, require edits, or be limited by category rules before going live."
          : "Standard marketplace moderation applies. Misleading Allowed listings can still be removed."),
    aiDetection:
      seed.ai ??
      "Title, description, image signals, brand/keyword detection, risk scoring, and duplicate checks may flag this listing for automatic block or manual review.",
    commonMistakes:
      seed.mistake ??
      (label === "prohibited"
        ? "Renaming the item, cropping photos, or moving chat off-platform does not make a prohibited item Allowed."
        : "Omitting key risks, legality, or condition details is a common cause of removal and disputes."),
    aliases: seed.aliases,
    faq: seed.faq,
  };
}
