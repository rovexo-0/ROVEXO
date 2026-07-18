"use client";

import { CanonicalInfoBlock, CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import {
  NOTIFICATION_USER_CONTROLS,
  patchForUserControl,
  readUserControl,
  type NotificationUserControlId,
} from "@/lib/notifications/controls";
import type { NotificationSettings } from "@/lib/notifications/types";

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications/settings")
      .then((response) => response.json())
      .then((payload: { settings: NotificationSettings }) => setSettings(payload.settings));
  }, []);

  const updateSetting = async (patch: Partial<NotificationSettings>) => {
    if (!settings) return;

    setSaving(true);
    const next = { ...settings, ...patch };

    const response = await fetch("/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (response.ok) {
      const payload = (await response.json()) as { settings: NotificationSettings };
      setSettings(payload.settings);
    } else {
      setSettings(next);
    }

    setSaving(false);
  };

  const updateControl = async (id: NotificationUserControlId, enabled: boolean) => {
    await updateSetting(patchForUserControl(id, enabled));
  };

  if (!settings) {
    return (
      <AccountCanonicalShell title="Notifications" backHref="/account/settings" showHeaderTitle>
        <CanonicalInfoBlock variant="description">Loading settings…</CanonicalInfoBlock>
      </AccountCanonicalShell>
    );
  }

  const pushOff = !settings.pushEnabled;

  return (
    <AccountCanonicalShell title="Notifications" backHref="/account/settings" showHeaderTitle>
      {saving ? (
        <p className="sr-only" aria-live="polite">
          Saving settings
        </p>
      ) : null}

      <SettingSection title="Channels">
        {NOTIFICATION_USER_CONTROLS.filter((control) => control.id === "push" || control.id === "email").map(
          (control) => (
            <SettingToggle
              key={control.id}
              id={`notif-control-${control.id}`}
              label={control.label}
              description={control.description}
              checked={readUserControl(settings, control.id)}
              onChange={(checked) => void updateControl(control.id, checked)}
            />
          ),
        )}
      </SettingSection>

      <SettingSection title="Categories">
        {NOTIFICATION_USER_CONTROLS.filter(
          (control) => control.id !== "push" && control.id !== "email",
        ).map((control) => (
          <SettingToggle
            key={control.id}
            id={`notif-control-${control.id}`}
            label={control.label}
            description={control.description}
            checked={readUserControl(settings, control.id)}
            disabled={pushOff && control.id !== "security"}
            onChange={(checked) => void updateControl(control.id, checked)}
          />
        ))}
      </SettingSection>

      <CanonicalInfoBlock variant="description">
        In-app, push, and email delivery follow these controls. Missing keys fall back safely.
      </CanonicalInfoBlock>

      <CanonicalSection title="More">
        <CanonicalCard variant="list">
          <CanonicalMenuRow title="Notification preferences" href="/notifications/preferences" />
          <CanonicalMenuRow title="All Settings" href="/account/settings" />
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
