export type LocaleCode =
  | "en-GB"
  | "ro-RO"
  | "de-DE"
  | "fr-FR"
  | "es-ES"
  | "it-IT"
  | "nl-NL"
  | "pl-PL"
  | "pt-PT"
  | "hu-HU"
  | "bg-BG"
  | "el-GR"
  | "tr-TR"
  | "uk-UA"
  | "ar-SA"
  | "en-IE";

export type LocaleOption = {
  code: LocaleCode;
  label: string;
  language: string;
  currency: string;
  currencyLabel: string;
  /** BCP-47 for Intl formatters */
  bcp47: string;
  /** RTL languages use dir="rtl" when supported */
  direction: "ltr" | "rtl";
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en-GB", label: "English (UK)", language: "English", currency: "GBP", currencyLabel: "GBP (£)", bcp47: "en-GB", direction: "ltr" },
  { code: "ro-RO", label: "Română", language: "Română", currency: "RON", currencyLabel: "RON (lei)", bcp47: "ro-RO", direction: "ltr" },
  { code: "de-DE", label: "Deutsch", language: "Deutsch", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "de-DE", direction: "ltr" },
  { code: "fr-FR", label: "Français", language: "Français", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "fr-FR", direction: "ltr" },
  { code: "nl-NL", label: "Nederlands", language: "Nederlands", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "nl-NL", direction: "ltr" },
  { code: "it-IT", label: "Italiano", language: "Italiano", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "it-IT", direction: "ltr" },
  { code: "es-ES", label: "Español", language: "Español", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "es-ES", direction: "ltr" },
  { code: "pt-PT", label: "Português", language: "Português", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "pt-PT", direction: "ltr" },
  { code: "pl-PL", label: "Polski", language: "Polski", currency: "PLN", currencyLabel: "PLN (zł)", bcp47: "pl-PL", direction: "ltr" },
  { code: "hu-HU", label: "Magyar", language: "Magyar", currency: "HUF", currencyLabel: "HUF (Ft)", bcp47: "hu-HU", direction: "ltr" },
  { code: "bg-BG", label: "Български", language: "Български", currency: "BGN", currencyLabel: "BGN (лв)", bcp47: "bg-BG", direction: "ltr" },
  { code: "el-GR", label: "Ελληνικά", language: "Ελληνικά", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "el-GR", direction: "ltr" },
  { code: "tr-TR", label: "Türkçe", language: "Türkçe", currency: "TRY", currencyLabel: "TRY (₺)", bcp47: "tr-TR", direction: "ltr" },
  { code: "ar-SA", label: "العربية", language: "العربية", currency: "SAR", currencyLabel: "SAR (ر.س)", bcp47: "ar-SA", direction: "rtl" },
  { code: "uk-UA", label: "Українська", language: "Українська", currency: "UAH", currencyLabel: "UAH (₴)", bcp47: "uk-UA", direction: "ltr" },
  { code: "en-IE", label: "English (Ireland)", language: "English", currency: "EUR", currencyLabel: "EUR (€)", bcp47: "en-IE", direction: "ltr" },
];

export function getLocaleOption(code: string): LocaleOption {
  return LOCALE_OPTIONS.find((entry) => entry.code === code) ?? LOCALE_OPTIONS[0];
}

export function localeToHtmlLang(code: LocaleCode): string {
  return getLocaleOption(code).bcp47;
}

export function localeDirection(code: LocaleCode): "ltr" | "rtl" {
  return getLocaleOption(code).direction;
}

/** All supported locale codes for schema validation */
export const SUPPORTED_LOCALE_CODES = LOCALE_OPTIONS.map((entry) => entry.code);
