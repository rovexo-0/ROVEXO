"use client";

import { useEffect, useState, useTransition } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { signOut } from "@/lib/auth/actions";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingsProfileCard } from "@/features/settings/components/SettingsProfileCard";
import { ProfileMenuRow } from "@/features/profile/components/ProfileMenuRow";
import {
  ListingsIcon,
  NotificationsMenuIcon,
  OrdersMenuIcon,
  SignOutIcon,
  WalletMenuIcon,
} from "@/features/profile/icons";
import {
  AccountIcon,
  BlockedIcon,
  CurrencyIcon,
  LanguageIcon,
  LockIcon,
  PaymentIcon,
  PrivacyIcon,
  ShippingIcon,
  StripeIcon,
  TermsIcon,
  TwoFactorIcon,
} from "@/features/settings/icons";
import { BETA_VERSION } from "@/lib/beta/roadmap";
import { applyTheme } from "@/lib/settings/theme";
import type { AppSettings } from "@/lib/settings/types";
import type { UserProfile } from "@/lib/profile/types";

type SettingsPageProps = {
  profile: UserProfile;
};

function SettingsDivider() {
  return <div className="border-t border-border" />;
}

export function SettingsPage({ profile }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutPending, startLogoutTransition] = useTransition();

  useEffect(() => {
    void fetch("/api/settings")
      .then((response) => response.json())
      .then((payload: { settings: AppSettings }) => {
        setSettings(payload.settings);
        applyTheme(payload.settings.darkMode);
      });
  }, []);

  const updateSetting = async (patch: Partial<AppSettings>) => {
    if (!settings) return;

    setSaving(true);
    const next = { ...settings, ...patch };
    setSettings(next);

    if (patch.darkMode != null) {
      applyTheme(patch.darkMode);
    }

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (response.ok) {
      const payload = (await response.json()) as { settings: AppSettings };
      setSettings(payload.settings);
    }

    setSaving(false);
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      setLogoutOpen(false);
      await signOut();
    });
  };

  if (!settings) {
    return (
      <BetaAppShell showBottomNav={false}>
        <SettingsHeader profile={profile} />
        <div className="px-ds-4 py-ds-8 text-sm text-text-secondary">Loading settings…</div>
      </BetaAppShell>
    );
  }

  const businessSettingsHref =
    profile.accountType === "business" ? "/business/dashboard" : "/seller/dashboard";

  return (
    <BetaAppShell showBottomNav={false}>
      <SettingsHeader profile={profile} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {saving && (
          <p className="sr-only" aria-live="polite">
            Saving settings
          </p>
        )}

        <SettingsProfileCard profile={profile} />

        <SettingSection title="Account">
          <ProfileMenuRow
            title="Personal Information"
            href="/account"
            icon={<AccountIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow title="Addresses" icon={<AccountIcon className="h-5 w-5" />} />
          <SettingsDivider />
          <ProfileMenuRow title="Payment Methods" icon={<PaymentIcon className="h-5 w-5" />} />
        </SettingSection>

        <SettingSection title="Notifications">
          <ProfileMenuRow
            title="Notification Settings"
            subtitle="Push, email, and saved search alerts"
            href="/notifications/settings"
            icon={<NotificationsMenuIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <SettingToggle
            id="settings-push-notifications"
            label="Push Notifications"
            checked={settings.pushNotifications}
            onChange={(checked) => void updateSetting({ pushNotifications: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="settings-email-notifications"
            label="Email Notifications"
            checked={settings.emailNotifications}
            onChange={(checked) => void updateSetting({ emailNotifications: checked })}
          />
        </SettingSection>

        <SettingSection title="Appearance">
          <SettingToggle
            id="settings-dark-mode"
            label="Dark Mode"
            checked={settings.darkMode}
            onChange={(checked) => void updateSetting({ darkMode: checked })}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Language"
            subtitle={settings.language}
            icon={<LanguageIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Currency"
            subtitle={settings.currency}
            icon={<CurrencyIcon className="h-5 w-5" />}
          />
        </SettingSection>

        <SettingSection title="Privacy & Security">
          <ProfileMenuRow title="Change Password" icon={<LockIcon className="h-5 w-5" />} />
          <SettingsDivider />
          <ProfileMenuRow
            title="Two-Factor Authentication"
            icon={<TwoFactorIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow title="Blocked Users" icon={<BlockedIcon className="h-5 w-5" />} />
        </SettingSection>

        <SettingSection title="Payments">
          <ProfileMenuRow title="Stripe" icon={<StripeIcon className="h-5 w-5" />} />
          <SettingsDivider />
          {profile.isSeller && (
            <>
              <ProfileMenuRow
                title="Wallet"
                href="/seller/wallet"
                icon={<WalletMenuIcon className="h-5 w-5" />}
              />
              <SettingsDivider />
            </>
          )}
          <ProfileMenuRow title="Transaction History" icon={<OrdersMenuIcon className="h-5 w-5" />} />
        </SettingSection>

        {profile.isSeller && (
          <SettingSection title="Selling">
            <ProfileMenuRow title="Shipping Settings" icon={<ShippingIcon className="h-5 w-5" />} />
            <SettingsDivider />
            <SettingToggle
              id="settings-vacation-mode"
              label="Vacation Mode"
              description="Pause new orders while you are away"
              checked={settings.vacationMode}
              onChange={(checked) => void updateSetting({ vacationMode: checked })}
            />
            <SettingsDivider />
            <ProfileMenuRow
              title="Business Settings"
              href={businessSettingsHref}
              icon={<ListingsIcon className="h-5 w-5" />}
            />
          </SettingSection>
        )}

        <SettingSection title="About">
          <ProfileMenuRow
            title="Terms of Service"
            href="/help/terms-of-service"
            icon={<TermsIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Privacy Policy"
            href="/help/privacy-policy"
            icon={<PrivacyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center justify-between px-ds-4 py-ds-3">
            <span className="text-sm font-medium text-text-primary">App Version</span>
            <span className="text-sm text-text-secondary">{BETA_VERSION}</span>
          </div>
        </SettingSection>

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className={cn(
            "flex min-h-ds-7 w-full items-center justify-center gap-ds-2 rounded-ds-lg border border-border bg-surface px-ds-4 py-ds-4 text-base font-semibold text-danger shadow-ds-soft",
            transitionFast,
            focusRing,
          )}
        >
          <SignOutIcon className="h-5 w-5" />
          Log Out
        </button>
      </main>
      <HelpPageFooter pathname="/settings" />

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You will need to sign in again to access your account, orders, and messages."
        confirmLabel={logoutPending ? "Logging out…" : "Log Out"}
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </BetaAppShell>
  );
}
