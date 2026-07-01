import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Account Settings · ROVEXO",
  description: "Profile, security, privacy, and account preferences.",
};

export default async function AccountSettingsRoute() {
  const profile = await fetchProfile();

  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <AccountCenterModulePage
          moduleId="account"
          profile={profile}
          description="Profile, security, privacy, and preferences."
          showLogout
        />
      </main>
    </BetaAppShell>
  );
}
