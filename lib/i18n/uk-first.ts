/**
 * ROVEXO v1.0 — UK FIRST POLICY (Absolute Final).
 * Active marketplace: United Kingdom only.
 * Non-UK / EU markets may exist only as inactive architecture.
 */
export const UK_MARKETING_LOCALE = "en-GB" as const;

export const UK_DEFAULT_CURRENCY = "GBP" as const;
export const UK_DEFAULT_COUNTRY = "United Kingdom" as const;
export const UK_DEFAULT_COUNTRY_CODE = "GB" as const;

/** Active marketplace geography — UK only for v1.0. */
export const UK_ACTIVE_MARKET = {
  country: UK_DEFAULT_COUNTRY,
  countryCode: UK_DEFAULT_COUNTRY_CODE,
  currency: UK_DEFAULT_CURRENCY,
  locale: UK_MARKETING_LOCALE,
  taxRegime: "UK",
  vatRegime: "UK_VAT",
  payments: "UK_GBP",
  shipping: "UK_DOMESTIC",
} as const;

/** Active seller profiles on the live UK marketplace. */
export const UK_ACTIVE_SELLER_TYPES = ["uk_individual", "uk_business"] as const;
export type UkActiveSellerType = (typeof UK_ACTIVE_SELLER_TYPES)[number];

/** VAT registration states for UK sellers (both allowed). */
export const UK_VAT_STATES = ["vat_registered", "not_vat_registered"] as const;

/**
 * Inactive architecture only — must never drive live seller/tax/currency flows in v1.0.
 * Kept for future expansion; `active: false` is mandatory.
 */
export const UK_INACTIVE_MARKET_ARCHITECTURE = [
  { code: "IE", name: "Ireland", currency: "EUR", active: false as const },
  { code: "DE", name: "Germany", currency: "EUR", active: false as const },
  { code: "FR", name: "France", currency: "EUR", active: false as const },
  { code: "ES", name: "Spain", currency: "EUR", active: false as const },
  { code: "IT", name: "Italy", currency: "EUR", active: false as const },
  { code: "NL", name: "Netherlands", currency: "EUR", active: false as const },
  { code: "PL", name: "Poland", currency: "PLN", active: false as const },
] as const;

/** Homepage banners, campaigns, and announcements remain UK English. */
export function isUkMarketingContent(): boolean {
  return true;
}

/** Interface chrome is translated; marketplace identity stays UK-first. */
export function resolveDisplayLocale(uiLocale: string): string {
  return uiLocale;
}

export function isActiveUkMarketCurrency(currency: string): boolean {
  return currency.trim().toUpperCase() === UK_DEFAULT_CURRENCY;
}

export function isActiveUkMarketCountry(countryCodeOrName: string): boolean {
  const value = countryCodeOrName.trim().toLowerCase();
  return (
    value === "gb" ||
    value === "uk" ||
    value === UK_DEFAULT_COUNTRY.toLowerCase() ||
    value === "united kingdom of great britain and northern ireland"
  );
}

/** Non-UK markets exist only as inactive architecture. */
export function isInactiveNonUkArchitecture(countryCode: string): boolean {
  return UK_INACTIVE_MARKET_ARCHITECTURE.some(
    (market) => market.code === countryCode.trim().toUpperCase() && market.active === false,
  );
}
