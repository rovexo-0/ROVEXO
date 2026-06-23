"use client";

import { useEffect, useState, useTransition } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { signOut } from "@/lib/auth/actions";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { SettingSection } from "@/features/settings/components/SettingSection";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingsLoadingSkeleton } from "@/features/settings/components/SettingsLoadingSkeleton";
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

function ComingSoonBadge() {
  return (
    <Badge variant="default" className="ml-auto shrink-0 text-[10px] uppercase tracking-wide">
      Soon
    </Badge>
  );
}

export function SettingsPage({ profile }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
        <SettingsLoadingSkeleton />
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

        <SettingSection title="Profile">
          <ProfileMenuRow
            title="Personal information"
            subtitle="Name, username, avatar"
            href="/account"
            icon={<AccountIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow
            title="Email"
            subtitle={profile.email}
            href="/account"
            icon={<AccountIcon className="h-5 w-5" />}
          />
        </SettingSection>

        <SettingSection title="Security">
          <ProfileMenuRow
            title="Password"
            subtitle="Reset via secure email link"
            href="/forgot-password"
            icon={<LockIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <TwoFactorIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Two-factor authentication</p>
              <p className="text-xs text-text-secondary">Extra protection for your account</p>
            </div>
            <ComingSoonBadge />
          </div>
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <BlockedIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Blocked users</p>
            </div>
            <ComingSoonBadge />
          </div>
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
            title="Privacy policy"
            href="/help/privacy-policy"
            icon={<PrivacyIcon className="h-5 w-5" />}
          />
          <SettingsDivider />
          <ProfileMenuRow title="Trust Centre" href="/trust" icon={<PrivacyIcon className="h-5 w-5" />} />
        </SettingSection>

        <SettingSection title="Preferences">
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <LanguageIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Language</p>
              <p className="text-xs text-text-secondary">{settings.language}</p>
            </div>
            <ComingSoonBadge />
          </div>
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <CurrencyIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Currency</p>
              <p className="text-xs text-text-secondary">{settings.currency}</p>
            </div>
            <ComingSoonBadge />
          </div>
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <AccountIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Appearance</p>
              <p className="text-xs text-text-secondary">Themes & display options</p>
            </div>
            <ComingSoonBadge />
          </div>
          <SettingsDivider />
          <SettingToggle
            id="settings-dark-mode"
            label="Dark mode"
            description="Toggle dark theme (beta)"
            checked={settings.darkMode}
            onChange={(checked) => void updateSetting({ darkMode: checked })}
          />
        </SettingSection>

        <SettingSection title="Payments">
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <StripeIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Stripe</p>
            </div>
            <ComingSoonBadge />
          </div>
          <SettingsDivider />
          <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
            <PaymentIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Payment methods</p>
            </div>
            <ComingSoonBadge />
          </div>
          {profile.isSeller && (
            <>
              <SettingsDivider />
              <ProfileMenuRow
                title="Wallet"
                href="/seller/wallet"
                icon={<WalletMenuIcon className="h-5 w-5" />}
              />
            </>
          )}
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
            <div className="flex min-h-ds-7 items-center gap-ds-3 px-ds-4 py-ds-3">
              <ShippingIcon className="h-5 w-5 shrink-0 text-text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">Shipping settings</p>
              </div>
              <ComingSoonBadge />
            </div>
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
            "premium-btn premium-glass flex min-h-ds-7 w-full items-center justify-center gap-ds-2 border border-danger/30 px-ds-4 py-ds-4 text-base font-semibold text-danger",
            transitionFast,
            focusRing,
          )}
        >
          <SignOutIcon className="h-5 w-5" />
          Log out
        </button>
      </main>
      <HelpPageFooter pathname="/settings" />

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
        description="Account deletion is not available in v1.0. Contact support if you need help closing your account."
        confirmLabel="Contact support"
        cancelLabel="Cancel"
        onConfirm={() => {
          setDeleteOpen(false);
          window.location.href = "/support";
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </BetaAppShell>
  );
}
