export type AppearanceMode = "light" | "dark" | "system";

export type ProfileVisibility = "public" | "members_only" | "private";

export type AppSettings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
  vacationMode: boolean;
  localeCode: string;
  appearanceMode: AppearanceMode;
  timezone: string;
  profileVisibility: ProfileVisibility;
  marketingEmails: boolean;
  showActivityStatus: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotifications: true,
  emailNotifications: true,
  darkMode: false,
  language: "English",
  currency: "EUR (€)",
  vacationMode: false,
  localeCode: "en-IE",
  appearanceMode: "system",
  timezone: "Europe/Dublin",
  profileVisibility: "public",
  marketingEmails: false,
  showActivityStatus: true,
};

export type AppSettingsPatch = Partial<AppSettings>;
