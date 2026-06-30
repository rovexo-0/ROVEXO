export type SellCurrencyConfig = {
  currency: string;
  locale: string;
  symbol: string;
};

const DEFAULT_CURRENCY: SellCurrencyConfig = {
  currency: "EUR",
  locale: "en-IE",
  symbol: "€",
};

function getCurrencySymbol(currency: string, locale: string): string {
  try {
    return (
      new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0).find(
        (part) => part.type === "currency",
      )?.value ?? DEFAULT_CURRENCY.symbol
    );
  } catch {
    return DEFAULT_CURRENCY.symbol;
  }
}

function resolveCurrencyFromLocale(locale: string): SellCurrencyConfig {
  const normalized = locale.toLowerCase();

  if (normalized.includes("us") || normalized.endsWith("-us")) {
    return { currency: "USD", locale, symbol: getCurrencySymbol("USD", locale) };
  }

  if (normalized.includes("gb") || normalized.endsWith("-uk")) {
    return { currency: "GBP", locale, symbol: getCurrencySymbol("GBP", locale) };
  }

  return {
    currency: DEFAULT_CURRENCY.currency,
    locale,
    symbol: getCurrencySymbol(DEFAULT_CURRENCY.currency, locale),
  };
}

export function getSellCurrencyConfig(locale?: string): SellCurrencyConfig {
  if (locale) return resolveCurrencyFromLocale(locale);

  if (typeof navigator !== "undefined" && navigator.language) {
    return resolveCurrencyFromLocale(navigator.language);
  }

  return DEFAULT_CURRENCY;
}
