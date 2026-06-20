import { createClient } from "@/lib/supabase/server";
import type { AppSettings, AppSettingsPatch } from "@/lib/settings/types";
import { DEFAULT_APP_SETTINGS } from "@/lib/settings/types";

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

  return {
    pushNotifications: data.push_notifications,
    emailNotifications: data.email_notifications,
    darkMode: data.dark_mode,
    language: data.language,
    currency: data.currency,
    vacationMode: data.vacation_mode,
  };
}

export async function updateAppSettings(
  userId: string,
  patch: AppSettingsPatch,
): Promise<AppSettings> {
  const supabase = await createClient();
  const current = await getAppSettings(userId);
  const next = { ...current, ...patch };

  await supabase.from("user_settings").upsert({
    user_id: userId,
    push_notifications: next.pushNotifications,
    email_notifications: next.emailNotifications,
    dark_mode: next.darkMode,
    language: next.language,
    currency: next.currency,
    vacation_mode: next.vacationMode,
  });

  return next;
}
