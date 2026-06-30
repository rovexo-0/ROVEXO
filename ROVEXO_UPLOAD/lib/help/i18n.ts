export const DEFAULT_HELP_LOCALE = "en";

export type LocalizedRecord<T> = {
  en: T;
  [locale: string]: T | undefined;
};

export function resolveLocalizedValue<T>(record: LocalizedRecord<T>, locale = DEFAULT_HELP_LOCALE): T {
  return record[locale] ?? record.en;
}

export function supportedHelpLocales(): string[] {
  return ["en"];
}
