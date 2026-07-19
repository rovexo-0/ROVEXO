import {
  UK_DEFAULT_COUNTRY,
  UK_DEFAULT_COUNTRY_CODE,
  UK_INACTIVE_MARKET_ARCHITECTURE,
  isActiveUkMarketCountry,
} from "@/lib/i18n/uk-first";

export type SupportedCountry = {
  code: string;
  name: string;
  postcodePattern: RegExp;
  postcodeExample: string;
  /** Live marketplace selection — UK only for v1.0. */
  active: boolean;
};

/**
 * Country catalogue.
 * Active seller/buyer selection: United Kingdom only.
 * EU / other entries remain inactive architecture (not offered in live UI).
 */
export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    code: UK_DEFAULT_COUNTRY_CODE,
    name: UK_DEFAULT_COUNTRY,
    postcodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    postcodeExample: "SW1A 1AA",
    active: true,
  },
  ...UK_INACTIVE_MARKET_ARCHITECTURE.map((market) => ({
    code: market.code,
    name: market.name,
    postcodePattern:
      market.code === "IE"
        ? /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i
        : market.code === "NL"
          ? /^\d{4}\s?[A-Z]{2}$/i
          : market.code === "PL"
            ? /^\d{2}-\d{3}$/
            : /^\d{5}$/,
    postcodeExample:
      market.code === "IE"
        ? "D02 X285"
        : market.code === "NL"
          ? "1012 AB"
          : market.code === "PL"
            ? "00-001"
            : market.code === "DE"
              ? "10115"
              : market.code === "FR"
                ? "75001"
                : market.code === "ES"
                  ? "28001"
                  : "00118",
    active: false as const,
  })),
];

/** Live marketplace regions — UK only. */
export const ACTIVE_SUPPORTED_COUNTRIES = SUPPORTED_COUNTRIES.filter((country) => country.active);

export const BUYER_REGIONS = ACTIVE_SUPPORTED_COUNTRIES.map((country) => country.name);

/** Full catalogue including inactive architecture (lookups / migration only). */
export const ALL_COUNTRY_NAMES = SUPPORTED_COUNTRIES.map((country) => country.name);

export function findCountryByName(name: string): SupportedCountry | undefined {
  const normalized = name.trim().toLowerCase();
  return SUPPORTED_COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
}

export function validatePostcodeForCountry(countryName: string, postcode: string): boolean {
  const country = findCountryByName(countryName);
  if (!country) return postcode.trim().length >= 2;
  if (!country.active && !isActiveUkMarketCountry(countryName)) {
    // Inactive architecture countries still validate format if referenced historically.
    return country.postcodePattern.test(postcode.trim());
  }
  return country.postcodePattern.test(postcode.trim());
}
