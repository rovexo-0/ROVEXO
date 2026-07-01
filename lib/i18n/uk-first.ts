/** UK-first marketplace — marketing stays English (UK) regardless of UI locale. */
export const UK_MARKETING_LOCALE = "en-GB" as const;

export const UK_DEFAULT_CURRENCY = "GBP" as const;
export const UK_DEFAULT_COUNTRY = "United Kingdom" as const;

/** Homepage banners, campaigns, and announcements remain UK English. */
export function isUkMarketingContent(_uiLocale: string): boolean {
  return true;
}

/** Interface chrome is translated; marketplace identity stays UK-first. */
export function resolveDisplayLocale(uiLocale: string): string {
  return uiLocale;
}
