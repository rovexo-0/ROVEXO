import { createClient } from "@/lib/supabase/server";
import { isValidCurrency } from "@/lib/account/currencies";
import {
  languageEngineLabel,
  resolvePersistableLanguage,
} from "@/lib/i18n/platform-language";
import type { AppSettings, AppSettingsPatch } from "@/lib/settings/types";
import { DEFAULT_APP_SETTINGS } from "@/lib/settings/types";
import type { AppearanceMode, ProfileVisibility } from "@/lib/settings/types";
import type { Json } from "@/lib/supabase/types/database";
import {
  applyPrivacySwitchPatch,
  createDefaultCookiePreferences,
  createDefaultPrivacyEngineState,
  hydratePrivacyFromLegacy,
  parseCookiePreferences,
  parsePrivacyEngineState,
  privacyEngineToLegacy,
  type CookiePreferencesState,
  type PrivacyEngineState,
  type PrivacySwitchId,
  isPrivacySwitchId,
} from "@/lib/privacy/privacy-engine-v1";

type SettingsRow = {
  push_notifications: boolean;
  email_notifications: boolean;
  dark_mode: boolean;
  language: string;
  currency: string;
  vacation_mode: boolean;
  locale_code?: string;
  appearance_mode?: string;
  timezone?: string;
  profile_visibility?: string;
  marketing_emails?: boolean;
  show_activity_status?: boolean;
  privacy_engine_v1?: Json;
  cookie_preferences_v1?: Json;
};

function mapRow(data: SettingsRow): AppSettings {
  return {
    pushNotifications: data.push_notifications,
    emailNotifications: data.email_notifications,
    darkMode: data.dark_mode,
    language: data.language,
    currency: data.currency,
    vacationMode: data.vacation_mode,
    localeCode: data.locale_code ?? DEFAULT_APP_SETTINGS.localeCode,
    appearanceMode: (data.appearance_mode as AppearanceMode) ?? DEFAULT_APP_SETTINGS.appearanceMode,
    timezone: data.timezone ?? DEFAULT_APP_SETTINGS.timezone,
    profileVisibility:
      (data.profile_visibility as ProfileVisibility) ?? DEFAULT_APP_SETTINGS.profileVisibility,
    marketingEmails: data.marketing_emails ?? DEFAULT_APP_SETTINGS.marketingEmails,
    showActivityStatus: data.show_activity_status ?? DEFAULT_APP_SETTINGS.showActivityStatus,
  };
}

function appearanceToDarkMode(appearanceMode: AppearanceMode, darkMode: boolean): boolean {
  if (appearanceMode === "light") return false;
  if (appearanceMode === "dark") return true;
  return darkMode;
}

function resolvePrivacyEngine(row: SettingsRow | null): PrivacyEngineState {
  if (!row) return createDefaultPrivacyEngineState();
  const empty =
    !row.privacy_engine_v1 ||
    (typeof row.privacy_engine_v1 === "object" &&
      !Array.isArray(row.privacy_engine_v1) &&
      Object.keys(row.privacy_engine_v1 as object).length === 0);
  if (empty) {
    return hydratePrivacyFromLegacy({
      profileVisibility: row.profile_visibility as ProfileVisibility | undefined,
      marketingEmails: row.marketing_emails,
      showActivityStatus: row.show_activity_status,
    });
  }
  return parsePrivacyEngineState(row.privacy_engine_v1);
}

export async function getAppSettings(userId: string): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return DEFAULT_APP_SETTINGS;
  }

  return mapRow(data as SettingsRow);
}

export async function getPrivacyEngine(
  userId: string,
): Promise<{ privacy: PrivacyEngineState; cookies: CookiePreferencesState; settings: AppSettings }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const row = (data as SettingsRow | null) ?? null;
  const settings = row ? mapRow(row) : DEFAULT_APP_SETTINGS;
  return {
    privacy: resolvePrivacyEngine(row),
    cookies: parseCookiePreferences(row?.cookie_preferences_v1),
    settings,
  };
}

export async function updateAppSettings(
  userId: string,
  patch: AppSettingsPatch,
): Promise<AppSettings> {
  const supabase = await createClient();
  const current = await getAppSettings(userId);
  const next = { ...current, ...patch };

  if (patch.localeCode) {
    const persistable = resolvePersistableLanguage(patch.localeCode);
    next.localeCode = persistable;
    next.language = patch.language ?? languageEngineLabel(persistable);
  }

  if (patch.currency && !isValidCurrency(patch.currency)) {
    throw new Error("Invalid currency.");
  }

  if (patch.appearanceMode) {
    if (patch.appearanceMode === "light") next.darkMode = false;
    if (patch.appearanceMode === "dark") next.darkMode = true;
  } else if (patch.darkMode != null && next.appearanceMode !== "system") {
    next.appearanceMode = patch.darkMode ? "dark" : "light";
  }

  const darkMode = appearanceToDarkMode(next.appearanceMode, next.darkMode);
  const existing = await getPrivacyEngine(userId);
  let privacy = existing.privacy;
  if (patch.profileVisibility !== undefined) {
    privacy = { ...privacy, whoCanViewProfile: patch.profileVisibility };
  }
  if (patch.marketingEmails !== undefined) {
    privacy = applyPrivacySwitchPatch(privacy, "marketingEmails", patch.marketingEmails);
  }
  if (patch.showActivityStatus !== undefined) {
    privacy = applyPrivacySwitchPatch(privacy, "showOnlineStatus", patch.showActivityStatus);
    privacy = applyPrivacySwitchPatch(privacy, "showLastSeen", patch.showActivityStatus);
  }
  const legacy = privacyEngineToLegacy(privacy);

  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    push_notifications: next.pushNotifications,
    email_notifications: next.emailNotifications,
    dark_mode: darkMode,
    language: next.language,
    currency: next.currency,
    vacation_mode: next.vacationMode,
    locale_code: next.localeCode,
    appearance_mode: next.appearanceMode,
    timezone: next.timezone,
    profile_visibility: legacy.profileVisibility,
    marketing_emails: legacy.marketingEmails,
    show_activity_status: legacy.showActivityStatus,
    privacy_engine_v1: privacy as unknown as Json,
    cookie_preferences_v1: existing.cookies as unknown as Json,
  });

  if (error) throw error;

  return { ...next, darkMode, ...legacy };
}

export async function updatePrivacyEngine(
  userId: string,
  patch: {
    switchId?: string;
    switchEnabled?: boolean;
    whoCanViewProfile?: ProfileVisibility;
    engine?: unknown;
  },
): Promise<PrivacyEngineState> {
  const supabase = await createClient();
  const existing = await getPrivacyEngine(userId);
  let privacy = existing.privacy;

  if (patch.engine) {
    privacy = parsePrivacyEngineState(patch.engine);
  }
  if (patch.whoCanViewProfile) {
    privacy = { ...privacy, whoCanViewProfile: patch.whoCanViewProfile };
  }
  if (patch.switchId && isPrivacySwitchId(patch.switchId) && typeof patch.switchEnabled === "boolean") {
    privacy = applyPrivacySwitchPatch(privacy, patch.switchId as PrivacySwitchId, patch.switchEnabled);
  }

  const legacy = privacyEngineToLegacy(privacy);
  const settings = existing.settings;

  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    push_notifications: settings.pushNotifications,
    email_notifications: settings.emailNotifications,
    dark_mode: settings.darkMode,
    language: settings.language,
    currency: settings.currency,
    vacation_mode: settings.vacationMode,
    locale_code: settings.localeCode,
    appearance_mode: settings.appearanceMode,
    timezone: settings.timezone,
    profile_visibility: legacy.profileVisibility,
    marketing_emails: legacy.marketingEmails,
    show_activity_status: legacy.showActivityStatus,
    privacy_engine_v1: privacy as unknown as Json,
    cookie_preferences_v1: existing.cookies as unknown as Json,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return privacy;
}

export async function updateCookiePreferences(
  userId: string,
  patch: Partial<Omit<CookiePreferencesState, "version" | "necessary">>,
): Promise<CookiePreferencesState> {
  const supabase = await createClient();
  const existing = await getPrivacyEngine(userId);
  const cookies = parseCookiePreferences({
    ...existing.cookies,
    ...patch,
    necessary: true,
  });
  const legacy = privacyEngineToLegacy(existing.privacy);
  const settings = existing.settings;

  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    push_notifications: settings.pushNotifications,
    email_notifications: settings.emailNotifications,
    dark_mode: settings.darkMode,
    language: settings.language,
    currency: settings.currency,
    vacation_mode: settings.vacationMode,
    locale_code: settings.localeCode,
    appearance_mode: settings.appearanceMode,
    timezone: settings.timezone,
    profile_visibility: legacy.profileVisibility,
    marketing_emails: legacy.marketingEmails,
    show_activity_status: legacy.showActivityStatus,
    privacy_engine_v1: existing.privacy as unknown as Json,
    cookie_preferences_v1: cookies as unknown as Json,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return cookies;
}

export async function updatePrivacySettings(
  userId: string,
  patch: Partial<Pick<AppSettings, "profileVisibility" | "marketingEmails" | "showActivityStatus">> & {
    switchId?: string;
    switchEnabled?: boolean;
    whoCanViewProfile?: ProfileVisibility;
    engine?: unknown;
  },
): Promise<AppSettings> {
  if (patch.switchId || patch.whoCanViewProfile || patch.engine) {
    await updatePrivacyEngine(userId, {
      switchId: patch.switchId,
      switchEnabled: patch.switchEnabled,
      whoCanViewProfile: patch.whoCanViewProfile ?? patch.profileVisibility,
      engine: patch.engine,
    });
    return getAppSettings(userId);
  }

  return updateAppSettings(userId, {
    profileVisibility: patch.profileVisibility,
    marketingEmails: patch.marketingEmails,
    showActivityStatus: patch.showActivityStatus,
  });
}

export { createDefaultCookiePreferences, createDefaultPrivacyEngineState };
