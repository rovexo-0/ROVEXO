/**
 * ROVEXO PLATFORM LANGUAGE POLICY v1.0 (FINAL OWNER LOCK)
 *
 * PERMANENT: English (UK) ONLY.
 * Language Engine / Selector / Picker / Switcher / Preferences — REMOVED.
 * 100% of the platform is English (UK). No multi-language. No exceptions.
 */

import type { LocaleCode } from "@/lib/i18n/config";

export const PLATFORM_LANGUAGE_POLICY_VERSION = "1.0" as const;
export const PLATFORM_LANGUAGE_POLICY_STATUS = "PERMANENT OWNER LOCK" as const;

export const PLATFORM_LANGUAGE_CODE = "en-GB" as const;
export const PLATFORM_LANGUAGE_LABEL = "English (UK)" as const;

export const PLATFORM_LANGUAGE_REMOVED = [
  "Language Engine",
  "Language Selector",
  "Language Settings",
  "Language Picker",
  "Language Switcher",
  "Language dropdown",
  "Language preferences",
  "Romanian",
  "German",
  "French",
  "Italian",
  "Spanish",
  "Dutch",
  "Portuguese",
  "Polish",
] as const;

/** Surfaces locked to English (UK). */
export const PLATFORM_LANGUAGE_SURFACES = [
  "Homepage",
  "Search",
  "Inbox",
  "Checkout",
  "Wallet",
  "Orders",
  "Seller",
  "Buyer",
  "Business",
  "Admin",
  "Super Admin",
  "Notifications",
  "Emails",
  "Future modules",
] as const;

export const PLATFORM_LANGUAGE_INDEPENDENT = [
  "Currency",
  "Country",
  "VAT",
  "Prices",
  "Marketplace Rules",
  "Product names",
  "Usernames",
  "Addresses",
  "User generated content",
] as const;

/** Always English (UK). Ignores any preferred locale. */
export function resolvePlatformLanguage(preferred?: string | null): LocaleCode {
  void preferred;
  return PLATFORM_LANGUAGE_CODE;
}

export function resolvePersistableLanguage(preferred?: string | null): LocaleCode {
  void preferred;
  return PLATFORM_LANGUAGE_CODE;
}

export function languageEngineLabel(code?: string): string {
  void code;
  return PLATFORM_LANGUAGE_LABEL;
}

export function isLanguageActive(code: string): boolean {
  return code === PLATFORM_LANGUAGE_CODE;
}

export function languageEngineSelectorOptions(): readonly { value: string; label: string }[] {
  return [{ value: PLATFORM_LANGUAGE_CODE, label: PLATFORM_LANGUAGE_LABEL }];
}

export function platformLanguageSnapshot() {
  return {
    version: PLATFORM_LANGUAGE_POLICY_VERSION,
    status: PLATFORM_LANGUAGE_POLICY_STATUS,
    code: PLATFORM_LANGUAGE_CODE,
    label: PLATFORM_LANGUAGE_LABEL,
    multiLanguage: false,
    languageEngineRemoved: true,
    surfaces: [...PLATFORM_LANGUAGE_SURFACES],
    neverChangedByLanguage: [...PLATFORM_LANGUAGE_INDEPENDENT],
    removed: [...PLATFORM_LANGUAGE_REMOVED],
  } as const;
}

/* ——— Compatibility aliases (former Language Engine imports) ——— */

export const LANGUAGE_ENGINE_NAME = "ROVEXO PLATFORM LANGUAGE" as const;
export const LANGUAGE_ENGINE_VERSION = "1.0" as const;
export const LANGUAGE_ENGINE_STATUS = PLATFORM_LANGUAGE_POLICY_STATUS;
export const LANGUAGE_ENGINE_DOM = "en-GB-only" as const;
export const LANGUAGE_ENGINE_DEFAULT = PLATFORM_LANGUAGE_CODE;
export const LANGUAGE_ENGINE_DEFAULT_LABEL = PLATFORM_LANGUAGE_LABEL;
export const LANGUAGE_ENGINE_CANONICAL_PRINCIPLE = "ENGLISH (UK) ONLY" as const;
export const LANGUAGE_ENGINE_PRODUCTION_RULE = "ENGLISH (UK) ONLY — NO MULTI-LANGUAGE" as const;
export const LANGUAGE_ENGINE_ACTIVE_CODES = [PLATFORM_LANGUAGE_CODE] as const;
export const LANGUAGE_ENGINE_REGISTRY = [
  { code: PLATFORM_LANGUAGE_CODE, label: PLATFORM_LANGUAGE_LABEL, active: true },
] as const;
export type LanguageEngineCode = typeof PLATFORM_LANGUAGE_CODE;
export type LanguageEngineEntry = (typeof LANGUAGE_ENGINE_REGISTRY)[number];

export const LANGUAGE_ENGINE_MUST_TRANSLATE = PLATFORM_LANGUAGE_SURFACES;
export const LANGUAGE_ENGINE_SURFACES = PLATFORM_LANGUAGE_SURFACES;
export const LANGUAGE_ENGINE_NEVER_TRANSLATE = PLATFORM_LANGUAGE_INDEPENDENT;
export const LANGUAGE_ENGINE_INDEPENDENT = PLATFORM_LANGUAGE_INDEPENDENT;
export const LANGUAGE_ENGINE_FORBIDDEN_PARTIALS = [] as const;
export const LANGUAGE_ENGINE_FORBIDDEN_ENGINES = PLATFORM_LANGUAGE_REMOVED;
export const LANGUAGE_ENGINE_AUTHORITY = {
  singleGlobalEngineOnly: true,
  englishUkOnly: true,
  multiLanguageRemoved: true,
} as const;
export const LANGUAGE_ENGINE_SWITCH = {
  instant: false,
  languageSwitchingRemoved: true,
} as const;
export const LANGUAGE_ENGINE_PRODUCTION_BLOCKERS = [
  "Any non-English (UK) UI in production",
] as const;
export const LANGUAGE_ENGINE_USER_CHOICES = ["country", "currency", "accessibility"] as const;
export const LANGUAGE_ENGINE_PLATFORM_RULES = [
  "marketplaceRules",
  "legalRules",
  "platformRules",
] as const;
export const LANGUAGE_ENGINE_DB = {
  field: "users.language",
  table: "user_settings",
  localeColumn: "locale_code",
  languageColumn: "language",
  lockedValue: PLATFORM_LANGUAGE_CODE,
} as const;
export const LANGUAGE_ENGINE_SAVE = {
  defaultHidden: true,
} as const;
export const LANGUAGE_ENGINE_FAIL_CLOSED = {
  fallbackLocale: PLATFORM_LANGUAGE_CODE,
} as const;
export const LANGUAGE_ENGINE_MARKETPLACE_RULE = {
  languageNotMarketplace: true,
} as const;

export function getLanguageEngineEntry(code: string): LanguageEngineEntry | undefined {
  return code === PLATFORM_LANGUAGE_CODE ? LANGUAGE_ENGINE_REGISTRY[0] : undefined;
}

export function isLanguageEngineCode(code: string): code is LanguageEngineCode {
  return code === PLATFORM_LANGUAGE_CODE;
}

export function isNeverTranslateCategory(category: string): boolean {
  return (PLATFORM_LANGUAGE_INDEPENDENT as readonly string[]).includes(category);
}

export function languageEngineSnapshot() {
  return platformLanguageSnapshot();
}

export { PLATFORM_LANGUAGE_POLICY_VERSION as LANGUAGE_ENGINE_V2_VERSION };
