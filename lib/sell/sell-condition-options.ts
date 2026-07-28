/** Canonical quick-sell condition values — Owner Attribute Engine freeze. */
export const SELL_QUICK_CONDITIONS = [
  "New with tags",
  "New",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
] as const;

export type SellQuickCondition = (typeof SELL_QUICK_CONDITIONS)[number];

export function isSellQuickCondition(value: string): value is SellQuickCondition {
  return (SELL_QUICK_CONDITIONS as readonly string[]).includes(value);
}
