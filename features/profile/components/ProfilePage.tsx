import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { IconButton } from "@/components/ui/IconButton";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfileMenu } from "@/features/profile/components/ProfileMenu";
import { ProfileSignOutButton } from "@/features/profile/components/ProfileSignOutButton";
import { SellerOverviewCards } from "@/features/profile/components/SellerOverviewCards";
import { SettingsIcon } from "@/features/profile/icons";
import type { UserProfile } from "@/lib/profile/types";

type ProfilePageProps = {
  profile: UserProfile;
};

export function ProfilePage({ profile }: ProfilePageProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 shadow-ds-soft backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between gap-ds-3 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <h1 className="min-w-0 truncate text-2xl font-bold text-text-primary">My Profile</h1>
          <IconButton href="/settings" label="Settings" variant="ghost" size="md">
            <SettingsIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <ProfileHero profile={profile} />

        {profile.isSeller && profile.sellerStats && (
          <SellerOverviewCards stats={profile.sellerStats} />
        )}

        <ProfileMenu profile={profile} />

        <ProfileSignOutButton />
      </main>
    </BetaAppShell>
  );
}
