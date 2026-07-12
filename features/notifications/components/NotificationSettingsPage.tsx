"use client";

import { CanonicalInfoBlock, CanonicalInput, CanonicalMenuRow } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
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

  if (!settings) {
    return (
      <AccountCanonicalShell title="Notifications" backHref="/account/settings">
        <CanonicalInfoBlock variant="description">Loading settings…</CanonicalInfoBlock>
      </AccountCanonicalShell>
    );
  }

  const pushDisabled = !settings.pushEnabled;

  return (
    <AccountCanonicalShell title="Notifications" backHref="/account/settings">
      {saving ? (
        <p className="sr-only" aria-live="polite">
          Saving settings
        </p>
      ) : null}

      <SettingSection title="Notification Preferences">
        <SettingToggle
          id="pref-messages"
          label="Messages"
          checked={settings.messages}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ messages: checked })}
        />
        <SettingToggle
          id="pref-orders"
          label="Orders"
          checked={settings.orders}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ orders: checked })}
        />
        <SettingToggle
          id="pref-wallet"
          label="Wallet"
          checked={settings.system}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ system: checked })}
        />
        <SettingToggle
          id="pref-offers"
          label="New Offers"
          checked={settings.offers}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ offers: checked })}
        />
        <SettingToggle
          id="pref-saved-sold"
          label="Saved Item Sold"
          checked={settings.promotions}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ promotions: checked })}
        />
        <SettingToggle
          id="pref-followed-listing"
          label="Followed Seller New Listing"
          checked={settings.marketing}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ marketing: checked })}
        />
        <SettingToggle
          id="pref-followers"
          label="Followers"
          checked={settings.marketing}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ marketing: checked })}
        />
        <SettingToggle
          id="pref-reviews"
          label="Reviews"
          checked={settings.reviews}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ reviews: checked })}
        />
        <SettingToggle
          id="pref-platform"
          label="Platform Updates"
          checked={settings.system}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ system: checked })}
        />
      </SettingSection>

      <SettingSection title="Push Notifications">
        <SettingToggle
          id="push-enabled"
          label="Push Notifications"
          checked={settings.pushEnabled}
          onChange={(checked) => void updateSetting({ pushEnabled: checked })}
        />
        <SettingToggle
          id="browser-push"
          label="Browser push"
          description="Receive push notifications in this browser"
          checked={settings.browserPush}
          disabled={pushDisabled}
          onChange={(checked) => void updateSetting({ browserPush: checked })}
        />
      </SettingSection>

      <SettingSection title="Email Notifications">
        <SettingToggle
          id="email-messages"
          label="Messages"
          checked={settings.emailMessages}
          onChange={(checked) => void updateSetting({ emailMessages: checked })}
        />
        <SettingToggle
          id="email-orders"
          label="Orders"
          checked={settings.emailOrders}
          onChange={(checked) => void updateSetting({ emailOrders: checked })}
        />
        <SettingToggle
          id="email-wallet"
          label="Wallet"
          checked={settings.emailPromotions}
          onChange={(checked) => void updateSetting({ emailPromotions: checked })}
        />
        <SettingToggle
          id="email-platform"
          label="Platform Updates"
          checked={settings.emailMarketing}
          onChange={(checked) => void updateSetting({ emailMarketing: checked })}
        />
      </SettingSection>

      <SettingSection title="Quiet Hours">
        <SettingToggle
          id="quiet-hours-enabled"
          label="Quiet Hours"
          description={`${settings.quietHoursStart} – ${settings.quietHoursEnd}`}
          checked={settings.quietHoursEnabled}
          onChange={(checked) => void updateSetting({ quietHoursEnabled: checked })}
        />
        <div className="grid grid-cols-2 gap-ds-3 px-[var(--cds-row-padding-x)] py-ds-3">
          <CanonicalInput
            id="quiet-hours-start"
            label="Start"
            inputType="time"
            value={settings.quietHoursStart}
            onChange={(event) => void updateSetting({ quietHoursStart: event.target.value })}
          />
          <CanonicalInput
            id="quiet-hours-end"
            label="End"
            inputType="time"
            value={settings.quietHoursEnd}
            onChange={(event) => void updateSetting({ quietHoursEnd: event.target.value })}
          />
        </div>
      </SettingSection>

      <SettingSection title="Alerts">
        <SettingToggle
          id="alert-sound"
          label="Sound"
          checked={settings.sound}
          onChange={(checked) => void updateSetting({ sound: checked })}
        />
        <SettingToggle
          id="alert-vibration"
          label="Vibration"
          checked={settings.vibration}
          onChange={(checked) => void updateSetting({ vibration: checked })}
        />
      </SettingSection>

      <CanonicalInfoBlock variant="description">
        Control which updates reach you by push and email.
      </CanonicalInfoBlock>

      <CanonicalMenuRow title="All Settings" href="/account/settings" />
    </AccountCanonicalShell>
  );
}
