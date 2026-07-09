import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";

export default function AccountSettingsLoading() {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <HubPageMain className="mx-auto w-full max-w-[480px] ">
        <AccountModuleSkeleton />
      </HubPageMain>
    </BetaAppShell>
  );
}
