import { Suspense } from "react";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { AccountCenterModulePage } from "@/features/account-center/components/AccountCenterModulePage";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Buying · ROVEXO",
  description: "Orders, messages, saved items, and marketplace tools.",
};

async function BuyingModuleContent() {
  await fetchProfile();
  return (
    <AccountCenterModulePage
      moduleId="buying"
      description="Orders, saved items, trust, and discovery."
    />
  );
}

export default function BuyerPage() {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <HubPageMain className="mx-auto w-full max-w-[480px] ">
        <Suspense fallback={<AccountModuleSkeleton />}>
          <BuyingModuleContent />
        </Suspense>
      </HubPageMain>
    </BetaAppShell>
  );
}
