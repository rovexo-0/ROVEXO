"use client";

import { useEffect, useState, useTransition } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { signOut } from "@/lib/auth/actions";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingsLoadingSkeleton } from "@/features/settings/components/SettingsLoadingSkeleton";
import { SettingsProfileCard } from "@/features/settings/components/SettingsProfileCard";
import { SettingsMobileHub } from "@/features/settings/components/SettingsMobileHub";
import { ResponsiveShell } from "@/features/mobile-ui";
import { ProfileMenuRow } from "@/features/profile/components/ProfileMenuRow";
import {
  ListingsIcon,
  NotificationsMenuIcon,
  OrdersMenuIcon,
  SignOutIcon,
} from "@/features/profile/icons";
import {
  AccountIcon,
  BlockedIcon,
  CurrencyIcon,
  LockIcon,
  PaymentIcon,
  PrivacyIcon,
  ShippingIcon,
  StripeIcon,
  TermsIcon,
  TwoFactorIcon,
} from "@/features/settings/icons";
import { BETA_VERSION } from "@/lib/beta/roadmap";
import { syncThemeFromSettings } from "@/lib/settings/theme";
import { SettingsThemeSync } from "@/components/providers/SettingsThemeSync";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [logoutPending, startLogoutTransition] = useTransition();

  useEffect(() => {
    void fetch("/api/settings")
      .then((response) => response.json())
      .then((payload: { settings: AppSettings }) => {
        setSettings(payload.settings);
        syncThemeFromSettings(payload.settings);
      });
  }, []);

  const updateSetting = async (patch: Partial<AppSettings>) => {
    if (!settings) return;

    setSaving(true);
    const next = { ...settings, ...patch };
    setSettings(next);

    if (patch.appearanceMode != null) {
      syncThemeFromSettings({ ...next, appearanceMode: patch.appearanceMode });
    } else if (patch.darkMode != null) {
      syncThemeFromSettings({ ...next, darkMode: patch.darkMode });
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
        <SettingsLoadingSkeleton />
      </BetaAppShell>
    );
  }

  const businessSettingsHref =
    profile.accountType === "business" ? "/business/dashboard" : "/seller";

  return (
    <BetaAppShell showBottomNav={false}>
      <SettingsThemeSync settings={settings} />
      <SettingsHeader profile={profile} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {saving && (
          <p className="sr-only" aria-live="polite">
            Saving settings
          </p>
        )}

        <ResponsiveShell
          mobile={
            <SettingsMobileHub
              profile={profile}
              settings={settings}
              onUpdate={(patch) => void updateSetting(patch)}
              onLogout={() => setLogoutOpen(true)}
              onDelete={() => setDeleteOpen(true)}
            />
          }
          desktop={
            <>
        <SettingsProfileCard profile={profile} />

        <SettingSection title="Profile">
          <ProfileMenuRow
            title="Personal information"
            subtitle="Name, username, avatar"
            href="/account/profile"
            icon={<AccountIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Email"
            subtitle={profile.email}
            href="/account/profile"
            icon={<AccountIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Addresses"
            subtitle="Shipping and billing"
            href="/account/addresses"
            icon={<ShippingIcon className="h-5 w-5" />}
          />
        </SettingSection>

        <SettingSection title="Security">
          <ProfileMenuRow
            title="Password & security"
            subtitle="Password, two-factor, blocked users"
            href="/account/security"
            icon={<LockIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Two-factor authentication"
            subtitle="Extra protection for your account"
            href="/account/security"
            icon={<TwoFactorIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Blocked users"
            subtitle="Manage blocked accounts"
            href="/account/blocked-users"
            icon={<BlockedIcon className="h-5 w-5" />}
          />
        </SettingSection>

        <SettingSection title="Notifications">
          <ProfileMenuRow
            title="Notification settings"
            subtitle="Push, email, and saved search alerts"
            href="/notifications/settings"
            icon={<NotificationsMenuIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <SettingToggle
            id="settings-push-notifications"
            label="Push notifications"
            checked={settings.pushNotifications}
            onChange={(checked) => void updateSetting({ pushNotifications: checked })}
          />
          <SettingsDivider />
          <SettingToggle
            id="settings-email-notifications"
            label="Email notifications"
            checked={settings.emailNotifications}
            onChange={(checked) => void updateSetting({ emailNotifications: checked })}
          />
        </SettingSection>

        <SettingSection title="Privacy">
          <ProfileMenuRow
            title="Privacy settings"
            subtitle="Profile visibility and marketing"
            href="/account/privacy"
            icon={<PrivacyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Buyer preferences"
            subtitle="Alerts and recommendations"
            href="/account/buyer/preferences"
            icon={<PrivacyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Privacy policy"
            href="/help/privacy-policy"
            icon={<PrivacyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow title="Trust Centre" href="/trust" icon={<PrivacyIcon className="h-5 w-5" />} />
        </SettingSection>

        <SettingSection title="Preferences">
          <ProfileMenuRow
            title="Language"
            subtitle={settings.language}
            href="/account/preferences/language"
            icon={<CurrencyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Appearance"
            subtitle={settings.appearanceMode}
            href="/account/preferences/appearance"
            icon={<CurrencyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Timezone"
            subtitle={settings.timezone}
            href="/account/preferences/timezone"
            icon={<CurrencyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Currency"
            subtitle={settings.currency}
            href="/account/preferences/currency"
            icon={<CurrencyIcon className="h-5 w-5" />}
          />
        </SettingSection>

        <SettingSection title="Payments">
          <ProfileMenuRow
            title="Payment methods"
            subtitle="Saved cards for checkout"
            href="/account/payment-methods"
            icon={<PaymentIcon className="h-5 w-5" />}
          />
          {profile.isSeller ? (
            <>
              <SettingsDivider />
              <ProfileMenuRow
                title="Stripe Connect"
                subtitle="Seller payouts and bank account"
                href="/seller/wallet"
                icon={<StripeIcon className="h-5 w-5" />}
              />
            </>
          ) : null}
          <SettingsDivider />
          <ProfileMenuRow
            title="Orders"
            subtitle="Transaction history"
            href="/orders"
            icon={<OrdersMenuIcon className="h-5 w-5" />}
          />
        </SettingSection>

        {profile.isSeller && (
          <SettingSection title="Selling">
            <ProfileMenuRow
              title="Shipping settings"
              subtitle="Handling, carriers, and delivery"
              href="/account/seller/shipping"
              icon={<ShippingIcon className="h-5 w-5" />}
            />
            <SettingsDivider />
            <SettingToggle
              id="settings-vacation-mode"
              label="Vacation mode"
              description="Pause new orders while you are away"
              checked={settings.vacationMode}
              onChange={(checked) => void updateSetting({ vacationMode: checked })}
            />
            <SettingsDivider />
            <ProfileMenuRow
              title="Business settings"
              href={businessSettingsHref}
              icon={<ListingsIcon className="h-5 w-5" />}
            />
          </SettingSection>
        )}

        <SettingSection title="About">
          <ProfileMenuRow
            title="Terms of service"
            href="/help/terms-of-service"
            icon={<TermsIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Privacy policy"
            href="/help/privacy-policy"
            icon={<PrivacyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center justify-between px-ds-4 py-ds-3">
            <span className="text-sm font-medium text-text-primary">App version</span>
            <span className="text-sm text-text-secondary">{BETA_VERSION}</span>
          </div>
        </SettingSection>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className={cn(
            "flex min-h-ds-7 w-full items-center justify-center rounded-ds-lg border border-danger/30 bg-danger/5 px-ds-4 py-ds-4 text-base font-semibold text-danger",
            transitionFast,
            focusRing,
          )}
        >
          Delete account
        </button>

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className={cn(
            "rx-btn rx-glass flex min-h-ds-7 w-full items-center justify-center gap-ds-2 border border-danger/30 px-ds-4 py-ds-4 text-base font-semibold text-danger",
            transitionFast,
            focusRing,
          )}
        >
          <SignOutIcon className="h-5 w-5" />
          Log out
        </button>
            </>
          }
        />
      </main>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You will need to sign in again to access your account, orders, and messages."
        confirmLabel={logoutPending ? "Logging out…" : "Log out"}
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete account?"
        description="This permanently closes your ROVEXO account. You will be signed out and will need to contact support to restore access."
        confirmLabel={deletePending ? "Deleting…" : "Delete my account"}
        cancelLabel="Cancel"
        onConfirm={() => {
          setDeleteError(null);
          setDeletePending(true);
          void fetch("/api/account/delete", { method: "POST" })
            .then(async (response) => {
              const payload = (await response.json()) as { error?: string };
              if (!response.ok) {
                setDeleteError(payload.error ?? "Unable to delete account.");
                setDeletePending(false);
                return;
              }
              setDeleteOpen(false);
              window.location.href = "/login";
            })
            .catch(() => {
              setDeleteError("Unable to delete account. Check your connection and try again.");
              setDeletePending(false);
            });
        }}
        onCancel={() => {
          if (!deletePending) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
      />
      {deleteError ? (
        <p className="sr-only" aria-live="polite">
          {deleteError}
        </p>
      ) : null}
    </BetaAppShell>
  );
}
