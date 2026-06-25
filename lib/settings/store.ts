import { createClient } from "@/lib/supabase/server";
import { getLocaleOption } from "@/lib/i18n/config";
import type { AppSettings, AppSettingsPatch } from "@/lib/settings/types";
import { DEFAULT_APP_SETTINGS } from "@/lib/settings/types";
import type { AppearanceMode } from "@/lib/settings/types";

type SettingsRow = {
  push_notifications: boolean;
  email_notifications: boolean;
  dark_mode: boolean;
  language: string;
  currency: string;
  vacation_mode: boolean;
  locale_code?: string;
  appearance_mode?: string;
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
  };
}

function appearanceToDarkMode(appearanceMode: AppearanceMode, darkMode: boolean): boolean {
  if (appearanceMode === "light") return false;
  if (appearanceMode === "dark") return true;
  return darkMode;
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

export async function updateAppSettings(
  userId: string,
  patch: AppSettingsPatch,
): Promise<AppSettings> {
  const supabase = await createClient();
  const current = await getAppSettings(userId);
  const next = { ...current, ...patch };

  if (patch.localeCode) {
    const locale = getLocaleOption(patch.localeCode);
    next.language = locale.language;
    next.currency = locale.currencyLabel;
  }

  if (patch.appearanceMode) {
    if (patch.appearanceMode === "light") next.darkMode = false;
    if (patch.appearanceMode === "dark") next.darkMode = true;
  } else if (patch.darkMode != null && next.appearanceMode !== "system") {
    next.appearanceMode = patch.darkMode ? "dark" : "light";
  }

  const darkMode = appearanceToDarkMode(next.appearanceMode, next.darkMode);

  await supabase.from("user_settings").upsert({
    user_id: userId,
    push_notifications: next.pushNotifications,
    email_notifications: next.emailNotifications,
    dark_mode: darkMode,
    language: next.language,
    currency: next.currency,
    vacation_mode: next.vacationMode,
    locale_code: next.localeCode,
    appearance_mode: next.appearanceMode,
  });

  return { ...next, darkMode };
}
