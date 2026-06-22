export type MarketRegion = {
  code: string;
  name: string;
  locale: string;
  currency: string;
  active: boolean;
};

export const MARKET_REGIONS: MarketRegion[] = [
  { code: "uk", name: "United Kingdom", locale: "en-GB", currency: "GBP", active: true },
  { code: "ie", name: "Ireland", locale: "en-IE", currency: "EUR", active: false },
  { code: "de", name: "Germany", locale: "de-DE", currency: "EUR", active: false },
  { code: "fr", name: "France", locale: "fr-FR", currency: "EUR", active: false },
  { code: "es", name: "Spain", locale: "es-ES", currency: "EUR", active: false },
  { code: "it", name: "Italy", locale: "it-IT", currency: "EUR", active: false },
  { code: "ro", name: "Romania", locale: "ro-RO", currency: "RON", active: false },
  { code: "nl", name: "Netherlands", locale: "nl-NL", currency: "EUR", active: false },
  { code: "be", name: "Belgium", locale: "nl-BE", currency: "EUR", active: false },
];

export function getActiveMarket(): MarketRegion {
  return MARKET_REGIONS.find((region) => region.active) ?? MARKET_REGIONS[0]!;
}

export function getMarketByCode(code: string): MarketRegion | undefined {
  return MARKET_REGIONS.find((region) => region.code === code);
}
