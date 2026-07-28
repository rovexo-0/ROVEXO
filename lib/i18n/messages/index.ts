import { enGB, type MessageKey } from "@/lib/i18n/messages/en-GB";
import { roRO } from "@/lib/i18n/messages/ro-RO";
import { deDE } from "@/lib/i18n/messages/de-DE";
import { frFR } from "@/lib/i18n/messages/fr-FR";
import { itIT } from "@/lib/i18n/messages/it-IT";
import { esES } from "@/lib/i18n/messages/es-ES";
import { nlNL } from "@/lib/i18n/messages/nl-NL";
import { plPL } from "@/lib/i18n/messages/pl-PL";
import { ptPT } from "@/lib/i18n/messages/pt-PT";
import type { LocaleCode } from "@/lib/i18n/config";
import { LANGUAGE_ENGINE_DEFAULT } from "@/lib/i18n/language-engine-v2";

/**
 * Message catalogs — Language Engine v2.0 active locales.
 * Missing keys fail closed to English (UK). Log only — never show keys/undefined.
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
  "pt-PT": ptPT,
};

export function translate(locale: LocaleCode | string, key: MessageKey): string {
  const catalog = catalogs[locale as LocaleCode];
  const value = catalog?.[key];
  if (value) return value;
  if (locale !== LANGUAGE_ENGINE_DEFAULT) {
    logMissingMessage({ locale: String(locale), key });
  }
  return enGB[key];
}

export function hasNativeCatalog(locale: LocaleCode | string): boolean {
  return Boolean(catalogs[locale as LocaleCode]);
}

export function listMessageCatalogLocales(): LocaleCode[] {
  return Object.keys(catalogs) as LocaleCode[];
}

function logMissingMessage(input: { locale: string; key: string }): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn("[language-engine]", "missing-translation", "message", input.locale, input.key);
}

export type { MessageKey };
