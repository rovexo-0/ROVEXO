"use client";

import { CanonicalInfoBlock, CanonicalMenuRow } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import type { NotificationPreferences } from "@/lib/notifications/types";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orders: true,
  messages: true,
  payments: true,
  support: true,
  marketing: false,
  security: true,
  business: true,
  ai: true,
};

export function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications/preferences")
      .then((response) => response.json())
      .then((payload: { preferences: NotificationPreferences }) => {
        setPreferences(payload.preferences);
        setLoaded(true);
      });
  }, []);

  const updatePreference = async (patch: Partial<NotificationPreferences>) => {
    setSaving(true);
    const response = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (response.ok) {
      const payload = (await response.json()) as { preferences: NotificationPreferences };
      setPreferences(payload.preferences);
    } else {
      setPreferences((current) => ({ ...current, ...patch }));
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <AccountCanonicalShell title="Notification preferences" backHref="/notifications/settings">
        <CanonicalInfoBlock variant="description">Loading preferences…</CanonicalInfoBlock>
      </AccountCanonicalShell>
    );
  }

  return (
    <AccountCanonicalShell title="Notification preferences" backHref="/notifications/settings">
      {saving ? (
        <p className="sr-only" aria-live="polite">
          Saving preferences
        </p>
      ) : null}

      <SettingSection title="In-app notifications">
        <SettingToggle
          id="pref-orders"
          label="Orders"
          description="Order updates, shipping, and delivery"
          checked={preferences.orders}
          onChange={(checked) => void updatePreference({ orders: checked })}
        />
        <SettingToggle
          id="pref-messages"
          label="Messages"
          description="Buyer and seller conversations"
          checked={preferences.messages}
          onChange={(checked) => void updatePreference({ messages: checked })}
        />
        <SettingToggle
          id="pref-payments"
          label="Payments"
          description="Payments, refunds, and payouts"
          checked={preferences.payments}
          onChange={(checked) => void updatePreference({ payments: checked })}
        />
        <SettingToggle
          id="pref-support"
          label="Support"
          description="Support replies and case updates"
          checked={preferences.support}
          onChange={(checked) => void updatePreference({ support: checked })}
        />
        <SettingToggle
          id="pref-marketing"
          label="Marketing"
          description="Promotions and announcements"
          checked={preferences.marketing}
          onChange={(checked) => void updatePreference({ marketing: checked })}
        />
        <SettingToggle
          id="pref-security"
          label="Security"
          description="Trust, verification, and account security"
          checked={preferences.security}
          onChange={(checked) => void updatePreference({ security: checked })}
        />
        <SettingToggle
          id="pref-business"
          label="Business"
          description="Wholesale leads and B2B activity"
          checked={preferences.business}
          onChange={(checked) => void updatePreference({ business: checked })}
        />
        <SettingToggle
          id="pref-ai"
          label="AI"
          description="Saved search matches and assistant alerts"
          checked={preferences.ai}
          onChange={(checked) => void updatePreference({ ai: checked })}
        />
      </SettingSection>

      <CanonicalMenuRow
        title="Push & email settings"
        description="Advanced delivery options"
        href="/notifications/settings"
      />
    </AccountCanonicalShell>
  );
}
