"use client";

import { useEffect, useState } from "react";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AppearancePicker } from "@/features/settings/components/AppearancePicker";
import { syncThemeFromSettings } from "@/lib/settings/theme";
import type { AppSettings } from "@/lib/settings/types";

export function AccountAppearancePage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/settings");
      const payload = (await response.json()) as { settings: AppSettings };
      if (!cancelled) setSettings(payload.settings);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (appearanceMode: AppSettings["appearanceMode"]) => {
    setMessage(null);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appearanceMode }),
    });
    if (response.ok) {
      const payload = (await response.json()) as { settings: AppSettings };
      setSettings(payload.settings);
      syncThemeFromSettings(payload.settings);
      setMessage("Appearance updated.");
    } else {
      setMessage("Unable to update appearance.");
    }
  };

  return (
    <AccountPageShell
      title="Appearance"
      subtitle="Choose light, dark, or match your system."
      backHref="/account/settings"
      backLabel="Settings"
    >
      <section className="premium-card p-ds-5">
        {settings ? (
          <AppearancePicker
            value={settings.appearanceMode}
            onChange={(appearanceMode) => void save(appearanceMode)}
          />
        ) : (
          <p className="text-sm text-text-secondary">Loading…</p>
        )}
        {message ? <p className="mt-ds-3 text-sm text-text-secondary">{message}</p> : null}
      </section>
    </AccountPageShell>
  );
}
