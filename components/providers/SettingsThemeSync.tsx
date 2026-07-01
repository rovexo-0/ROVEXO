"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { AppSettings } from "@/lib/settings/types";
import { applyAppearanceMode } from "@/lib/settings/theme";

type SettingsThemeSyncProps = {
  settings: AppSettings | null;
};

export function SettingsThemeSync({ settings }: SettingsThemeSyncProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!settings) return;

    if (settings.appearanceMode === "system") {
      setTheme("system");
      applyAppearanceMode("system");
      return;
    }

    const theme = settings.appearanceMode === "dark" || settings.darkMode ? "dark" : "light";
    setTheme(theme);
    applyAppearanceMode(settings.appearanceMode);
  }, [settings, setTheme]);

  return null;
}
