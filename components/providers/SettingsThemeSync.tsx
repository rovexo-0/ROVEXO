"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { AppSettings } from "@/lib/settings/types";

type SettingsThemeSyncProps = {
  settings: AppSettings | null;
};

/** Reconcile the Theme Engine with the account's stored appearance on load. */
export function SettingsThemeSync({ settings }: SettingsThemeSyncProps) {
  const { syncTheme } = useTheme();

  useEffect(() => {
    if (!settings) return;
    syncTheme(settings.appearanceMode);
  }, [settings, syncTheme]);

  return null;
}
