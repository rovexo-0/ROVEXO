export type CurrencyOption = {
  code: string;
  label: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "EUR (€)", label: "Euro (EUR)" },
  { code: "GBP (£)", label: "British Pound (GBP)" },
  { code: "USD ($)", label: "US Dollar (USD)" },
  { code: "PLN (zł)", label: "Polish Złoty (PLN)" },
];

export function isValidCurrency(value: string): boolean {
  return CURRENCY_OPTIONS.some((entry) => entry.code === value);
}
