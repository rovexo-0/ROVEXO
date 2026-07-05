import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";

export default function AccountSettingsLoading() {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <AccountModuleSkeleton />
      </main>
    </BetaAppShell>
  );
}
