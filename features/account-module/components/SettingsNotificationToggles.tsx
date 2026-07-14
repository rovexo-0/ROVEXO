"use client";

import { useEffect, useState } from "react";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import type { SettingsToggleKey } from "@/lib/account-center/settings-menu";
import type { NotificationSettings } from "@/lib/notifications/types";

type SettingsNotificationTogglesProps = {
  rows: Array<{
    id: string;
    title: string;
    toggleKey: SettingsToggleKey;
  }>;
};

export function SettingsNotificationToggles({ rows }: SettingsNotificationTogglesProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications/settings")
      .then((response) => response.json())
      .then((payload: { settings: NotificationSettings }) => setSettings(payload.settings))
      .catch(() => undefined);
  }, []);

  const updateSetting = async (patch: Partial<NotificationSettings>) => {
    if (!settings) return;
    setSaving(true);
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);

    const response = await fetch("/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (response.ok) {
      const payload = (await response.json()) as { settings: NotificationSettings };
      setSettings(payload.settings);
    }

    setSaving(false);
  };

  return (
    <div className="settings-canonical__toggles" aria-busy={saving || !settings}>
      {rows.map((row) => {
        const checked = settings ? Boolean(settings[row.toggleKey]) : false;
        return (
          <SettingToggle
            key={row.id}
            id={`settings-toggle-${row.id}`}
            label={row.title}
            checked={checked}
            disabled={!settings || saving}
            onChange={(next) => void updateSetting({ [row.toggleKey]: next })}
          />
        );
      })}
    </div>
  );
}
