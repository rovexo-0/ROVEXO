/**
 * ROVEXO Platform Language — freeze markers
 * English (UK) ONLY · Language Engine / selectors REMOVED.
 */

import { PLATFORM_LANGUAGE_CODE } from "@/lib/i18n/platform-language";

export const LANGUAGE_MODULE_STATUS = "ENGLISH_UK_ONLY_PERMANENT" as const;
export const LANGUAGE_SPEC_VERSION = "1.0" as const;
export const LANGUAGE_CANONICAL_STATUS = LANGUAGE_MODULE_STATUS;
export const LANGUAGE_MODULE_FROZEN = true as const;
export const LANGUAGE_UI_FREEZE = LANGUAGE_MODULE_STATUS;

export const LANGUAGE_ROUTES = {
  /** Language preferences removed — redirect target. */
  preferences: "/account/settings",
  accountSettings: "/account/profile",
} as const;

export const LANGUAGE_PERSISTENCE = {
  localStorageKey: "rovexo-locale",
  cookieKey: "rovexo-locale",
  changeEvent: "rovexo-locale-change",
  defaultLocale: PLATFORM_LANGUAGE_CODE,
} as const;

export const LANGUAGE_CANONICAL_MODULES = [
  "lib/i18n/platform-language.ts",
  "lib/i18n/provider.tsx",
] as const;

export const LANGUAGE_DISPLAY_LOCALES = [PLATFORM_LANGUAGE_CODE] as const;
export const LANGUAGE_ENGINE_CODES = [PLATFORM_LANGUAGE_CODE] as const;
