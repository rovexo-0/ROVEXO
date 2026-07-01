import { enGB, type MessageKey } from "@/lib/i18n/messages/en-GB";
import { roRO } from "@/lib/i18n/messages/ro-RO";
import type { LocaleCode } from "@/lib/i18n/config";

/**
 * Message catalogs — add locale files as native translations mature.
 * Unsupported locales fall back to English (UK).
 */
const catalogs: Partial<Record<LocaleCode, Record<MessageKey, string>>> = {
  "en-GB": enGB,
  "ro-RO": roRO,
};

export function translate(locale: LocaleCode | string, key: MessageKey): string {
  const catalog = catalogs[locale as LocaleCode];
  if (catalog?.[key]) return catalog[key];
  return enGB[key];
}

export function hasNativeCatalog(locale: LocaleCode | string): boolean {
  return Boolean(catalogs[locale as LocaleCode]);
}

export type { MessageKey };
