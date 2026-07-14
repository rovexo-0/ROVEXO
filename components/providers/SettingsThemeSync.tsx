"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { AppSettings } from "@/lib/settings/types";

type SettingsThemeSyncProps = {
  /** Optional server-provided settings. When omitted, reconciles via GET /api/settings. */
  settings?: AppSettings | null;
};

/** Reconcile the Theme Engine with the account's stored appearance on load. */
export function SettingsThemeSync({ settings = null }: SettingsThemeSyncProps) {
  const { theme, syncTheme } = useTheme();
  const reconciled = useRef(false);

  useEffect(() => {
    if (settings) {
      syncTheme(settings.appearanceMode);
      return;
    }

    if (reconciled.current) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { settings: AppSettings };
        reconciled.current = true;
        if (payload.settings.appearanceMode !== theme) {
          syncTheme(payload.settings.appearanceMode);
        }
      } catch {
        /* signed-out / offline — keep local preference */
      }
    })();

    return () => {
      cancelled = true;
    };
    // One-shot reconcile on mount when settings are not server-provided.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, syncTheme]);

  return null;
}
