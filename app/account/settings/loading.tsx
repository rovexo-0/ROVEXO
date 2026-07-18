import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";

export default function AccountSettingsLoading() {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <HubPageMain className="w-full max-w-none px-[16px]">
        <AccountModuleSkeleton />
      </HubPageMain>
    </BetaAppShell>
  );
}
