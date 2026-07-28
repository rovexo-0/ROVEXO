export type CurrencyOption = {
  code: string;
  label: string;
  active?: boolean;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "GBP (£)", label: "British Pound (GBP)", active: true },
  { code: "EUR (€)", label: "Euro (EUR)", active: false },
  { code: "USD ($)", label: "US Dollar (USD)", active: false },
];

export function isValidCurrency(value: string): boolean {
  return CURRENCY_OPTIONS.some((entry) => entry.code === value && entry.active !== false);
}
