/**
 * ROVEXO Language module — freeze markers v1.0
 * STATUS = FROZEN when LANGUAGE_MODULE_FROZEN === true.
 */

/** Canonical freeze label — Language module v1.0 approved production SSOT. */
export const LANGUAGE_MODULE_STATUS = "CANONICAL_FROZEN_v1.0" as const;

export const LANGUAGE_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — Language module v1.0 approved production SSOT. */
export const LANGUAGE_CANONICAL_STATUS = LANGUAGE_MODULE_STATUS;
export const LANGUAGE_MODULE_FROZEN = true as const;

/** Alias used by docs / audits. */
export const LANGUAGE_UI_FREEZE = LANGUAGE_MODULE_STATUS;

export const LANGUAGE_ROUTES = {
  preferences: "/account/preferences/language",
} as const;

/** Storage keys locked at freeze (client persistence). */
export const LANGUAGE_PERSISTENCE = {
  localStorageKey: "rovexo-locale",
  cookieKey: "rovexo-locale",
  changeEvent: "rovexo-locale-change",
  defaultLocale: "en-GB",
} as const;

/** Engine surfaces frozen as the v1.0 language contract. */
export const LANGUAGE_CANONICAL_MODULES = [
  "lib/i18n/provider.tsx",
  "lib/i18n/use-translation.ts",
  "lib/i18n/ui-phrases.ts",
  "lib/i18n/app-locales.ts",
  "lib/i18n/messages",
  "features/account/components/AccountLanguagePage.tsx",
  "features/settings/components/LanguagePicker.tsx",
] as const;

/** Display locales exposed in the Language preference UI (v1.0). */
export const LANGUAGE_DISPLAY_LOCALES = [
  "en-GB",
  "ro-RO",
  "de-DE",
  "fr-FR",
  "it-IT",
  "es-ES",
  "pl-PL",
] as const;
