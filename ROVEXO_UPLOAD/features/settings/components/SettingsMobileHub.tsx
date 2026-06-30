"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import { MobilePremiumSection, MobilePremiumGrid } from "@/features/mobile-ui";
import { MobilePremiumCard } from "@/features/mobile-ui";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import { resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import { SignOutIcon } from "@/features/profile/icons";
import type { UserProfile } from "@/lib/profile/types";
import type { AppSettings } from "@/lib/settings/types";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type SettingsMobileHubProps = {
  profile: UserProfile;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onLogout: () => void;
  onDelete: () => void;
};

function SettingsToggles({
  settings,
  onUpdate,
  showVacation,
}: {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  showVacation: boolean;
}) {
  return (
    <MobilePremiumSection id="mhub-preferences" title="Preferences">
      <div className="flex flex-col gap-ds-2">
        <div className="mhub-card mhub-toggle-card px-ds-3 py-ds-2">
          <SettingToggle
            id="settings-push-mobile"
            label="Push notifications"
            checked={settings.pushNotifications}
            onChange={(checked) => onUpdate({ pushNotifications: checked })}
          />
        </div>
        <div className="mhub-card mhub-toggle-card px-ds-3 py-ds-2">
          <SettingToggle
            id="settings-email-mobile"
            label="Email notifications"
            checked={settings.emailNotifications}
            onChange={(checked) => onUpdate({ emailNotifications: checked })}
          />
        </div>
        {showVacation ? (
          <div className="mhub-card mhub-toggle-card px-ds-3 py-ds-2">
            <SettingToggle
              id="settings-vacation-mobile"
              label="Vacation mode"
              description="Pause new orders"
              checked={settings.vacationMode}
              onChange={(checked) => onUpdate({ vacationMode: checked })}
            />
          </div>
        ) : null}
      </div>
    </MobilePremiumSection>
  );
}

export function SettingsMobileHub({
  profile,
  settings,
  onUpdate,
  onLogout,
  onDelete,
}: SettingsMobileHubProps) {
  return (
    <div className="flex flex-col gap-ds-4">
      <MobilePremiumSection id="mhub-account-tools" title="Account">
        <MobilePremiumGrid>
          <MobilePremiumCard href="/account/profile" label="Edit profile" subtitle="Name, avatar, phone" iconType={resolveDashboardIconType("/account/profile")} />
          <MobilePremiumCard href="/account/addresses" label="Addresses" subtitle="Personal & business" iconType={resolveDashboardIconType("/account/addresses")} />
          <MobilePremiumCard href="/account/payment-methods" label="Payment methods" subtitle="Cards & payouts" iconType={resolveDashboardIconType("/account/payment-methods")} />
          <MobilePremiumCard href="/account/security" label="Security" subtitle="Password & 2FA" iconType={resolveDashboardIconType("/account/security")} />
          <MobilePremiumCard href="/account/privacy" label="Privacy" subtitle="Visibility & marketing" iconType={resolveDashboardIconType("/account/privacy")} />
          <MobilePremiumCard href="/account/buyer/preferences" label="Buyer preferences" subtitle="Alerts & recommendations" iconType={resolveDashboardIconType("/account/buyer/preferences")} />
          {profile.isSeller ? (
            <MobilePremiumCard href="/account/seller/shipping" label="Shipping settings" subtitle="Handling & carriers" iconType={resolveDashboardIconType("/account/seller/shipping")} />
          ) : null}
          <MobilePremiumCard href="/notifications/settings" label="Notifications" subtitle="Push & email" iconType={resolveDashboardIconType("/notifications/settings")} />
        </MobilePremiumGrid>
      </MobilePremiumSection>
      <MobilePremiumSection id="mhub-preferences-links" title="Language & region">
        <MobilePremiumGrid>
          <MobilePremiumCard href="/account/preferences/language" label="Language" subtitle={settings.language} iconType={resolveDashboardIconType("/account/preferences/language")} />
          <MobilePremiumCard href="/account/preferences/appearance" label="Appearance" subtitle={settings.appearanceMode} iconType={resolveDashboardIconType("/account/preferences/appearance")} />
          <MobilePremiumCard href="/account/preferences/timezone" label="Timezone" subtitle={settings.timezone} iconType={resolveDashboardIconType("/account/preferences/timezone")} />
          <MobilePremiumCard href="/account/preferences/currency" label="Currency" subtitle={settings.currency} iconType={resolveDashboardIconType("/account/preferences/currency")} />
        </MobilePremiumGrid>
      </MobilePremiumSection>
      <MobileHubNavigator profile={profile} sectionTitle="Explore ROVEXO" />
      <SettingsToggles
        settings={settings}
        onUpdate={onUpdate}
        showVacation={profile.isSeller}
      />
      <div className="flex flex-col gap-ds-3">
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "mhub-card min-h-[48px] items-center justify-center text-center text-sm font-semibold text-danger",
            transitionFast,
            focusRing,
          )}
        >
          Delete account
        </button>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "mhub-card flex min-h-[48px] flex-row items-center justify-center gap-ds-2 text-sm font-semibold text-danger",
            transitionFast,
            focusRing,
          )}
        >
          <SignOutIcon className="h-5 w-5" />
          Log out
        </button>
      </div>
    </div>
  );
}
