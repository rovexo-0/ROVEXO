"use client";

import { useEffect, useState } from "react";
import { HubPageMain } from "@/components/layout/HubPageMain";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { BackIcon } from "@/features/notifications/icons";
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

function SettingsDivider() {
  return <div className="border-t border-border" />;
}

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
      <BetaAppShell showBottomNav={false}>
        <div className="px-5 py-8 text-sm text-text-secondary">Loading preferences…</div>
      </BetaAppShell>
    );
  }

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="rx-dash-header">
        <div className="rx-dash-header__row">
          <IconButton href="/notifications" label="Back to notifications" variant="ghost" size="md">
            <BackIcon className="h-5 w-5" />
          </IconButton>
          <h1 className="rx-dash-header__title text-center">Notification preferences</h1>
          <span aria-hidden className="w-12" />
        </div>
      </header>

      <HubPageMain withBottomNav={false} className="mx-auto flex w-full max-w-2xl flex-col gap-5 bg-background px-5 py-5 ">
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
          <SettingsDivider />
          <SettingToggle
            id="pref-messages"
            label="Messages"
            description="Buyer and seller conversations"
            checked={preferences.messages}
            onChange={(checked) => void updatePreference({ messages: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="pref-payments"
            label="Payments"
            description="Payments, refunds, and payouts"
            checked={preferences.payments}
            onChange={(checked) => void updatePreference({ payments: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="pref-support"
            label="Support"
            description="Support replies and case updates"
            checked={preferences.support}
            onChange={(checked) => void updatePreference({ support: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="pref-marketing"
            label="Marketing"
            description="Promotions and announcements"
            checked={preferences.marketing}
            onChange={(checked) => void updatePreference({ marketing: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="pref-security"
            label="Security"
            description="Trust, verification, and account security"
            checked={preferences.security}
            onChange={(checked) => void updatePreference({ security: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="pref-business"
            label="Business"
            description="Wholesale leads and B2B activity"
            checked={preferences.business}
            onChange={(checked) => void updatePreference({ business: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="pref-ai"
            label="AI"
            description="Saved search matches and assistant alerts"
            checked={preferences.ai}
            onChange={(checked) => void updatePreference({ ai: checked })}
          />
        </SettingSection>

        <Link
          href="/notifications/settings"
          className={cn("rx-dash-tile flex-row items-center justify-between px-4 py-4", focusRing)}
        >
          <span className="text-sm font-semibold text-text-primary">Push & email settings</span>
          <span className="text-xs text-text-secondary">Advanced delivery options</span>
        </Link>
      </HubPageMain>
    </BetaAppShell>
  );
}
