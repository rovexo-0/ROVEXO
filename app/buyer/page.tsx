import { Suspense } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Buyer · ROVEXO",
  description: "Orders, messages, saved items, and buyer tools.",
};

async function BuyerModuleContent() {
  const profile = await fetchProfile();
  return (
    <AccountCenterModulePage
      moduleId="buyer"
      profile={profile}
      description="Orders, saved items, trust, and discovery."
    />
  );
}

export default function BuyerPage() {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Suspense fallback={null}>
          <BuyerModuleContent />
        </Suspense>
      </main>
    </BetaAppShell>
  );
}
