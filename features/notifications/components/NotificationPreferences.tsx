"use client";

import { CanonicalInfoBlock, CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import { resolveCanonicalSwitchChecked } from "@/lib/master-engine/switch-engine";
import type { NotificationPreferences } from "@/lib/notifications/types";

export function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications/preferences")
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload: { preferences: NotificationPreferences }) => {
        setPreferences(payload.preferences);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const updatePreference = async (patch: Partial<NotificationPreferences>) => {
    if (!preferences) return;
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
      setPreferences((current) => (current ? { ...current, ...patch } : current));
    }
    setSaving(false);
  };

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="notifications" title="Notification preferences" backHref="/notifications/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  if (!preferences) {
    return (
      <MyAccountTemplate surface="notifications" title="Notification preferences" backHref="/notifications/settings" showHeaderTitle>
        <CanonicalInfoBlock variant="description">Loading preferences…</CanonicalInfoBlock>
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="notifications" title="Notification preferences" backHref="/notifications/settings" showHeaderTitle>
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
          checked={resolveCanonicalSwitchChecked(preferences.orders)}
          onChange={(checked) => void updatePreference({ orders: checked })}
        />
        <SettingToggle
          id="pref-messages"
          label="Messages"
          description="Buyer and seller conversations"
          checked={resolveCanonicalSwitchChecked(preferences.messages)}
          onChange={(checked) => void updatePreference({ messages: checked })}
        />
        <SettingToggle
          id="pref-payments"
          label="Payments"
          description="Payments, refunds, and payouts"
          checked={resolveCanonicalSwitchChecked(preferences.payments)}
          onChange={(checked) => void updatePreference({ payments: checked })}
        />
        <SettingToggle
          id="pref-support"
          label="Support"
          description="Support replies and case updates"
          checked={resolveCanonicalSwitchChecked(preferences.support)}
          onChange={(checked) => void updatePreference({ support: checked })}
        />
        <SettingToggle
          id="pref-marketing"
          label="Marketing"
          description="Promotions and announcements"
          checked={resolveCanonicalSwitchChecked(preferences.marketing)}
          onChange={(checked) => void updatePreference({ marketing: checked })}
        />
        <SettingToggle
          id="pref-security"
          label="Security"
          description="Trust, verification, and account security"
          checked={resolveCanonicalSwitchChecked(preferences.security)}
          onChange={(checked) => void updatePreference({ security: checked })}
        />
        <SettingToggle
          id="pref-business"
          label="Business"
          description="Wholesale leads and B2B activity"
          checked={resolveCanonicalSwitchChecked(preferences.business)}
          onChange={(checked) => void updatePreference({ business: checked })}
        />
        <SettingToggle
          id="pref-ai"
          label="AI"
          description="Saved search matches and assistant alerts"
          checked={resolveCanonicalSwitchChecked(preferences.ai)}
          onChange={(checked) => void updatePreference({ ai: checked })}
        />
      </SettingSection>

      <CanonicalSection title="More">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Push & email settings"
            description="Advanced delivery options"
            href="/notifications/settings"
          />
        </CanonicalCard>
      </CanonicalSection>
    </MyAccountTemplate>
  );
}
