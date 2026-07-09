import { buildZeroResultRecovery } from "@/lib/organic-growth/zero-results";
import type { IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";

export type ZeroResultRecoveryResult = ReturnType<typeof buildZeroResultRecovery> & {
  similarProducts: { label: string; href: string }[];
  nearbyCategories: { label: string; href: string }[];
  relatedBrands: { label: string; href: string }[];
  alternativeConditions: { label: string; href: string }[];
  alternativePriceRanges: { label: string; href: string }[];
};

const CONDITION_ALTERNATIVES = [
  { label: "Used", suffix: "used" },
  { label: "New", suffix: "new" },
  { label: "Refurbished", suffix: "refurbished" },
];

const PRICE_RANGES = [
  { label: "Under £25", href: "/collections/under-25", reason: "price_range" },
  { label: "Under £50", href: "/collections/under-50", reason: "price_range" },
  { label: "Under £100", href: "/collections/under-100", reason: "price_range" },
];

/** Zero Result Recovery Engine — never display dead ends. */
export function buildMarketplaceZeroResultRecovery(
  query: string,
  resultCount: number,
  thresholds: IntelligenceThresholds,
): ZeroResultRecoveryResult {
  const base = buildZeroResultRecovery(query, resultCount);

  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const alternativeConditions = CONDITION_ALTERNATIVES.map((entry) => ({
    label: `${entry.label} ${query}`,
    href: `/discover/${entry.suffix}-${slug}`.replace(/-+$/, ""),
    reason: "condition_alternative",
  }));

  const alternativePriceRanges = PRICE_RANGES;
  const similarProducts = base.recoveryLinks.filter((link) => link.href.startsWith("/listing/"));
  const nearbyCategories = base.suggestedCategories;
  const relatedBrands = base.suggestedBrands;

  const recoveryLinks = [
    ...base.recoveryLinks,
    ...alternativeConditions.slice(0, 2),
    ...alternativePriceRanges.slice(0, 2),
  ];

  const uniqueLinks = [...new Map(recoveryLinks.map((link) => [link.href, link])).values()].slice(
    0,
    Math.max(thresholds.zeroResultRecoveryMinLinks, 6),
  );

  return {
    ...base,
    recoveryLinks: uniqueLinks,
    similarProducts,
    nearbyCategories,
    relatedBrands,
    alternativeConditions,
    alternativePriceRanges,
  };
}
