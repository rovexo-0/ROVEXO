export type AppearanceMode = "light" | "dark" | "system";

export type AppSettings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
  vacationMode: boolean;
  localeCode: string;
  appearanceMode: AppearanceMode;
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
};

export type AppSettingsPatch = Partial<AppSettings>;
