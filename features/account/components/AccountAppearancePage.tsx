"use client";

import { useEffect, useRef, useState } from "react";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AppearancePicker } from "@/features/settings/components/AppearancePicker";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { AppSettings, AppearanceMode } from "@/lib/settings/types";

export function AccountAppearancePage() {
  const { theme, setTheme, syncTheme } = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const reconciled = useRef(false);

  // Reconcile once with the account's stored appearance (cross-device continuity).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload = (await response.json()) as { settings: AppSettings };
        if (cancelled || reconciled.current) return;
        reconciled.current = true;
        if (payload.settings.appearanceMode !== theme) {
          syncTheme(payload.settings.appearanceMode);
        }
      } catch {
        /* offline / signed-out — keep the local preference */
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once on mount; `theme` is only the initial comparison baseline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (mode: AppearanceMode) => {
    setTheme(mode);
    setMessage("Appearance updated.");
  };

  return (
    <AccountPageShell
      title="Appearance"
      subtitle="Choose light, dark, or match your system."
      backHref="/account/settings"
      backLabel="Settings"
    >
      <section className="rx-surface-card p-ds-5">
        <AppearancePicker value={theme} onChange={handleChange} />
        {message ? <p className="mt-ds-3 text-sm text-text-secondary">{message}</p> : null}
      </section>
    </AccountPageShell>
  );
}
