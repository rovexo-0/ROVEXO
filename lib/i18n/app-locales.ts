import type { LocaleCode } from "@/lib/i18n/config";

/** Locales exposed in the Language preference UI (v1.0). */
export const APP_DISPLAY_LOCALES: readonly LocaleCode[] = [
  "en-GB",
  "ro-RO",
  "de-DE",
  "fr-FR",
  "it-IT",
  "es-ES",
  "pl-PL",
] as const;

export type AppDisplayLocale = (typeof APP_DISPLAY_LOCALES)[number];

export function isAppDisplayLocale(code: string): code is AppDisplayLocale {
  return (APP_DISPLAY_LOCALES as readonly string[]).includes(code);
}
