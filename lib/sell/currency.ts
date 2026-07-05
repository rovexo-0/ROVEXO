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

/**
 * Deterministic config used for SSR and the first client paint.
 *
 * Locale MUST NOT be read during render: Node 21+ exposes a global `navigator`
 * whose `language` reflects the *server* locale, so reading it while rendering
 * produces a server/client hydration mismatch (e.g. `£` on server, `$` in the
 * browser). Components render this default first, then resolve the browser
 * locale in an effect after mount.
 */
export const SELL_CURRENCY_SSR_DEFAULT: SellCurrencyConfig = DEFAULT_CURRENCY;

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

  // Only trust `navigator` inside a real browser. On the server (Node 21+)
  // a global `navigator` exists but reflects the server locale, which would
  // desync from the client and break hydration.
  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.language
  ) {
    return resolveCurrencyFromLocale(navigator.language);
  }

  return DEFAULT_CURRENCY;
}

let cachedClientCurrency: SellCurrencyConfig | null = null;

/**
 * Stable browser-locale snapshot for `useSyncExternalStore`. Cached so repeated
 * calls return the same reference (required to avoid render loops).
 */
export function getClientSellCurrencySnapshot(): SellCurrencyConfig {
  if (!cachedClientCurrency) {
    cachedClientCurrency = getSellCurrencyConfig();
  }
  return cachedClientCurrency;
}

/** Server/first-paint snapshot — deterministic, never reads `navigator`. */
export function getServerSellCurrencySnapshot(): SellCurrencyConfig {
  return SELL_CURRENCY_SSR_DEFAULT;
}

/** Currency is fixed for the session, so there is nothing to subscribe to. */
export function subscribeSellCurrency(): () => void {
  return () => {};
}
