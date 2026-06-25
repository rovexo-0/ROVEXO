export type LocaleCode =
  | "en-IE"
  | "en-GB"
  | "de-DE"
  | "fr-FR"
  | "es-ES"
  | "it-IT"
  | "nl-NL"
  | "pl-PL";

export type LocaleOption = {
  code: LocaleCode;
  label: string;
  language: string;
  currency: string;
  currencyLabel: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en-IE", label: "English (Ireland)", language: "English", currency: "EUR", currencyLabel: "EUR (€)" },
  { code: "en-GB", label: "English (UK)", language: "English", currency: "GBP", currencyLabel: "GBP (£)" },
  { code: "de-DE", label: "Deutsch", language: "Deutsch", currency: "EUR", currencyLabel: "EUR (€)" },
  { code: "fr-FR", label: "Français", language: "Français", currency: "EUR", currencyLabel: "EUR (€)" },
  { code: "es-ES", label: "Español", language: "Español", currency: "EUR", currencyLabel: "EUR (€)" },
  { code: "it-IT", label: "Italiano", language: "Italiano", currency: "EUR", currencyLabel: "EUR (€)" },
  { code: "nl-NL", label: "Nederlands", language: "Nederlands", currency: "EUR", currencyLabel: "EUR (€)" },
  { code: "pl-PL", label: "Polski", language: "Polski", currency: "PLN", currencyLabel: "PLN (zł)" },
];

export function getLocaleOption(code: string): LocaleOption {
  return LOCALE_OPTIONS.find((entry) => entry.code === code) ?? LOCALE_OPTIONS[0];
}

export function localeToHtmlLang(code: LocaleCode): string {
  return code.split("-")[0] ?? "en";
}
