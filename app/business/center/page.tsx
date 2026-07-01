import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { getProfile } from "@/lib/profile/data";

export const metadata: Metadata = {
  title: "Business · ROVEXO",
  description: "Business dashboard, wholesale, analytics, and B2B tools.",
};

export default async function BusinessCenterRoute() {
  const profile = await getProfile();

  if (profile.accountType !== "business") {
    redirect("/account");
  }

  return (
    <BetaAppShell showBottomNav={false} className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(32px+env(safe-area-inset-bottom))]">
        <AccountCenterModulePage
          moduleId="business"
          profile={profile}
          description="B2B dashboard, wholesale, directory, and integrations."
        />
      </main>
    </BetaAppShell>
  );
}
