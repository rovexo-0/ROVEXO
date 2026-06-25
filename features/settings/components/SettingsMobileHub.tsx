"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import { MobilePremiumSection, MobilePremiumGrid } from "@/features/mobile-ui";
import { MobilePremiumCard } from "@/features/mobile-ui";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import { getNavLinkIcon } from "@/lib/navigation/link-icons";
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
          <MobilePremiumCard href="/account/edit" label="Edit profile" subtitle="Name, avatar, phone" icon={getNavLinkIcon("/account")} />
          <MobilePremiumCard href="/account/addresses" label="Addresses" subtitle="Personal & business" icon={getNavLinkIcon("/orders")} />
          <MobilePremiumCard href="/account/payment-methods" label="Payment methods" subtitle="Cards & payouts" icon={getNavLinkIcon("/plans")} />
          <MobilePremiumCard href="/account/security" label="Security" subtitle="Password & 2FA" icon={getNavLinkIcon("/account")} />
          <MobilePremiumCard href="/account/privacy" label="Privacy" subtitle="Visibility & marketing" icon={getNavLinkIcon("/account")} />
          <MobilePremiumCard href="/account/buyer/preferences" label="Buyer preferences" subtitle="Alerts & recommendations" icon={getNavLinkIcon("/account")} />
          {profile.isSeller ? (
            <MobilePremiumCard href="/account/seller/shipping" label="Shipping settings" subtitle="Handling & carriers" icon={getNavLinkIcon("/seller/dashboard")} />
          ) : null}
          <MobilePremiumCard href="/notifications/settings" label="Notifications" subtitle="Push & email" icon={getNavLinkIcon("/notifications")} />
        </MobilePremiumGrid>
      </MobilePremiumSection>
      <MobilePremiumSection id="mhub-preferences-links" title="Language & region">
        <MobilePremiumGrid>
          <MobilePremiumCard href="/account/preferences/language" label="Language" subtitle={settings.language} icon={getNavLinkIcon("/settings")} />
          <MobilePremiumCard href="/account/preferences/appearance" label="Appearance" subtitle={settings.appearanceMode} icon={getNavLinkIcon("/settings")} />
          <MobilePremiumCard href="/account/preferences/timezone" label="Timezone" subtitle={settings.timezone} icon={getNavLinkIcon("/settings")} />
          <MobilePremiumCard href="/account/preferences/currency" label="Currency" subtitle={settings.currency} icon={getNavLinkIcon("/settings")} />
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
