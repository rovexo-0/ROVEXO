export type CurrencyOption = {
  code: string;
  label: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "GBP (£)", label: "British Pound (GBP)" },
];

export function isValidCurrency(value: string): boolean {
  return CURRENCY_OPTIONS.some((entry) => entry.code === value);
}
