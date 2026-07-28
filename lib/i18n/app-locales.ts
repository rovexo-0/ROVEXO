import type { LocaleCode } from "@/lib/i18n/config";
import { PLATFORM_LANGUAGE_CODE } from "@/lib/i18n/platform-language";

/** Live UI locales — English (UK) only (permanent Owner lock). */
export const APP_DISPLAY_LOCALES: readonly LocaleCode[] = [PLATFORM_LANGUAGE_CODE];

export type AppDisplayLocale = (typeof APP_DISPLAY_LOCALES)[number];

export function isAppDisplayLocale(code: string): code is AppDisplayLocale {
  return code === PLATFORM_LANGUAGE_CODE;
}
