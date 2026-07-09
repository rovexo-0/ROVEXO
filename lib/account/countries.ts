export type SupportedCountry = {
  code: string;
  name: string;
  postcodePattern: RegExp;
  postcodeExample: string;
};

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    code: "GB",
    name: "United Kingdom",
    postcodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    postcodeExample: "SW1A 1AA",
  },
  {
    code: "IE",
    name: "Ireland",
    postcodePattern: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i,
    postcodeExample: "D02 X285",
  },
  {
    code: "DE",
    name: "Germany",
    postcodePattern: /^\d{5}$/,
    postcodeExample: "10115",
  },
  {
    code: "FR",
    name: "France",
    postcodePattern: /^\d{5}$/,
    postcodeExample: "75001",
  },
  {
    code: "ES",
    name: "Spain",
    postcodePattern: /^\d{5}$/,
    postcodeExample: "28001",
  },
  {
    code: "IT",
    name: "Italy",
    postcodePattern: /^\d{5}$/,
    postcodeExample: "00118",
  },
  {
    code: "NL",
    name: "Netherlands",
    postcodePattern: /^\d{4}\s?[A-Z]{2}$/i,
    postcodeExample: "1012 AB",
  },
  {
    code: "PL",
    name: "Poland",
    postcodePattern: /^\d{2}-\d{3}$/,
    postcodeExample: "00-001",
  },
];

export const BUYER_REGIONS = SUPPORTED_COUNTRIES.map((country) => country.name);

export function findCountryByName(name: string): SupportedCountry | undefined {
  const normalized = name.trim().toLowerCase();
  return SUPPORTED_COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
}

export function validatePostcodeForCountry(countryName: string, postcode: string): boolean {
  const country = findCountryByName(countryName);
  if (!country) return postcode.trim().length >= 2;
  return country.postcodePattern.test(postcode.trim());
}
