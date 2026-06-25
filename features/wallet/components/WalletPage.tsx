import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { MonthSummaryGrid } from "@/features/wallet/components/MonthSummaryGrid";
import { PayoutSetupSection } from "@/features/wallet/components/PayoutSetupSection";
import { PayoutStatusCard } from "@/features/wallet/components/PayoutStatusCard";
import { PendingBalanceCard } from "@/features/wallet/components/PendingBalanceCard";
import { RecentTransactionsSection } from "@/features/wallet/components/RecentTransactionsSection";
import { WalletHeader } from "@/features/wallet/components/WalletHeader";
import type { WalletData } from "@/lib/wallet/types";
import type { UserProfile } from "@/lib/profile/types";

type WalletPageProps = {
  profile: UserProfile;
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
};

export function WalletPage({ profile, data, backHref = "/seller/dashboard", connectMessage }: WalletPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <WalletHeader backHref={backHref} unreadNotifications={profile.unreadNotifications} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {connectMessage ? (
          <p className="rounded-ds-lg border border-primary/20 bg-primary/5 px-ds-4 py-ds-3 text-sm text-text-primary">
            {connectMessage}
          </p>
        ) : null}

        <PayoutStatusCard
          paidOutBalance={data.paidOutBalance}
          payoutsEnabled={data.connectStatus.payoutsEnabled}
        />

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

        <PayoutSetupSection connectStatus={data.connectStatus} />
      </main>
    </BetaAppShell>
  );
}
