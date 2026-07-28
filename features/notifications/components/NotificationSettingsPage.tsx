"use client";

import { CanonicalInfoBlock } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
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
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications/settings")
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload: { settings: NotificationSettings }) => setSettings(payload.settings))
      .catch(() => setLoadFailed(true));
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

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="notifications" title="Notifications" backHref="/account/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  if (!settings) {
    return (
      <MyAccountTemplate surface="notifications" title="Notifications" backHref="/account/settings" showHeaderTitle>
        <CanonicalInfoBlock variant="description">Loading settings…</CanonicalInfoBlock>
      </MyAccountTemplate>
    );
  }

  const pushOff = !settings.pushEnabled;

  return (
    <MyAccountTemplate surface="notifications" title="Notifications" backHref="/account/settings" showHeaderTitle>
      <div className="settings-subpage-v1" data-settings-notifications="v1.0">
        {saving ? (
          <p className="sr-only" aria-live="polite">
            Saving settings
          </p>
        ) : null}

        <SettingSection title="Notifications">
          {NOTIFICATION_USER_CONTROLS.map((control) => (
            <SettingToggle
              key={control.id}
              id={`notif-control-${control.id}`}
              label={control.label}
              description={control.description}
              checked={readUserControl(settings, control.id)}
              disabled={
                (pushOff && control.id !== "push" && control.id !== "email") || saving
              }
              onChange={(checked) => void updateControl(control.id, checked)}
            />
          ))}
        </SettingSection>
      </div>
    </MyAccountTemplate>
  );
}
