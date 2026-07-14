import { enGB, type MessageKey } from "@/lib/i18n/messages/en-GB";
import { roRO } from "@/lib/i18n/messages/ro-RO";
import { deDE } from "@/lib/i18n/messages/de-DE";
import { frFR } from "@/lib/i18n/messages/fr-FR";
import { itIT } from "@/lib/i18n/messages/it-IT";
import { esES } from "@/lib/i18n/messages/es-ES";
import { nlNL } from "@/lib/i18n/messages/nl-NL";
import { plPL } from "@/lib/i18n/messages/pl-PL";
import type { LocaleCode } from "@/lib/i18n/config";

/**
 * Message catalogs — add locale files as native translations mature.
 * Unsupported locales fall back to English (UK).
 */
const catalogs: Partial<Record<LocaleCode, Record<MessageKey, string>>> = {
  "en-GB": enGB,
  "ro-RO": roRO,
  "de-DE": deDE,
  "fr-FR": frFR,
  "it-IT": itIT,
  "es-ES": esES,
  "nl-NL": nlNL,
  "pl-PL": plPL,
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
