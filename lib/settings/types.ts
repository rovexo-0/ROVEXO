export type AppSettings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
  vacationMode: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotifications: true,
  emailNotifications: true,
  darkMode: false,
  language: "English",
  currency: "EUR (€)",
  vacationMode: false,
};

export type AppSettingsPatch = Partial<AppSettings>;
