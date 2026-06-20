import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AvailableBalanceCard } from "@/features/wallet/components/AvailableBalanceCard";
import { MonthSummaryGrid } from "@/features/wallet/components/MonthSummaryGrid";
import { PendingBalanceCard } from "@/features/wallet/components/PendingBalanceCard";
import { RecentTransactionsSection } from "@/features/wallet/components/RecentTransactionsSection";
import { WalletHeader } from "@/features/wallet/components/WalletHeader";
import { WithdrawMethodsSection } from "@/features/wallet/components/WithdrawMethodsSection";
import type { WalletData } from "@/lib/wallet/types";
import type { UserProfile } from "@/lib/profile/types";

type WalletPageProps = {
  profile: UserProfile;
  data: WalletData;
  backHref?: string;
};

export function WalletPage({ profile, data, backHref = "/seller/dashboard" }: WalletPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <WalletHeader backHref={backHref} unreadNotifications={profile.unreadNotifications} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <AvailableBalanceCard balance={data.availableBalance} />

        <PendingBalanceCard
          balance={data.pendingBalance}
          availableAt={data.pendingAvailableAt}
        />

        <MonthSummaryGrid
          revenue={data.monthSummary.revenue}
          withdrawn={data.monthSummary.withdrawn}
          fees={data.monthSummary.fees}
        />

        <RecentTransactionsSection transactions={data.transactions} />

        <WithdrawMethodsSection methods={data.withdrawMethods} />
      </main>
    </BetaAppShell>
  );
}
