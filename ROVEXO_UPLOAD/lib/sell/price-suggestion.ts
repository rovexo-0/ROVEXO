import type { SellCondition } from "@/features/sell/types";

const CONDITION_MULTIPLIER: Record<SellCondition, number> = {
  "New with Tags": 1,
  New: 0.95,
  "Like New": 0.85,
  "Very Good": 0.75,
  Good: 0.65,
  Fair: 0.5,
};

const CATEGORY_BASE: Record<string, number> = {
  electronics: 120,
  fashion: 45,
  home: 60,
  sports: 55,
  default: 50,
};

export function suggestListingPrice(input: {
  condition: SellCondition | string;
  categorySlug?: string | null;
  title?: string;
}): { suggested: number; low: number; high: number; rationale: string } {
  const slug = input.categorySlug?.split("/")[0]?.toLowerCase() ?? "default";
  const base = CATEGORY_BASE[slug] ?? CATEGORY_BASE.default;
  const multiplier =
    CONDITION_MULTIPLIER[input.condition as SellCondition] ??
    CONDITION_MULTIPLIER.Good;
  const suggested = Math.round(base * multiplier * 100) / 100;
  const low = Math.round(suggested * 0.85 * 100) / 100;
  const high = Math.round(suggested * 1.15 * 100) / 100;

  return {
    suggested,
    low,
    high,
    rationale: `Based on ${input.condition} condition and category pricing trends.`,
  };
}
