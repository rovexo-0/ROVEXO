/** Canonical quick-sell condition values (SELL_MASTER_SPEC — no "For Parts"). */
export const SELL_QUICK_CONDITIONS = [
  "New",
  "Like New",
  "Very Good",
  "Good",
  "Fair",
] as const;

export type SellQuickCondition = (typeof SELL_QUICK_CONDITIONS)[number];

export function isSellQuickCondition(value: string): value is SellQuickCondition {
  return (SELL_QUICK_CONDITIONS as readonly string[]).includes(value);
}
