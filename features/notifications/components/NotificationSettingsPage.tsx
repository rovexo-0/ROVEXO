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

import type { NotificationSettings } from "@/lib/notifications/types";



function SettingsDivider() {

  return <div className="border-t border-border" />;

}



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

      <BetaAppShell showBottomNav={false}>

        <div className="px-ds-4 py-ds-8 text-sm text-text-secondary">Loading settings…</div>

      </BetaAppShell>

    );

  }



  const pushDisabled = !settings.pushEnabled;



  return (

    <BetaAppShell showBottomNav={false}>

      <header className="rx-page-header sticky top-0 z-50">

        <div

          className={cn(

            "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",

            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",

          )}

        >

          <IconButton href="/account/settings" label="Back to settings" variant="ghost" size="md">

            <BackIcon className="h-5 w-5" />

          </IconButton>

          <h1 className="truncate text-center text-lg font-semibold text-text-primary">

            Notifications

          </h1>

          <span aria-hidden className="w-12" />

        </div>

      </header>



      <HubPageMain withBottomNav={false} className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 ">

        {saving && (

          <p className="sr-only" aria-live="polite">

            Saving settings

          </p>

        )}



        <SettingSection title="Notification Preferences">

          <SettingToggle

            id="pref-messages"

            label="Messages"

            checked={settings.messages}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ messages: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-orders"

            label="Orders"

            checked={settings.orders}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ orders: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-wallet"

            label="Wallet"

            checked={settings.system}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ system: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-offers"

            label="New Offers"

            checked={settings.offers}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ offers: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-saved-sold"

            label="Saved Item Sold"

            checked={settings.promotions}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ promotions: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-followed-listing"

            label="Followed Seller New Listing"

            checked={settings.marketing}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ marketing: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-followers"

            label="Followers"

            checked={settings.marketing}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ marketing: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="pref-reviews"

            label="Reviews"

            checked={settings.reviews}

            disabled={pushDisabled}

            onChange={(checked) => void updateSetting({ reviews: checked })}

          />

          <SettingsDivider />

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

          <SettingsDivider />

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

          <SettingsDivider />

          <SettingToggle

            id="email-orders"

            label="Orders"

            checked={settings.emailOrders}

            onChange={(checked) => void updateSetting({ emailOrders: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="email-wallet"

            label="Wallet"

            checked={settings.emailPromotions}

            onChange={(checked) => void updateSetting({ emailPromotions: checked })}

          />

          <SettingsDivider />

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

          <div className="grid grid-cols-2 gap-ds-3 border-t border-border px-ds-4 py-ds-3">

            <label className="flex flex-col gap-ds-2">

              <span className="text-xs font-medium text-text-secondary">Start</span>

              <input

                type="time"

                value={settings.quietHoursStart}

                onChange={(event) => void updateSetting({ quietHoursStart: event.target.value })}

                className={cn(

                  "rx-input min-h-ds-7 px-ds-3 py-ds-2 text-sm text-text-primary",

                  focusRing,

                )}

              />

            </label>

            <label className="flex flex-col gap-ds-2">

              <span className="text-xs font-medium text-text-secondary">End</span>

              <input

                type="time"

                value={settings.quietHoursEnd}

                onChange={(event) => void updateSetting({ quietHoursEnd: event.target.value })}

                className={cn(

                  "rx-input min-h-ds-7 px-ds-3 py-ds-2 text-sm text-text-primary",

                  focusRing,

                )}

              />

            </label>

          </div>

        </SettingSection>



        <SettingSection title="Alerts">

          <SettingToggle

            id="alert-sound"

            label="Sound"

            checked={settings.sound}

            onChange={(checked) => void updateSetting({ sound: checked })}

          />

          <SettingsDivider />

          <SettingToggle

            id="alert-vibration"

            label="Vibration"

            checked={settings.vibration}

            onChange={(checked) => void updateSetting({ vibration: checked })}

          />

        </SettingSection>



        <p className="text-center text-xs text-text-muted">

          Control which updates reach you by push and email.

        </p>



        <Link href="/account/settings" className="text-center text-sm font-medium text-primary">

          All Settings

        </Link>

      </HubPageMain>

    </BetaAppShell>

  );

}

