"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import { MobilePremiumSection } from "@/features/mobile-ui";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
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
        <div className="mhub-card mhub-toggle-card px-ds-3 py-ds-2">
          <SettingToggle
            id="settings-dark-mobile"
            label="Dark mode"
            description="Toggle dark theme"
            checked={settings.darkMode}
            onChange={(checked) => onUpdate({ darkMode: checked })}
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
